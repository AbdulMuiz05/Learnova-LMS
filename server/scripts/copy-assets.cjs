const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'src', 'templates');
const destination = path.join(__dirname, '..', 'dist', 'templates');

if (fs.existsSync(source)) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  console.log('Copied email templates to dist/templates');
} else {
  console.warn('Email template source directory not found — skipping copy.');
}
