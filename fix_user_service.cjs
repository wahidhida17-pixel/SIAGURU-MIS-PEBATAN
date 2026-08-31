const fs = require('fs');

const path = 'src/services/userService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/  \}\n\n  async getAllUsers/, '  },\n\n  async getAllUsers');

fs.writeFileSync(path, content, 'utf8');

