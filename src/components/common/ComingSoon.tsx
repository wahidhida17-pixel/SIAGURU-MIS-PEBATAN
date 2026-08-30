import React from 'react';
import { Construction } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500 mb-6">
        <Construction className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Fitur Sedang Dikembangkan</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Fitur ini akan tersedia pada tahap berikutnya. Kami sedang bekerja keras untuk membangun pengalaman terbaik untuk Anda.
      </p>
      <Button onClick={() => navigate(-1)} variant="outline">
        Kembali
      </Button>
    </div>
  );
};
