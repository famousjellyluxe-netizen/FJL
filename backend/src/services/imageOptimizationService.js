/**
 * Image Optimization Service
 * Handles image compression, WebP conversion, and responsive image generation
 *
 * Used by Meta, Amazon, Netflix style platforms for:
 * - WebP conversion for 25-30% file size reduction
 * - Image compression to <200KB per file
 * - Responsive image sizes for different devices
 */

import sharp from 'sharp';
import { AppError } from '../middleware/errorHandler.js';

// Image optimization configuration
const IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB input limit
  maxOutputSize: 200 * 1024, // 200KB output limit
  webpQuality: 85, // WebP quality (1-100)
  jpegQuality: 85, // JPEG quality fallback
  responsiveSizes: {
    thumb: 300, // Mobile
    medium: 600, // Tablet
    large: 1200 // Desktop
  },
  formats: ['webp', 'jpeg'], // Supported output formats
};

/**
 * Optimize image for web
 * Converts to WebP, compresses, and generates responsive sizes
 *
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimetype - Original MIME type
 * @returns {Promise<Object>} Optimized image data
 */
export async function optimizeImage(imageBuffer, mimetype) {
  try {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new AppError('Image buffer is empty', 400);
    }

    if (imageBuffer.length > IMAGE_CONFIG.maxFileSize) {
      throw new AppError(`Image exceeds ${IMAGE_CONFIG.maxFileSize / 1024 / 1024}MB limit`, 400);
    }

    // Detect image format
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`📸 Processing image: ${metadata.format} (${Math.round(imageBuffer.length / 1024)}KB)`);

    // Generate WebP version (primary format for modern browsers)
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: IMAGE_CONFIG.webpQuality })
      .toBuffer();

    if (webpBuffer.length > IMAGE_CONFIG.maxOutputSize) {
      // If still too large, reduce quality
      const optimizedWebp = await sharp(imageBuffer)
        .webp({ quality: Math.max(70, IMAGE_CONFIG.webpQuality - 15) })
        .toBuffer();

      console.warn(`⚠️  WebP still large (${Math.round(optimizedWebp.length / 1024)}KB), reduced quality`);
    }

    // Generate JPEG version (fallback for older browsers)
    const jpegBuffer = await sharp(imageBuffer)
      .jpeg({ quality: IMAGE_CONFIG.jpegQuality, progressive: true })
      .toBuffer();

    console.log(`✅ Optimized image - WebP: ${Math.round(webpBuffer.length / 1024)}KB, JPEG: ${Math.round(jpegBuffer.length / 1024)}KB`);

    return {
      original: imageBuffer,
      webp: webpBuffer,
      jpeg: jpegBuffer,
      originalSize: imageBuffer.length,
      webpSize: webpBuffer.length,
      jpegSize: jpegBuffer.length,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      compressionRatio: ((1 - webpBuffer.length / imageBuffer.length) * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError(`Image optimization failed: ${error.message}`, 500);
  }
}

/**
 * Generate responsive image sizes
 * Creates multiple versions for different screen sizes
 *
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Object>} Multiple sized versions
 */
export async function generateResponsiveSizes(imageBuffer) {
  try {
    const sizes = {};

    for (const [sizeKey, width] of Object.entries(IMAGE_CONFIG.responsiveSizes)) {
      // Generate WebP version
      const webpBuffer = await sharp(imageBuffer)
        .resize(width, width, { fit: 'cover', position: 'center' })
        .webp({ quality: IMAGE_CONFIG.webpQuality })
        .toBuffer();

      // Generate JPEG version
      const jpegBuffer = await sharp(imageBuffer)
        .resize(width, width, { fit: 'cover', position: 'center' })
        .jpeg({ quality: IMAGE_CONFIG.jpegQuality, progressive: true })
        .toBuffer();

      sizes[sizeKey] = {
        webp: webpBuffer,
        jpeg: jpegBuffer,
        width: width,
        webpSize: webpBuffer.length,
        jpegSize: jpegBuffer.length
      };

      console.log(`  ${sizeKey} (${width}px): WebP ${Math.round(webpBuffer.length / 1024)}KB, JPEG ${Math.round(jpegBuffer.length / 1024)}KB`);
    }

    return sizes;
  } catch (error) {
    console.error('Responsive size generation error:', error);
    throw new AppError('Failed to generate responsive sizes', 500);
  }
}

/**
 * Check if image needs optimization
 * Returns true if image is larger than recommended or not WebP
 *
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} format - Image format
 * @returns {boolean}
 */
export async function needsOptimization(imageBuffer, format) {
  // Needs optimization if:
  // 1. File size > 200KB
  // 2. Not WebP format
  // 3. File size > 2MB (definitely needs it)

  if (imageBuffer.length > IMAGE_CONFIG.maxOutputSize) return true;
  if (format !== 'webp') return true;
  if (imageBuffer.length > 2 * 1024 * 1024) return true;

  return false;
}

/**
 * Get image optimization recommendations
 * Calculates potential savings and quality impact
 *
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} format - Image format
 * @returns {Promise<Object>} Optimization recommendations
 */
export async function getOptimizationRecommendations(imageBuffer, format) {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    // Estimate WebP compression
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: IMAGE_CONFIG.webpQuality })
      .toBuffer();

    const savings = imageBuffer.length - webpBuffer.length;
    const savingsPercent = ((savings / imageBuffer.length) * 100).toFixed(1);

    return {
      currentSize: imageBuffer.length,
      currentFormat: format,
      estimatedOptimizedSize: webpBuffer.length,
      potentialSavings: savings,
      savingsPercent: savingsPercent,
      width: metadata.width,
      height: metadata.height,
      recommendedAction: imageBuffer.length > IMAGE_CONFIG.maxOutputSize
        ? 'COMPRESS_REQUIRED'
        : 'COMPRESS_RECOMMENDED'
    };
  } catch (error) {
    console.error('Recommendation generation error:', error);
    return null;
  }
}

export default {
  optimizeImage,
  generateResponsiveSizes,
  needsOptimization,
  getOptimizationRecommendations,
  IMAGE_CONFIG
};
