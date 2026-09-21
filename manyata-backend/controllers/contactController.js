// manyata-backend/controllers/contactController.js
const nodemailer = require('nodemailer');
// const db = require('../config/db'); // To save messages to DB
const sendContactUsMessageSchema = require ('../schemas/contact/send_contact_us_message.contact.schema');
const sendEmail = require('../services/nodemailer/send_email.nodemailer.service');
const { ZodError } = require('zod');
const contactUsEmailTemplate = require('../templates/email/contact_us.email.template');
require('dotenv').config();

// @route   POST /api/contact
// @desc    Submit contact form and send email
exports.submitContact = async (req, res) => {

  try {
    const data = sendContactUsMessageSchema.parse(req.body);
    const template= contactUsEmailTemplate(data);
    await sendEmail(process.env.CONTACT_SERVICE_EMAIL, template);
    res.status(200).json({ message: 'Contact form submitted successfully', success: true });
  } catch (err) {
    console.error(err);
    let statusCode = 500;
    let message = (err instanceof Error) ? err.message : 'Internal server error';
    if (err instanceof ZodError) {
        statusCode = 400;
        message = err.issues[0]?.message || 'Invalid input';
    }
    return res.status(statusCode).json({
        message: message,
        success: false
    });
  }
};
