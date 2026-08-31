import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Bookmark, Trash2, Copy, Download, Printer, Check, 
  Search, Filter, Calendar, BookOpen, Layers, Bot, Eye, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard, exportTextAsDoc, printAIContent } from '../../../../utils/aiExportUtils';
import type { SavedAIItem } from '../../../../types/ai';

export const AISavedArtifactsTab: React.FC = () => {
  const [items, setItems] = useState<SavedAIItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewItem, setActivePreviewItem] = useState<SavedAIItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const data = aiService.getSavedItems();
    setItems(data);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Hapus dokumen hasil AI ini dari daftar tersimpan?')) {
      aiService.deleteSavedItem(id);
      loadItems();
      if (activePreviewItem?.id === id) {
        setActivePreviewItem(null);
      }
    }
  };

  const handleCopy = async (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(content);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subjectName && item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'module_ajar':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Modul Ajar</span>;
      case 'quiz':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Bank Soal</span>;
      case 'rubric':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">Rubrik KKTP</span>;
      case 'rapor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">Narasi Rapor</span>;
      case 'ice_breaking':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">Ice Breaking</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">AI Note</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi, judul, atau kata kunci..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'module_ajar', label: 'Modul Ajar' },
                { id: 'quiz', label: 'Bank Soal' },
                { id: 'rubric', label: 'Rubrik' },
                { id: 'rapor', label: 'Rapor' },
                { id: 'ice_breaking', label: 'Ice Breaking' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Saved Artifacts */}
      {filteredItems.length === 0 ? (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Bookmark className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
            Belum Ada Dokumen AI yang Tersimpan
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Gunakan tab generator Modul Ajar, Bank Soal, Rubrik, atau Chat, lalu klik tombol <strong>Simpan Arsip</strong> untuk menyimpannya di sini.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              onClick={() => setActivePreviewItem(item)}
              className="rounded-3xl border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  {getCategoryBadge(item.category)}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                  {item.title}
                </CardTitle>
                {item.subjectName && (
                  <CardDescription className="text-xs">
                    {item.subjectName} {item.gradeLevel ? `• ${item.gradeLevel}` : ''}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 font-mono bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {item.content.replace(/[#*`_]/g, '')}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Dokumen
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.id, item.content, e)}
                      title="Salin Teks"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Hapus Dokumen"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Preview Document */}
      {activePreviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryBadge(activePreviewItem.category)}
                  <span className="text-xs text-slate-400">
                    {new Date(activePreviewItem.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {activePreviewItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportTextAsDoc(activePreviewItem.title, activePreviewItem.content)}
                  className="text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Word
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printAIContent(activePreviewItem.title, activePreviewItem.content)}
                  className="text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Cetak
                </Button>
                <button
                  type="button"
                  onClick={() => setActivePreviewItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-table:border-collapse prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-2 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2">
                <Markdown>{activePreviewItem.content}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
