# Purchase Backfill Utilities

## Overview

These utilities help you recover from situations where:
- Purchases were recorded but download tokens weren't created
- Tokens exist but emails were never sent
- Email service was down during checkout

## Files

```
src/utils/
├── generateMissingTokens.js    # Creates tokens for purchases that don't have them
├── sendMissingEmails.js        # Sends emails for purchases with tokens
└── backfillPurchases.js        # Combined: does both in one command
```

## Quick Start

### 1. Check what needs fixing (safe, read-only)

```bash
node src/utils/backfillPurchases.js --dry-run
```

This shows you:
- How many purchases are missing tokens
- How many emails would be sent
- Which email addresses would receive them

### 2. Fix everything at once

```bash
node src/utils/backfillPurchases.js
```

This will:
1. Generate tokens for purchases that don't have them
2. Send download emails to all purchases with tokens

### 3. Fix only specific issues

**Only generate missing tokens (don't send emails yet):**
```bash
node src/utils/backfillPurchases.js --skip-emails
```

**Only send emails (tokens already exist):**
```bash
node src/utils/backfillPurchases.js --skip-tokens
```

**Process only one email address:**
```bash
node src/utils/backfillPurchases.js --email rdxenv@gmail.com
```

**Process only first 5 purchases:**
```bash
node src/utils/backfillPurchases.js --limit 5
```

## Individual Utilities

### Generate Missing Tokens

```bash
node src/utils/generateMissingTokens.js
```

- Finds purchases without tokens in `guest_downloads` table
- Creates secure SHA-256 tokens
- Sets 30-day expiration
- Safe to run multiple times (won't create duplicates)

### Send Missing Emails

```bash
# Dry run first
node src/utils/sendMissingEmails.js --dry-run

# Send to specific email
node src/utils/sendMissingEmails.js --email customer@example.com

# Send to all
node src/utils/sendMissingEmails.js
```

Options:
- `--dry-run` - Show what would be sent without sending
- `--email EMAIL` - Only send to specific email
- `--limit N` - Only process N purchases
- `--help` - Show help message

## Use Cases

### Scenario 1: Email service was down during checkout

```bash
# Check the damage
node src/utils/backfillPurchases.js --dry-run

# Fix it (tokens exist, just send emails)
node src/utils/backfillPurchases.js --skip-tokens
```

### Scenario 2: Database migration created guest_downloads table late

```bash
# Generate all missing tokens and send emails
node src/utils/backfillPurchases.js
```

### Scenario 3: Resend email to one customer

```bash
node src/utils/sendMissingEmails.js --email customer@example.com
```

### Scenario 4: Test with a few purchases first

```bash
# Try with 3 purchases
node src/utils/backfillPurchases.js --limit 3

# If that works, do the rest
node src/utils/backfillPurchases.js
```

## Safety Features

✅ **Idempotent** - Safe to run multiple times, won't create duplicate tokens  
✅ **Dry run mode** - See what will happen before making changes  
✅ **Rate limiting** - 1 second delay between emails to avoid spam filters  
✅ **Error handling** - Failed emails don't stop the whole process  
✅ **Clear logging** - See exactly what's happening at each step

## Example Output

```
🚀 Starting purchase backfill process...

═══════════════════════════════════════════════════

STEP 1: Generate Missing Tokens
───────────────────────────────────────────────────

🔍 Looking for purchases without download tokens...

📋 Found 3 purchase(s) without tokens:

   Purchase #1: rdxenv@gmail.com - $1.29 on 2025-10-09
   Purchase #2: rdxenv@gmail.com - $1.29 on 2025-10-09
   Purchase #3: rdxenv@gmail.com - $1.29 on 2025-10-09

🎫 Generating token for purchase #1...
   ✅ Token created: 93bbabf8f772...

🎉 Successfully created 3 token(s)!

═══════════════════════════════════════════════════

STEP 2: Send Download Emails
───────────────────────────────────────────────────

🔍 Looking for purchases with tokens but no emails sent...

📧 Sending email to rdxenv@gmail.com for purchase #1...
   ✅ Email sent! Message ID: <abc123@smtp.gmail.com>

📊 Summary:
   ✅ Sent: 3
   ❌ Failed: 0
   📧 Total processed: 3

═══════════════════════════════════════════════════

📊 FINAL SUMMARY
───────────────────────────────────────────────────
   🎫 Tokens created: 3
   ✅ Emails sent: 3
   ❌ Emails failed: 0
═══════════════════════════════════════════════════

✨ All done!
```

## Troubleshooting

**"No purchases found to process"**  
- Good news! Everything is up to date.

**"Failed to send email: Authentication failed"**  
- Check EMAIL_USER and EMAIL_APP_PASSWORD env vars
- Verify Gmail App Password is still valid

**"Error: No cart items found"**  
- This error is from the webhook handler, not these utilities
- These utilities work directly with purchases table and don't need cart items

**Want to verify tokens were created?**
```sql
-- Connect to database
gcloud sql connect interstellar-db --user=appuser --database=interstellar_packages

-- Check tokens
SELECT p.id, p.email, gd.token, gd.expires_at 
FROM purchases p 
JOIN guest_downloads gd ON gd.purchase_id = p.id 
ORDER BY p.id;
```

## When to Use

Run these utilities when:
- Email service credentials were missing during purchases
- Database migration was deployed late
- Webhook failed but purchases were recorded
- Customer requests resend of download link
- Testing email templates with real data

## Integration with Your Workflow

You can add these to your deployment checklist:

```bash
# After deploying a fix
npm run deploy

# Then backfill any affected purchases
node src/utils/backfillPurchases.js --dry-run
node src/utils/backfillPurchases.js
```

Or create npm scripts in `package.json`:

```json
{
  "scripts": {
    "backfill:check": "node src/utils/backfillPurchases.js --dry-run",
    "backfill:run": "node src/utils/backfillPurchases.js",
    "backfill:tokens": "node src/utils/generateMissingTokens.js",
    "backfill:emails": "node src/utils/sendMissingEmails.js"
  }
}
```

Then use:
```bash
npm run backfill:check
npm run backfill:run
```