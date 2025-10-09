// src/utils/backfillPurchases.js
// Combined utility to generate tokens and send emails for existing purchases
import { generateMissingTokens } from './generateMissingTokens.js';
import { sendMissingEmails } from './sendMissingEmails.js';

async function backfillPurchases(options = {}) {
  const { 
    dryRun = false, 
    skipTokens = false, 
    skipEmails = false,
    email = null,
    limit = null 
  } = options;
  
  console.log('🚀 Starting purchase backfill process...\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  const results = {
    tokensCreated: 0,
    emailsSent: 0,
    emailsFailed: 0
  };

  try {
    // Step 1: Generate missing tokens
    if (!skipTokens) {
      console.log('STEP 1: Generate Missing Tokens');
      console.log('───────────────────────────────────────────────────\n');
      
      const tokenResult = await generateMissingTokens();
      results.tokensCreated = tokenResult.created;
      
      if (tokenResult.created > 0) {
        console.log(`✨ Created ${tokenResult.created} new token(s)\n`);
      }
      
      console.log('═══════════════════════════════════════════════════\n');
    }

    // Step 2: Send missing emails
    if (!skipEmails) {
      console.log('STEP 2: Send Download Emails');
      console.log('───────────────────────────────────────────────────\n');
      
      const emailResult = await sendMissingEmails({ 
        dryRun, 
        email, 
        limit 
      });
      
      results.emailsSent = emailResult.sent;
      results.emailsFailed = emailResult.failed;
      
      console.log('═══════════════════════════════════════════════════\n');
    }

    // Final summary
    console.log('📊 FINAL SUMMARY');
    console.log('───────────────────────────────────────────────────');
    console.log(`   🎫 Tokens created: ${results.tokensCreated}`);
    console.log(`   ✅ Emails sent: ${results.emailsSent}`);
    console.log(`   ❌ Emails failed: ${results.emailsFailed}`);
    console.log('═══════════════════════════════════════════════════\n');

    return results;

  } catch (error) {
    console.error('💥 Backfill process failed:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    skipTokens: false,
    skipEmails: false,
    email: null,
    limit: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-tokens':
        options.skipTokens = true;
        break;
      case '--skip-emails':
        options.skipEmails = true;
        break;
      case '--email':
        options.email = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
🔧 Purchase Backfill Utility
═══════════════════════════════════════════════════

This utility helps recover from situations where purchases were
recorded but download tokens weren't created or emails weren't sent.

Usage: node backfillPurchases.js [options]

Options:
  --dry-run        Show what would be done without making changes
  --skip-tokens    Skip token generation (only send emails)
  --skip-emails    Skip email sending (only generate tokens)
  --email EMAIL    Only process purchases for specific email
  --limit N        Only process N purchases
  --help           Show this help message

Examples:
  # See what would happen (safe)
  node backfillPurchases.js --dry-run

  # Generate tokens and send emails for all purchases
  node backfillPurchases.js

  # Only send emails for one specific purchase
  node backfillPurchases.js --skip-tokens --email rdxenv@gmail.com

  # Generate tokens only, don't send emails yet
  node backfillPurchases.js --skip-emails

  # Process just the first 5 purchases
  node backfillPurchases.js --limit 5

What it does:
  1. Finds purchases without download tokens → creates them
  2. Finds purchases with tokens → sends download emails

Safe to run multiple times! It only processes missing items.
        `);
        process.exit(0);
    }
  }
  
  return options;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  backfillPurchases(options)
    .then(results => {
      const hasFailures = results.emailsFailed > 0;
      console.log(hasFailures ? '⚠️  Completed with some failures' : '✨ All done!');
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { backfillPurchases };