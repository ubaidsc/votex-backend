const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send voter credentials email
  async sendVoterCredentials(email, name, cnic, password) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Voting System - Your Login Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563EB;">Secure Online Voting System</h2>
            <p>Dear ${name},</p>
            <p>You have been registered as a voter in our secure online voting system. Here are your login credentials:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>CNIC:</strong> ${cnic}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            <p>Please use these credentials to log in at <a href="http://example.com/voter-login">our voting portal</a>.</p>
            <p>For security reasons, we recommend changing your password after your first login.</p>
            <p style="color: #dc2626; font-weight: bold;">Important: Do not share your credentials with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact the system administrator.</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Voter credentials email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending voter credentials email: ${error.message}`);
      throw new Error('Failed to send voter credentials email');
    }
  }

  // Test email connection
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready to send messages');
      return true;
    } catch (error) {
      logger.error(`Email service connection error: ${error.message}`);
      return false;
    }
  }
}

module.exports = new EmailService();