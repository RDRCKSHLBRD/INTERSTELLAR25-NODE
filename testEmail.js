// testEmail.js - Quick test to verify email configuration
import { sendGuestDownloadEmail, testEmailConfig } from './src/utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

async function runEmailTest() {
  console.log('🧪 Testing email configuration...\n');
  
  // Test 1: Verify email config
  console.log('1️⃣ Testing email configuration...');
  const configValid = await testEmailConfig();
  
  if (!configValid) {
    console.log('❌ Email configuration failed. Check your .env file:');
    console.log('   EMAIL_USER=interstellarpackages@gmail.com');
    console.log('   EMAIL_APP_PASSWORD=your-16-char-app-password');
    return;
  }
  
  // Test 2: Send a test download email
  console.log('\n2️⃣ Sending test download email...');
  
  const testEmail = process.env.TEST_EMAIL || 'rdxenv@gmail.com';
  const mockDownloadToken = {
    token: 'test-token-12345',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  };
  
  const mockPurchaseDetails = {
    purchaseId: 999,
    totalAmount: 13.29,
    currency: 'usd'
  };
  
  const mockPurchasedItems = [
    { name: 'Ambient Garden One (Album)', price: '12.00', quantity: 1, type: 'album' },
    { name: 'Robot\'s Dream', price: '1.29', quantity: 1, type: 'song' }
  ];
  
  try {
    const result = await sendGuestDownloadEmail({
      email: testEmail,
      downloadToken: mockDownloadToken,
      purchaseDetails: mockPurchaseDetails,
      purchasedItems: mockPurchasedItems
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`🔗 Download URL: ${result.downloadUrl}`);
    console.log(`📬 Check ${testEmail} for the test email`);
    
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Make sure 2-factor authentication is enabled on Gmail');
      console.log('   - Generate an App Password (not your regular password)');
      console.log('   - Use the 16-character app password in EMAIL_APP_PASSWORD');
    }
  }
}

// Run the test
runEmailTest();