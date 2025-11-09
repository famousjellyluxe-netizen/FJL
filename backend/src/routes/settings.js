import express from 'express';
import { verifyJWT, requireAdmin, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as settingsService from '../services/settingsService.js';

const router = express.Router();

/**
 * GET /api/settings
 * Get all business settings (public, needed for emails)
 */
router.get('/', asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();

  res.json({
    success: true,
    data: settings
  });
}));

/**
 * PUT /api/settings
 * Update business settings (admin only)
 */
router.put('/', verifyJWT, requireAdmin, requirePermission('manage_settings'), asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
}));

/**
 * GET /api/settings/:key
 * Get specific setting by key (public)
 */
router.get('/:key', asyncHandler(async (req, res) => {
  const value = await settingsService.getSetting(req.params.key);

  res.json({
    success: true,
    key: req.params.key,
    value: value
  });
}));

export default router;
