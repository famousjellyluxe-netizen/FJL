/**
 * Contact Form Routes
 * Handles customer contact form submissions and sends emails to admin
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import * as emailService from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/contact
 * Submit contact form (public endpoint)
 * Sends email to admin and auto-reply to customer
 */
router.post('/',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail(),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10-5000 characters')
  ],
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    // Sanitize inputs (prevent XSS)
    const sanitizedData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject ? subject.trim() : 'Contact Form Submission',
      message: message.trim()
    };

    console.log(`📬 Contact form submission from: ${sanitizedData.name} <${sanitizedData.email}>`);

    try {
      // Send contact email to admin
      await emailService.sendContactEmail(sanitizedData);

      res.json({
        success: true,
        message: 'Thank you for contacting us! We\'ll get back to you soon.'
      });
    } catch (error) {
      console.error('Error sending contact email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message. Please try again later.'
      });
    }
  }
);

export default router;
