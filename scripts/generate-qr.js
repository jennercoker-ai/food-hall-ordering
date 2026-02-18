#!/usr/bin/env node
/**
 * Generate a QR code PNG for your live app URL.
 * Run after you have a domain: node scripts/generate-qr.js https://your-event.com
 * Output: qr-order.png in project root (print or share).
 */
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const url = process.argv[2] || process.env.APP_URL;
if (!url) {
  console.error('Usage: node scripts/generate-qr.js <YOUR_APP_URL>');
  console.error('Example: node scripts/generate-qr.js https://event-order.onrender.com');
  process.exit(1);
}

const base = url.replace(/\/$/, '') + '/';
const outPath = path.join(__dirname, '..', 'qr-order.png');

QRCode.toFile(outPath, base, { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('QR code saved to:', outPath);
  console.log('Encoded URL:', base);
});
