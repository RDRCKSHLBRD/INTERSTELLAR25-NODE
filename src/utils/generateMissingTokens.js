// src/utils/generateMissingTokens.js
// Utility to generate download tokens for purchases that don't have them
import crypto from 'crypto';
import { query } from '../config/database.js';

async function generateMissingTokens() {
  console.log('🔍 Looking for purchases without download tokens...\n');

  try {
    // Find purchases that don't have tokens
    const findQuery = `
      SELECT p.id, p.email, p.purchased_at, p.total_amount
      FROM purchases p
      LEFT JOIN guest_downloads gd ON gd.purchase_id = p.id
      WHERE gd.id IS NULL AND p.email IS NOT NULL
      ORDER BY p.purchased_at DESC
    `;
    
    const result = await query(findQuery);
    
    if (result.rows.length === 0) {
      console.log('✅ All purchases have tokens! Nothing to do.\n');
      return { created: 0, purchases: [] };
    }

    console.log(`📋 Found ${result.rows.length} purchase(s) without tokens:\n`);
    result.rows.forEach(p => {
      console.log(`   Purchase #${p.id}: ${p.email} - $${p.total_amount} on ${p.purchased_at}`);
    });
    console.log('');

    // Generate tokens for each purchase
    const created = [];
    
    for (const purchase of result.rows) {
      console.log(`🎫 Generating token for purchase #${purchase.id}...`);
      
      // Generate secure token
      const tokenData = `${purchase.email}-${purchase.id}-${Date.now()}-${Math.random()}`;
      const token = crypto.createHash('sha256').update(tokenData).digest('hex');
      
      // Set expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Insert token
      const insertQuery = `
        INSERT INTO guest_downloads (email, purchase_id, token, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, token
      `;
      
      const tokenResult = await query(insertQuery, [
        purchase.email,
        purchase.id,
        token,
        expiresAt
      ]);
      
      created.push({
        purchaseId: purchase.id,
        email: purchase.email,
        token: tokenResult.rows[0].token,
        tokenId: tokenResult.rows[0].id
      });
      
      console.log(`   ✅ Token created: ${token.substring(0, 12)}...`);
    }

    console.log(`\n🎉 Successfully created ${created.length} token(s)!\n`);
    
    return { created: created.length, purchases: created };
    
  } catch (error) {
    console.error('❌ Error generating tokens:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMissingTokens()
    .then(result => {
      console.log('📊 Summary:');
      console.log(`   Tokens created: ${result.created}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { generateMissingTokens };