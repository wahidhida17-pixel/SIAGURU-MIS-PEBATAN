const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// If not present, add manifest link
if (!html.includes('rel="manifest"')) {
  html = html.replace('<link rel="apple-touch-icon"', '<link rel="manifest" href="/manifest.webmanifest" />\n    <link rel="apple-touch-icon"');
}

fs.writeFileSync('index.html', html, 'utf8');
