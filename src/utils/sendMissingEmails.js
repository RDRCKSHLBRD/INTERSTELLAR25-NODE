// src/utils/sendMissingEmails.js
// Utility to send download emails for purchases that have tokens but no email record
import { sendGuestDownloadEmail } from './emailService.js';
import { query } from '../config/database.js';

async function sendMissingEmails(options = {}) {
  const { dryRun = false, limit = null, email = null } = options;
  
  console.log('🔍 Looking for purchases with tokens but no emails sent...\n');
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No emails will actually be sent\n');
  }

  try {
    // Find purchases with tokens but no email sent
    // We'll track email sends by checking if accessed_at is null (never accessed = email not sent yet)
    let findQuery = `
      SELECT 
        p.id as purchase_id,
        p.email,
        p.purchased_at,
        p.total_amount,
        gd.token,
        gd.expires_at,
        gd.created_at as token_created_at
      FROM purchases p
      JOIN guest_downloads gd ON gd.purchase_id = p.id
      WHERE p.email IS NOT NULL
      ORDER BY p.purchased_at DESC
    `;
    
    const params = [];
    
    if (email) {
      findQuery = findQuery.replace('ORDER BY', 'AND p.email = $1 ORDER BY');
      params.push(email);
    }
    
    if (limit) {
      findQuery += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await query(findQuery, params);
    
    if (result.rows.length === 0) {
      console.log('✅ No purchases found to process.\n');
      return { sent: 0, failed: 0, emails: [] };
    }

    console.log(`📋 Found ${result.rows.length} purchase(s) with tokens:\n`);
    result.rows.forEach(p => {
      console.log(`   Purchase #${p.purchase_id}: ${p.email} - $${p.total_amount}`);
      console.log(`      Token: ${p.token.substring(0, 16)}...`);
      console.log(`      Expires: ${p.expires_at}`);
      console.log('');
    });

    if (dryRun) {
      console.log('🧪 DRY RUN - Would send emails to the above addresses');
      return { sent: 0, failed: 0, emails: result.rows };
    }

    // Send emails
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const purchase of result.rows) {
      console.log(`📧 Sending email to ${purchase.email} for purchase #${purchase.purchase_id}...`);
      
      try {
        const emailResult = await sendGuestDownloadEmail({
          to: purchase.email,
          token: purchase.token
        });
        
        console.log(`   ✅ Email sent! Message ID: ${emailResult.messageId}\n`);
        
        results.push({
          purchaseId: purchase.purchase_id,
          email: purchase.email,
          success: true,
          messageId: emailResult.messageId
        });
        
        sent++;
        
        // Small delay between emails to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Failed to send: ${error.message}\n`);
        
        results.push({
          purchaseId: purchase.purchase_id,
          email: purchase.email,
          success: false,
          error: error.message
        });
        
        failed++;
      }
    }

    console.log('📊 Summary:');
    console.log(`   ✅ Sent: ${sent}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📧 Total processed: ${results.length}\n`);
    
    return { sent, failed, emails: results };
    
  } catch (error) {
    console.error('❌ Error processing emails:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    limit: null,
    email: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--email':
        options.email = args[++i];
        break;
      case '--help':
        console.log(`
Usage: node sendMissingEmails.js [options]

Options:
  --dry-run       Show what would be sent without actually sending
  --limit N       Only process N purchases
  --email EMAIL   Only send to specific email address
  --help          Show this help message

Examples:
  node sendMissingEmails.js --dry-run
  node sendMissingEmails.js --email rdxenv@gmail.com
  node sendMissingEmails.js --limit 5
        `);
        process.exit(0);
    }
  }
  
  return options;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  sendMissingEmails(options)
    .then(result => {
      if (!options.dryRun) {
        console.log(`🎉 Done! Sent ${result.sent} email(s), ${result.failed} failed.`);
      }
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { sendMissingEmails };