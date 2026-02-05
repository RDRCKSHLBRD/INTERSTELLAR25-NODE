#!/bin/bash

# --- CONFIGURATION ---
TARGET_DIR="."
OUT_DIR="../"

TEXT_FILE="${OUT_DIR}INTERSTELLAR_CODEX_PRIME.txt"
JSON_FILE="${OUT_DIR}INTERSTELLAR_CODEX_META.json"
MAP_FILE="${OUT_DIR}INTERSTELLAR_CODEX_MAP.txt"

echo "________________________________________________________"
echo "INITIATING INTERSTELLAR CODEX SCAN (v2.0)"
echo "TARGET: $TARGET_DIR"
echo "________________________________________________________"

# 1. CLEAN START
echo "" > "$TEXT_FILE"
echo "[" > "$JSON_FILE"

# 2. GENERATE MAP (Trajectory)
echo "[1/3] Mapping Trajectory..."
{
  echo "INTERSTELLAR CODEX MAP - TRAJECTORY TRACE"
  echo "========================================="
  echo "Target: $TARGET_DIR"
  echo "Sorted by Recent Activity (Newest Top)"
  echo "-----------------------------------------"
  # Find files matching criteria and sort by time
  find "$TARGET_DIR" -type f \
    -not -path '*/node_modules/*' \
    -not -path '*/.git/*' \
    -not -path '*/images/*' \
    -not -path '*/mp4/*' \
    -not -path '*/svg/*' \
    -not -path '*/reports/*' \
    -not -path '*/dist/*' \
    -not -name 'package-lock.json' \
    -not -name '.DS_Store' \
    -not -name 'codex.sh' \
    \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.json' -o -name '*.html' -o -name '*.css' -o -name '*.ejs' -o -name '*.sql' -o -name '*.md' \) \
    -print0 | xargs -0 ls -ltT 2>/dev/null
} > "$MAP_FILE"

# 3. GENERATE TEXT AND JSON (The Loop)
echo "[2/3] Processing Content & Metadata..."

# We set a flag to handle the comma for JSON
FIRST_ITEM=true

# Iterate through the file list from the Map (safest way to ensure match)
# We skip the first 5 lines of MAP_FILE which are headers
tail -n +6 "$MAP_FILE" | awk '{print $NF}' | while read -r FILE_PATH; do
  
  # SKIP if file doesn't exist (safety check)
  if [ ! -f "$FILE_PATH" ]; then continue; fi

  # --- A. APPEND TO TEXT CODEX ---
  echo -e "\n\n________________________________________________________________________________" >> "$TEXT_FILE"
  echo "FILE: $FILE_PATH" >> "$TEXT_FILE"
  echo "________________________________________________________________________________" >> "$TEXT_FILE"
  cat "$FILE_PATH" >> "$TEXT_FILE"

  # --- B. APPEND TO JSON CODEX ---
  # Handle comma for valid JSON array
  if [ "$FIRST_ITEM" = true ]; then
    FIRST_ITEM=false
  else
    echo "," >> "$JSON_FILE"
  fi

  # Generate JSON object based on OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    stat -f '  { "path": "%N", "size_bytes": %z, "modified_ts": %m }' "$FILE_PATH" >> "$JSON_FILE"
  else
    stat -c '  { "path": "%n", "size_bytes": %s, "modified_ts": %Y }' "$FILE_PATH" >> "$JSON_FILE"
  fi

done

# Close JSON array
echo "]" >> "$JSON_FILE"

echo "________________________________________________________"
echo "MISSION COMPLETE."
echo "1. Text: $TEXT_FILE"
echo "2. Map:  $MAP_FILE"
echo "3. Meta: $JSON_FILE"
echo "________________________________________________________"