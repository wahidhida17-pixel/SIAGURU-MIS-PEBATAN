import React, { useState } from 'react';
import { 
  Bot, Sparkles, BookOpen, HelpCircle, CheckSquare, 
  FileSpreadsheet, Gamepad2, Bookmark, Lightbulb, Zap, ShieldCheck, Heart
} from 'lucide-react';
import { AIChatTab } from './tabs/AIChatTab';
import { AIModuleAjarTab } from './tabs/AIModuleAjarTab';
import { AIKBCTab } from './tabs/AIKBCTab';
import { AIQuizTab } from './tabs/AIQuizTab';
import { AIRubricTab } from './tabs/AIRubricTab';
import { AIRaporNarrativeTab } from './tabs/AIRaporNarrativeTab';
import { AIIceBreakingTab } from './tabs/AIIceBreakingTab';
import { AISavedArtifactsTab } from './tabs/AISavedArtifactsTab';

type AITabType = 'chat' | 'module_ajar' | 'kbc' | 'quiz' | 'rubric' | 'rapor' | 'ice_breaking' | 'saved';

export const AIGuruDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AITabType>('chat');

  const TABS = [
    {
      id: 'chat' as AITabType,
      label: 'Asisten AI Guru',
      icon: Bot,
      desc: 'Konsultasi pedagogik & strategi ajar',
      badge: 'Utama',
    },
    {
      id: 'module_ajar' as AITabType,
      label: 'Modul Ajar',
      icon: BookOpen,
      desc: 'Generator RPP KMA 450 (2026)',
    },
    {
      id: 'kbc' as AITabType,
      label: 'Kurikulum Cinta (KBC)',
      icon: Heart,
      desc: 'Program 6 Tema & 9K Kemenag',
      badge: 'Kemenag 2026',
    },
    {
      id: 'quiz' as AITabType,
      label: 'Bank Soal & Kisi-Kisi',
      icon: HelpCircle,
      desc: 'Asesmen HOTS & LOTS',
    },
    {
      id: 'rubric' as AITabType,
      label: 'Rubrik KKTP',
      icon: CheckSquare,
      desc: 'Kriteria ketercapaian TP',
    },
    {
      id: 'rapor' as AITabType,
      label: 'Deskripsi Rapor',
      icon: FileSpreadsheet,
      desc: 'Narasi capaian e-Rapor',
    },
    {
      id: 'ice_breaking' as AITabType,
      label: 'Ice Breaking',
      icon: Gamepad2,
      desc: 'Games edukatif P5-PPRA',
    },
    {
      id: 'saved' as AITabType,
      label: 'Arsip AI',
      icon: Bookmark,
      desc: 'Dokumen tersimpan',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-md">
        {/* Decorative background element */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-10 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md text-emerald-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Guru Cerdas MI Syuriyah Pebatan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <span>Kurikulum Merdeka 2026</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pusat Otomasi Administrasi & Asisten Pedagogik Guru
            </h1>

            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Bantu rancang modul ajar, bank soal asesmen berbobot HOTS, rubrik KKTP, narasi e-rapor, serta ide ice breaking islami berbasis nilai Profil Pelajar Rahmatan Lil Alamin (P5-PPRA) dalam hitungan detik.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200">Kecerdasan Buatan</p>
                <p className="text-xs font-bold text-white">Gemini 3.7 Flash</p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-200">Standar Regulasi</p>
                <p className="text-xs font-bold text-white">KMA 450 Th 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'chat' && <AIChatTab />}
        {activeTab === 'module_ajar' && <AIModuleAjarTab />}
        {activeTab === 'kbc' && <AIKBCTab />}
        {activeTab === 'quiz' && <AIQuizTab />}
        {activeTab === 'rubric' && <AIRubricTab />}
        {activeTab === 'rapor' && <AIRaporNarrativeTab />}
        {activeTab === 'ice_breaking' && <AIIceBreakingTab />}
        {activeTab === 'saved' && <AISavedArtifactsTab />}
      </div>
    </div>
  );
};
