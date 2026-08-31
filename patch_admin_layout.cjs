const fs = require('fs');
const path = 'src/layouts/AdminLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `{ name: 'Pengaturan Sekolah', href: '/admin/pengaturan', icon: Settings },`;
const replacement = `{ name: 'Akun Pengguna', href: '/admin/pengguna', icon: Users },
    { name: 'Pengaturan Sekolah', href: '/admin/pengaturan', icon: Settings },`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content, 'utf8');
