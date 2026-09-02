import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Check, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (value: string) => void;
  presetOptions?: { name: string; url: string; category?: string }[];
  aspectRatio?: 'square' | 'wide' | 'auto';
  maxDimension?: number;
  placeholderText?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  sublabel,
  value,
  onChange,
  presetOptions = [],
  aspectRatio = 'square',
  maxDimension = 256,
  placeholderText = 'Klik atau seret gambar ke sini',
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to WebP/PNG base64 data URL
  const processFile = (file: File) => {
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Hanya berkas gambar (PNG, JPG, SVG, WebP) yang didukung.');
      return;
    }

    // Max 10MB input file limit
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran berkas terlalu besar. Maksimal 10MB.');
      return;
    }

    setIsProcessing(true);

    // If small SVG (< 40KB), read directly to preserve vector sharpness
    if (file.type === 'image/svg+xml' && file.size < 40 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setErrorMsg('Gagal membaca berkas SVG.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Process and optimize raster images & large SVGs via Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize down if exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrorMsg('Gagal memproses gambar pada canvas browser.');
          setIsProcessing(false);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for high compression and alpha transparency support
        let dataUrl = canvas.toDataURL('image/webp', 0.8);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/png');
        }

        onChange(dataUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorMsg('Gagal mengolah gambar. Pastikan format berkas valid.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca berkas gambar.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUrlApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMsg('Masukkan URL gambar yang valid.');
      return;
    }
    setErrorMsg('');
    onChange(urlInput.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Label and Sublabel */}
      <div className="flex items-start justify-between">
        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
            {label}
          </label>
          {sublabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {sublabel}
            </p>
          )}
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      {/* Main Preview and Action Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Visual Preview Box with Checkerboard Background */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center min-h-[160px]">
          {value ? (
            <div className="relative group">
              <div 
                className="w-28 h-28 rounded-2xl overflow-hidden shadow-md flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
              >
                <img
                  src={value}
                  alt={label}
                  className="max-w-full max-h-full object-contain select-none transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>
              <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <Check className="w-3 h-3" />
                <span>Gambar Terpasang</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-2">
                <ImageIcon className="w-8 h-8 opacity-60" />
              </div>
              <span className="text-xs font-medium">Belum ada berkas</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Format: PNG, JPG, SVG, WebP</span>
            </div>
          )}
        </div>

        {/* Upload Controls & Method Tabs */}
        <div className="md:col-span-8 space-y-3">
          {/* Method Nav */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Tautan URL</span>
            </button>
            {presetOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pilihan Preset</span>
              </button>
            )}
          </div>

          {/* Mode 1: Drag & Drop Upload */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isProcessing}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!disabled && !isProcessing) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-white dark:bg-slate-900'
                } ${disabled || isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {isProcessing ? (
                  <div className="py-3 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Mengompres & mengoptimalkan gambar...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {placeholderText}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Mendukung PNG transparan, JPG, SVG, WebP (Maks. 10MB, otomatis dikompres)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Direct URL Input */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlApply} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://domain.com/logo-madrasah.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={disabled}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={disabled || !urlInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Gunakan tautan gambar publik langsung dari hosting, Google Drive, atau website sekolah.
              </p>
            </form>
          )}

          {/* Mode 3: Presets Gallery */}
          {activeTab === 'presets' && presetOptions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {presetOptions.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  disabled={disabled}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    value === preset.url
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-7 h-7 object-contain rounded shrink-0 bg-white p-0.5 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{preset.name}</p>
                    {preset.category && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{preset.category}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
