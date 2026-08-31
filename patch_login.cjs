const fs = require('fs');

const loginPath = 'src/pages/auth/Login.tsx';
let content = fs.readFileSync(loginPath, 'utf8');

// 1. Remove register logic from imports to component logic
content = content.replace(/const \[isRegisterMode, setIsRegisterMode\] = useState\(false\);\n/g, '');
content = content.replace(/const \[displayName, setDisplayName\] = useState\(''\);\n/g, '');
content = content.replace(/const \[selectedRole, setSelectedRole\] = useState<'admin' | 'guru' | 'headmaster'>\('admin'\);\n/g, '');

content = content.replace(/import \{ ThemeToggleButton \} from '\.\.\/\.\.\/components\/theme\/ThemeToggleButton';/, 
`import { ThemeToggleButton } from '../../components/theme/ThemeToggleButton';
import { Eye, EyeOff } from 'lucide-react';`);

// HandleAuth logic simplification
const authTarget = `    setIsLoading(true);
    try {
      if (isRegisterMode) {
        // Mode registrasi untuk initial setup
        let user;
        try {
          user = await authService.register(email, password);
        } catch (regErr: any) {
          if (regErr.code === 'auth/email-already-in-use') {
            // Email sudah ada, otomatis coba login dengan kredensial yang dimasukkan
            user = await authService.login(email, password);
          } else {
            throw regErr;
          }
        }

        // Cek profile, jika belum ada buatkan
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            email: user.email,
            name: displayName || email.split('@')[0],
            role: selectedRole,
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        await authService.login(email, password);
      }
      
      // Navigate akan ditangani oleh auth listener di App.tsx
      // Tapi kita force refresh untuk memastikan context terupdate
      navigate('/guru/dashboard', { replace: true });
    } catch (err: any) {`;
    
const authReplacement = `    setIsLoading(true);
    try {
      await authService.login(email, password);
      // Navigate akan ditangani oleh auth listener di App.tsx
      navigate('/guru/dashboard', { replace: true });
    } catch (err: any) {`;
content = content.replace(authTarget, authReplacement);

// Fix early returns for register mode
content = content.replace(/    if \(isRegisterMode && password\.length < 6\) \{\n      setError\('Password minimal 6 karakter\.'\);\n      return;\n    \}\n/g, '');

// UI Changes
const headerTarget = `            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {isRegisterMode ? 'Daftar / Setup Akun' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {isRegisterMode 
                ? 'Buat akun pengelola untuk sistem SIAGURU.'
                : 'Masuk ke sistem SIAGURU MI Syuriyah Pebatan'}
            </p>`;
const headerReplacement = `            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Masuk ke sistem SIAGURU MI Syuriyah Pebatan
            </p>`;
content = content.replace(headerTarget, headerReplacement);

const tabSwitcherRegex = /          \{\/\* Tab Switcher \*\/\}(.|\n)*?<\/div>/m;
content = content.replace(tabSwitcherRegex, '');

const formTarget = `          <form onSubmit={handleAuth} className="space-y-4">
            {isRegisterMode && (
              <>
                <Input
                  label="Nama Lengkap"
                  type="text"
                  placeholder="Contoh: H. Ahmad Wahidi, S.Pd.I"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Peran / Hak Akses
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={\`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer \${
                        selectedRole === 'admin'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }\`}
                    >
                      Administrator
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('guru')}
                      className={\`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer \${
                        selectedRole === 'guru'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }\`}
                    >
                      Guru
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('headmaster')}
                      className={\`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer \${
                        selectedRole === 'headmaster'
                          ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }\`}
                    >
                      Kepala Madrasah
                    </button>
                  </div>
                </div>
              </>
            )}
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />`;

const formReplacement = `          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>`;
            
content = content.replace(formTarget, formReplacement);

// State for showPassword
content = content.replace(/  const \[password, setPassword\] = useState\(''\);\n/, "  const [password, setPassword] = useState('');\n  const [showPassword, setShowPassword] = useState(false);\n");

// Replace {isRegisterMode ...} stuff
content = content.replace(/\{!isRegisterMode && \(/g, '(');
content = content.replace(/\{isLoading \? 'Memproses\.\.\.' : \(isRegisterMode \? 'Daftar Sekarang' : 'Masuk Sekarang'\)\}/g, "{isLoading ? 'Memproses...' : 'Masuk Sekarang'}");

fs.writeFileSync(loginPath, content, 'utf8');

