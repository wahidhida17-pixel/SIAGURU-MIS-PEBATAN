const fs = require('fs');

const path = 'src/services/calendarService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/  \}\n\n  async syncKemenagCalendar/, '  },\n\n  async syncKemenagCalendar');

fs.writeFileSync(path, content, 'utf8');
