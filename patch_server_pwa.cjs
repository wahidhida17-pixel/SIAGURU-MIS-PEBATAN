const fs = require('fs');
const path = require('path');

const serverPath = path.resolve('server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const importTarget = `import { GoogleGenAI } from '@google/genai';`;
const importReplacement = `import { GoogleGenAI } from '@google/genai';
import https from 'https';
import fs from 'fs';`;
content = content.replace(importTarget, importReplacement);

const viteStartTarget = `// Setup Vite / Static handling`;
const pwaEndpoints = `
// PWA Dynamic Endpoints
async function getGeneralSettings() {
  const appletConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let projectId = 'siaguru-aba53';
  if (fs.existsSync(appletConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
    } catch(e) {}
  }
  
  return new Promise((resolve) => {
    https.get(\`https://firestore.googleapis.com/v1/projects/\${projectId}/databases/(default)/documents/settings/general\`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.fields || {});
        } catch(e) {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });
}

function serveImage(val, res, next) {
  if (!val) return next();
  if (val.startsWith('http')) return res.redirect(val);
  const match = val.match(/^data:image\\/([a-zA-Z0-9+-]+);base64,(.+)$/);
  if (!match) return next();
  
  try {
    const buffer = Buffer.from(match[2], 'base64');
    res.writeHead(200, {
      'Content-Type': \`image/\${match[1]}\`,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=60'
    });
    res.end(buffer);
  } catch (e) {
    next();
  }
}

app.get('/manifest.webmanifest', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const schoolName = fields.schoolName?.stringValue || 'MI Syuriyah Pebatan';
  const manifest = {
    name: \`SIAGURU \${schoolName.toUpperCase()}\`,
    short_name: 'SIAGURU',
    description: \`Sistem Administrasi Guru \${schoolName}\`,
    theme_color: '#059669',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { src: '/logo.svg', sizes: '192x192', type: 'image/png' },
      { src: '/logo.svg', sizes: '512x512', type: 'image/png' }
    ]
  };
  res.json(manifest);
});

app.get('/logo.svg', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const val = fields.appIconURL?.stringValue || fields.logoURL?.stringValue;
  serveImage(val, res, next);
});

app.get('/favicon.ico', async (req, res, next) => {
  const fields = await getGeneralSettings();
  const val = fields.faviconURL?.stringValue || fields.logoURL?.stringValue;
  serveImage(val, res, next);
});

// Setup Vite / Static handling`;

content = content.replace(viteStartTarget, pwaEndpoints);

fs.writeFileSync(serverPath, content, 'utf8');
