// src/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter - supports both Gmail and Google Workspace
const createTransporter = () => {
  // Check if using custom domain (Google Workspace) or regular Gmail
  const isGoogleWorkspace = process.env.EMAIL_USER?.includes('@interstellarpackages.com');
  
  if (isGoogleWorkspace) {
    // Google Workspace configuration
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // downloads@interstellarpackages.com
        pass: process.env.EMAIL_APP_PASSWORD // Google Workspace App Password
      }
    });
  } else {
    // Regular Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // interstellarpackages@gmail.com or rdxenv3@gmail.com
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
      }
    });
  }
};

/**
 * Sends download link email to guest purchaser
 * @param {Object} params
 * @param {string} params.email - Recipient email
 * @param {Object} params.downloadToken - Token object with token and expiresAt
 * @param {Object} params.purchaseDetails - Purchase information
 * @param {Array} params.purchasedItems - Array of purchased items
 */
export async function sendGuestDownloadEmail({ 
  email, 
  downloadToken, 
  purchaseDetails, 
  purchasedItems = [] 
}) {
  try {
    console.log(`📧 Sending download email to: ${email}`);
    
    const transporter = createTransporter();
    
    // Create download URL
    const downloadUrl = `${process.env.CLIENT_URL}/guest-downloads/${downloadToken.token}`;
    
    // Format expiration date
    const expirationDate = new Date(downloadToken.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create items list for email
    const itemsList = purchasedItems.length > 0 
      ? purchasedItems.map(item => `• ${item.name} - $${item.price}`).join('\n')
      : 'Your purchased items';
    
    // Email content
    const subject = 'Your Interstellar Packages Download is Ready!';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #083D5E, #3AA0A0); color: white; padding: 30px; text-align: center; border-radius: 2px 2px 0 0; }
          .content { background: #d1e2e5; padding: 30px; border-radius: 0 0 8px 8px; }
          .download-button { 
            display: inline-block; 
            background: #3AA0A0; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 2px; 
            font-weight: 300; 
            margin: 20px 0;
          }
          .items-list { background: white; padding: 20px; border-left: 2px solid #3AA0A0; margin: 20px 0; }
          .footer { text-align: center; color: #3D6C9B; margin-top: 30px; font-size: 14px; }
          .warning { background: #bfd4d6; border: 1px solid #367687; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interstellar Packages</h1>
            <h2>Your Download is Ready!</h2>
          </div>
          
          <div class="content">
            <p>Thank you for your purchase! Your ambient electronic music is ready for download.</p>
            
            <div class="items-list">
              <h3>Your Purchase:</h3>
              <pre>${itemsList}</pre>
              <p><strong>Total: $${purchaseDetails.totalAmount} ${purchaseDetails.currency.toUpperCase()}</strong></p>
            </div>
            
            <p>Click the button below to access your secure download page:</p>
            
            <div style="text-align: center;">
              <a href="${downloadUrl}" class="download-button">
                🎵 Download Your Music
              </a>
            </div>
            
            <div class="warning">
              <p><strong>⏰ Important:</strong> This download link expires on <strong>${expirationDate}</strong> (30 days from purchase).</p>
              <p>Save your files to your device before this date!</p>
            </div>
            
            <p>Your download includes:</p>
            <ul>
              <li>High-quality MP3 files</li>
              <li>WAV files (when available)</li>
              <li>Digital liner notes and artwork</li>
            </ul>
            
            <p>Having trouble? Just reply to this email for support.</p>
            
            <p>Enjoy the ambient journey!</p>
            <p><strong>Roderick Shoolbraid</strong><br>
            <em>Interstellar Packages</em></p>
          </div>
          
          <div class="footer">
            <p>© 2025 Interstellar Packages | Ambient Electronic Music</p>
            <p>This email was sent to ${email} for your recent purchase.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
🎵 INTERSTELLAR PACKAGES - Your Download is Ready!

Thank you for your purchase! Your ambient electronic music is ready for download.

Your Purchase:
${itemsList}
Total: $${purchaseDetails.totalAmount} ${purchaseDetails.currency.toUpperCase()}

Download Link: ${downloadUrl}

⏰ IMPORTANT: This link expires on ${expirationDate} (30 days from purchase).

Your download includes high-quality MP3 files, WAV files (when available), and digital liner notes.

Having trouble? Just reply to this email for support.

Enjoy the ambient journey!
Roderick Shoolbraid
Interstellar Packages

© 2025 Interstellar Packages | Ambient Electronic Music
    `;
    
    // Send email
    const fromName = process.env.EMAIL_USER?.includes('@interstellarpackages.com') 
      ? '"Interstellar Packages" <downloads@interstellarpackages.com>'
      : '"Interstellar Packages" <interstellarpackages@gmail.com>';
      
    const mailOptions = {
      from: fromName,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}:`, result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      downloadUrl: downloadUrl
    };
    
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error);
    throw error;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}