/**
 * Logger configuration using Winston
 *
 * Özellikler:
 * - Gün bazlı log dosyaları (ör: combined-2025-12-03.log)
 * - Belirli boyutu aşınca otomatik döndürme (versiyonlama)
 * - Eski dosyalar için maks. dosya sayısı limiti
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Log klasörü ve günlük dosya ismi
const LOG_DIR = path.join(__dirname, '../../logs');
const CURRENT_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Klasör yoksa oluştur
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Döndürme limitleri
// Örn: 10MB ve her dosya için maks. 10 versiyon
const MAX_LOG_SIZE = parseInt(process.env.LOG_MAX_SIZE_BYTES || '', 10) || 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = parseInt(process.env.LOG_MAX_FILES || '', 10) || 10;

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mindcubes-backend' },
  transports: [
    // Günlük genel loglar (gün + boyut bazlı versiyonlama)
    new winston.transports.File({
      filename: path.join(LOG_DIR, `combined-${CURRENT_DATE}.log`),
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES
    }),

    // Günlük error loglar (gün + boyut bazlı versiyonlama)
    new winston.transports.File({
      filename: path.join(LOG_DIR, `error-${CURRENT_DATE}.log`),
      level: 'error',
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES
    })
  ]
});

// Tüm ortamlarda tek bir console transport (double-log önlemek için)
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
}));

module.exports = logger;

