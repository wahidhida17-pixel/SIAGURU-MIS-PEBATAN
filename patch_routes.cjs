const fs = require('fs');
const path = 'src/routes/index.tsx';
let content = fs.readFileSync(path, 'utf8');

const importTarget = `import { AccountSettings } from '../pages/admin/settings/AccountSettings';`;
const importReplacement = `import { AccountSettings } from '../pages/admin/settings/AccountSettings';
import { UserList } from '../pages/admin/users/UserList';`;

content = content.replace(importTarget, importReplacement);

const routeTarget = `<Route path="pengaturan/akun" element={<AccountSettings />} />`;
const routeReplacement = `<Route path="pengaturan/akun" element={<AccountSettings />} />
        <Route path="users" element={<UserList />} />
        <Route path="pengguna" element={<UserList />} />`;

content = content.replace(routeTarget, routeReplacement);

fs.writeFileSync(path, content, 'utf8');
