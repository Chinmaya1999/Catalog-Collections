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
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <img src="https://adihuman.com/images/logo.png" alt="Adihuman Logo" style="width: 60px; height: 60px; object-fit: contain;">
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                New Contact Form Submission
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">
                Someone has reached out through your website
              </p>
            </div>

            <!-- Content Section -->
            <div style="padding: 40px;">
              
              <!-- Contact Details Card -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: #333; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
                  Contact Information
                </h2>
                
                <div style="margin-bottom: 15px;">
                  <p style="color: #666; margin: 0 0 5px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    From
                  </p>
                  <p style="color: #333; margin: 0; font-size: 18px; font-weight: 500;">
                    ${name}
                  </p>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <p style="color: #666; margin: 0 0 5px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Email Address
                  </p>
                  <p style="color: #333; margin: 0; font-size: 18px; font-weight: 500;">
                    <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                  </p>
                </div>
                
                <div>
                  <p style="color: #666; margin: 0 0 5px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Submitted On
                  </p>
                  <p style="color: #333; margin: 0; font-size: 16px;">
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
              <div style="background-color: #ffffff; border: 2px solid #e9ecef; padding: 25px; border-radius: 8px;">
                <h2 style="color: #333; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
                  Message
                </h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 3px solid #764ba2;">
                  <p style="color: #333; margin: 0; line-height: 1.6; font-size: 16px; white-space: pre-wrap;">
                    ${message}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="margin-top: 30px; text-align: center;">
                <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                  Reply to ${name}
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0 0 10px; font-size: 14px;">
                <strong>Adihuman Innovation Studio</strong>
              </p>
              <p style="color: #888; margin: 0 0 15px; font-size: 13px;">
                Premium Customized Products & Solutions
              </p>
              <div style="margin: 20px 0;">
                <a href="https://adihuman.com" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 14px;">Website</a>
                <span style="color: #ccc;">|</span>
                <a href="https://catalog.adihuman.com" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 14px;">Catalog</a>
                <span style="color: #ccc;">|</span>
                <a href="mailto:contact@adihuman.com" style="color: #667eea; text-decoration: none; margin: 0 10px; font-size: 14px;">Contact</a>
              </div>
              <p style="color: #999; margin: 0; font-size: 12px;">
                This message was sent from the Adihuman contact form at ${new Date().toLocaleString()}
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