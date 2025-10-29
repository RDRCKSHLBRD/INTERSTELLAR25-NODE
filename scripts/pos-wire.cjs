#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const WRITE = process.argv.includes('--write');

function listFiles(dir, ext) {
  const out = [];
  (function walk(d){
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (!ext || p.endsWith(ext)) out.push(p);
    }
  })(dir);
  return out;
}

function readJSONPositions(dir) {
  const files = listFiles(dir, '.json');
  const keys = new Set();
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (j && j.positions && typeof j.positions === 'object') {
        for (const k of Object.keys(j.positions)) keys.add(k);
      }
    } catch(_){}
  }
  return [...keys].sort();
}

function scanHTML(root) {
  const htmlFiles = listFiles(root, '.html');
  const dataPos = new Set();
  const ids = new Set();
  const idLocations = {}; // id -> [{file,line}]

  for (const f of htmlFiles) {
    const txt = fs.readFileSync(f, 'utf8');
    const lines = txt.split(/\r?\n/);

    for (const m of txt.matchAll(/data-position="([^"]+)"/g)) dataPos.add(m[1]);
    for (const m of txt.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);

    // record line numbers for ids
    for (const id of ids) {
      if (!idLocations[id]) idLocations[id] = [];
    }
    for (let i=0;i<lines.length;i++){
      const line = lines[i];
      for (const m of line.matchAll(/id="([^"]+)"/g)) {
        const id = m[1];
        (idLocations[id] ||= []).push({file:f,line:i+1});
      }
    }
  }
  return { htmlFiles, dataPos: [...dataPos].sort(), ids: [...ids].sort(), idLocations };
}

function diff(a, b) {
  const A = new Set(a), B = new Set(b);
  return [...A].filter(x => !B.has(x)).sort();
}

function intersect(a, b) {
  const B = new Set(b);
  return a.filter(x => B.has(x)).sort();
}

function injectDataPositionInFile(filePath, keys) {
  let txt = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const key of keys) {
    // if element with id="key" exists and same tag lacks data-position, inject it
    const re = new RegExp(`(<[^>]*\\bid=\\"${key}\\"[^>]*)(>)`, 'i');
    const already = new RegExp(`<[^>]*\\bid=\\"${key}\\"[^>]*data-position=`,'i');
    if (already.test(txt)) continue;
    if (re.test(txt)) {
      txt = txt.replace(re, `$1 data-position=\"${key}\"$2`);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(filePath, txt);
  return changed;
}

function main(){
  const posKeys = readJSONPositions(path.join('config','pages'));
  const { htmlFiles, dataPos, ids, idLocations } = scanHTML('public');

  const missingDataPos = diff(posKeys, dataPos);
  const keysAsIds = intersect(posKeys, ids);
  const actionable = diff(keysAsIds, dataPos);

  const report = {
    mode: WRITE ? 'wire' : 'audit',
    counts: {
      posKeys: posKeys.length,
      dataPositions: dataPos.length,
      ids: ids.length,
      missingDataPos: missingDataPos.length,
      actionable: actionable.length
    },
    posKeys,
    dataPos,
    ids,
    missingDataPos,
    keysAsIds,
    actionable,
    idLocations: Object.fromEntries(actionable.map(k => [k, idLocations[k] || []]))
  };

  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const outDir = path.join('reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});
  const outFile = path.join(outDir, `pos-audit-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  if (WRITE && actionable.length) {
    const perFileKeys = new Map();
    for (const key of actionable) {
      const locs = idLocations[key] || [];
      for (const {file} of locs) {
        const arr = perFileKeys.get(file) || [];
        arr.push(key);
        perFileKeys.set(file, arr);
      }
    }
    let filesChanged = 0;
    for (const [file, keys] of perFileKeys) {
      if (injectDataPositionInFile(file, keys)) filesChanged++;
    }
    const { dataPos: afterDataPos } = scanHTML('public');
    const remaining = diff(posKeys, afterDataPos);
    const after = { filesChanged, remaining };
    const afterFile = path.join(outDir, `pos-audit-after-${stamp}.json`);
    fs.writeFileSync(afterFile, JSON.stringify(after, null, 2));
    console.log('WIRED', { filesChanged, remainingCount: remaining.length, report: outFile, after: afterFile });
  } else {
    console.log('AUDIT', { report: outFile, missing: missingDataPos.length, actionable: actionable.length });
  }
}

main();
