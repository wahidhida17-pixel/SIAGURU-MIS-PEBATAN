import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
      <p className="text-slate-600 text-center max-w-md mb-8">
        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini mungkin diperuntukkan bagi peran lain.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
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
