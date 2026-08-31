import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SchoolSettingsProvider } from './contexts/SchoolSettingsContext';
import { AppRoutes } from './routes';
import { Settings, ShieldAlert } from 'lucide-react';
import appletConfig from '../firebase-applet-config.json';

interface ErrorBoundaryProps {

  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('invalid-api-key') || this.state.error?.message?.includes('auth');
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
          {isAuthError ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-lg w-full text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">Konfigurasi Firebase Belum Lengkap</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Aplikasi ini membutuhkan konfigurasi Firebase untuk dapat berjalan. Variabel lingkungan (Environment Variables) untuk Firebase belum diatur atau tidak valid.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left mb-6">
                <p className="text-xs font-bold text-slate-700 uppercase mb-2">Langkah Perbaikan:</p>
                <ol className="text-sm text-slate-600 list-decimal list-inside space-y-2">
                  <li>Buka menu <strong>Settings</strong> di AI Studio</li>
                  <li>Buka bagian <strong>Environment Variables</strong></li>
                  <li>Tambahkan <code className="bg-slate-200 px-1 rounded text-xs">VITE_FIREBASE_API_KEY</code> dan variabel lainnya sesuai file <code className="bg-slate-200 px-1 rounded text-xs">.env.example</code></li>
                </ol>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                Muat Ulang Aplikasi
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi kesalahan pada aplikasi</h2>
              <p className="text-slate-500 mb-6 text-sm">
                {this.state.error?.message || "Mohon maaf, terjadi kesalahan yang tidak terduga."}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Muat Ulang
              </button>
            </div>
          )}
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  // Check if firebase config is provided via env vars or applet config
  const isFirebaseConfigured = !!(import.meta.env.VITE_FIREBASE_API_KEY || (appletConfig as any)?.apiKey);

  if (!isFirebaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4F1] px-4 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">Konfigurasi Firebase Diperlukan</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Sistem mendeteksi bahwa kunci API Firebase (Environment Variables) belum dikonfigurasi. Aplikasi tidak dapat dijalankan tanpa koneksi database.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-left mb-8 shadow-inner">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Langkah Setup:</p>
            <ol className="text-sm text-slate-600 list-decimal list-inside space-y-2.5">
              <li>Buka menu <strong>Settings</strong> di AI Studio</li>
              <li>Buka bagian <strong>Environment Variables</strong></li>
              <li>Isi <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-600 shadow-sm">VITE_FIREBASE_API_KEY</code> dan variabel Firebase lainnya.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-[#064E3B] text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-md"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SchoolSettingsProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SchoolSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
