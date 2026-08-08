const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: 'contact@adihuman.com',
    pass: 'kmgw ccqk trla rtns'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Send contact form email
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message } = req.body;

    // Email options with professional template
    const mailOptions = {
      from: 'contact@adihuman.com',
      to: 'contact@adihuman.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a;">
            
            <!-- Header with Black Background and Logo -->
            <div style="background-color: #000000; padding: 40px; text-align: center; border-bottom: 3px solid #FFD700;">
              <div style="background-color: #000000; width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700;">
                <img src="https://catalog.adihuman.com/images/logo.png" alt="Adihuman Logo" style="width: 70px; height: 70px; object-fit: contain;">
              </div>
              <h1 style="color: #FFD700; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">
                New Inquiry
              </h1>
              <p style="color: #cccccc; margin: 15px 0 0; font-size: 16px; font-weight: 400;">
                You have received a new message from your website
              </p>
            </div>

            <!-- Content Section -->
            <div style="padding: 40px; background-color: #0a0a0a;">
              
              <!-- Contact Details Card -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
                <div style="display: flex; align-items: center; margin-bottom: 25px;">
                  <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="font-size: 20px;">👤</span>
                  </div>
                  <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                    Contact Information
                  </h2>
                </div>
                
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                  <p style="color: #FFD700; margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                    From
                  </p>
                  <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
                    ${name}
                  </p>
                </div>
                
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #333;">
                  <p style="color: #FFD700; margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                    Email Address
                  </p>
                  <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 500;">
                    <a href="mailto:${email}" style="color: #FFD700; text-decoration: none; font-weight: 600;">${email}</a>
                  </p>
                </div>
                
                <div>
                  <p style="color: #FFD700; margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                    Submitted On
                  </p>
                  <p style="color: #cccccc; margin: 0; font-size: 14px; font-weight: 400;">
                    ${new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <!-- Message Section -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 16px; padding: 30px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
                <div style="display: flex; align-items: center; margin-bottom: 25px;">
                  <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <span style="font-size: 20px;">💬</span>
                  </div>
                  <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                    Message
                  </h2>
                </div>
                <div style="background-color: #000000; padding: 25px; border-radius: 12px; border-left: 4px solid #FFD700; margin-top: 20px;">
                  <p style="color: #ffffff; margin: 0; line-height: 1.8; font-size: 16px; white-space: pre-wrap; font-weight: 400;">
                    ${message}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="margin-top: 35px; text-align: center;">
                <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;">
                  📧 Reply to ${name}
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #000000; padding: 40px; text-align: center; border-top: 1px solid #333;">
              <div style="margin-bottom: 20px;">
                <img src="https://catalog.adihuman.com/images/logo.png" alt="Adihuman Logo" style="width: 50px; height: 50px; object-fit: contain; opacity: 0.8;">
              </div>
              <p style="color: #FFD700; margin: 0 0 8px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                ADIHUMAN
              </p>
              <p style="color: #473a3a; margin: 0 0 25px; font-size: 14px; font-weight: 400;">
                Premium Customized Products & Solutions
              </p>
              <div style="margin: 25px 0; padding: 20px; background-color: #1a1a1a; border-radius: 12px; border: 1px solid #333;">
                <a href="https://adihuman.com" style="color: #FFD700; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 600;">Website</a>
                <span style="color: #444;">•</span>
                <a href="https://catalog.adihuman.com" style="color: #FFD700; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 600;">Catalog</a>
                <span style="color: #444;">•</span>
                <a href="mailto:contact@adihuman.com" style="color: #FFD700; text-decoration: none; margin: 0 15px; font-size: 14px; font-weight: 600;">Contact</a>
              </div>
              <p style="color: #555555; margin: 0; font-size: 12px; font-weight: 400;">
                © ${new Date().getFullYear()} Adihuman. All rights reserved.
              </p>
              <p style="color: #444444; margin: 10px 0 0; font-size: 11px; font-weight: 400;">
                This message was sent from the Adihuman contact form
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending email',
      error: error.message 
    });
  }
});

module.exports = router;