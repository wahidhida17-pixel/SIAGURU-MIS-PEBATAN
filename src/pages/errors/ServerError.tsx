import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';

export const ServerError: React.FC = () => {
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
        <ServerCrash className="w-10 h-10" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Terjadi Kesalahan Server</h1>
      <p className="text-slate-600 text-center max-w-md mb-8">
        Maaf, sistem sedang mengalami kendala. Silakan coba muat ulang halaman ini beberapa saat lagi.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={handleReload}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Muat Ulang
        </button>
        <Link 
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
        >
          <Home className="w-5 h-5" />
          Dashboard Utama
        </Link>
      </div>
    </div>
  );
};
