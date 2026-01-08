// api/send-support-ticket.js
import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
// Only allow POST requests
if (req.method !== 'POST') {
  console.log('❌ Method not allowed:', req.method);
return res.status(405).json({ 
  success: false, 
  message: 'Method not allowed' 
  });
  }

try {
  console.log('📧 Received support ticket request');

// Extract data from request
  const { ticketId, userEmail, message, isFirstMessage, currentYear } = req.body;

// Validate required fields
if (!ticketId || !userEmail || !message) {
  console.log('❌ Missing required fields:', { ticketId, userEmail, message: message ? 'present' : 'missing' });
return res.status(400).json({ 
  success: false, 
  message: 'Missing required fields' 
  });
  }

  console.log(`📋 Ticket Details:
  - Ticket ID: ${ticketId}
  - User Email: ${userEmail}
  - Message Length: ${message.length} characters
  - Status: ${isFirstMessage}
  - Year: ${currentYear}`);

// Read the HTML template
  const templatePath = path.join(process.cwd(), 'public', 'Templates', 'Support-Template.html');
  console.log(`📄 Reading template from: ${templatePath}`);

  let htmlTemplate;
try {
  htmlTemplate = await fs.readFile(templatePath, 'utf8');
  console.log('✅ Template read successfully');
  } catch (error) {
  console.error('❌ Failed to read template:', error.message);
  return res.status(500).json({ 
  success: false, 
  message: 'Failed to load email template' 
  });
  }

// Replace placeholders with actual data
  const emailHtml = htmlTemplate
  .replace(/{{ticketId}}/g, ticketId)
  .replace(/{{userEmail}}/g, userEmail)
  .replace(/{{message}}/g, message.replace(/\n/g, '<br>'))
  .replace(/{{isFirstMessage}}/g, isFirstMessage)
  .replace(/{{currentYear}}/g, currentYear);

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
auth: {
  user: 'globalnaijascholars@gmail.com',
  pass: 'wqjt zptv drhm dhds'
  }
  });

// Email configuration
  const subject = isFirstMessage === 'NEW' 
  ? `Scholars Support` 
  : `Scholars Support`;

const mailOptions = {
  from: `"Global Scholars Support" <globalnaijascholars@gmail.com>`,
  to: 'globalnaijascholars@gmail.com',
  subject: subject,
  html: emailHtml,
  text: `Ticket ID: ${ticketId}\nUser Email: ${userEmail}\nMessage: ${message}\nStatus: ${isFirstMessage}`,
  replyTo: userEmail
};

  console.log('✉️ Sending email...');

// Send email
  const info = await transporter.sendMail(mailOptions);

  console.log(`✅ Email sent successfully!`);
  console.log(`📬 Message ID: ${info.messageId}`);
  console.log(`👤 From: ${mailOptions.from}`);
  console.log(`📧 To: ${mailOptions.to}`);
  console.log(`📝 Subject: ${subject}`);
  console.log(`🔗 Response: ${info.response}`);

// Return success response
return res.status(200).json({ 
  success: true, 
  message: 'Support ticket sent successfully',
  ticketId: ticketId,
  messageId: info.messageId
  });

  } catch (error) {
  console.error('❌ Error sending support ticket:', error.message);
  console.error('🔍 Error details:', error);

return res.status(500).json({ 
  success: false, 
  message: 'Failed to send support ticket',
  error: error.message
  });
  }
}
