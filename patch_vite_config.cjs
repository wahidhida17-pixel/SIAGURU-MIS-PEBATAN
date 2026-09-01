const fs = require('fs');

let config = fs.readFileSync('vite.config.ts', 'utf8');

config = config.replace(/manifest:\s*\{[\s\S]*?\}\s*\}\)/, '})');
config = config.replace(/VitePWA\(\{[\s\S]*?\}\)/, 'VitePWA({ registerType: "autoUpdate", workbox: { maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 } })');

fs.writeFileSync('vite.config.ts', config, 'utf8');
