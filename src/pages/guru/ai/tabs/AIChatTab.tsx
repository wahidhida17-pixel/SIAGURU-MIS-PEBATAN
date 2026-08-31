import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Bot, Send, Sparkles, Copy, Check, Trash2, 
  BookmarkPlus, RotateCcw, Lightbulb, User, ShieldAlert, BookOpen
} from 'lucide-react';
import { aiService } from '../../../../services/aiService';
import { copyToClipboard } from '../../../../utils/aiExportUtils';
import type { ChatMessage } from '../../../../types/ai';

const QUICK_PROMPTS = [
  {
    category: 'Pedagogik & Kurikulum Merdeka',
    text: 'Bagaimana cara menyusun asesmen diagnostik non-kognitif yang efektif di kelas MI?',
  },
  {
    category: 'PAI & Karakter Madrasah',
    text: 'Berikan ide apersepsi menarik untuk materi Fikih Shalat Berjamaah agar siswa antusias.',
  },
  {
    category: 'Diferensiasi Pembelajaran',
    text: 'Bagaimana strategi pembelajaran berdiferensiasi untuk siswa yang belum lancar membaca huruf hijaiyah?',
  },
  {
    category: 'P5-PPRA Madrasah',
    text: 'Contoh integrasi nilai P5-PPRA (Qudwah & Ta\'awun) dalam pembelajaran IPAS Fase B.',
  },
  {
    category: 'Manajemen Kelas',
    text: 'Berikan teknik manajemen kelas saat siswa mulai gaduh dan kehilangan fokus pada jam pelajaran siang.',
  }
];

export const AIChatTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedChat = aiService.getChatHistory();
    if (savedChat.length > 0) {
      setMessages(savedChat);
    } else {
      // Welcome initial message
      setMessages([
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: `Assalamu'alaikum Warahmatullahi Wabarakatuh, Bapak/Ibu Guru MI Syuriyah Pebatan! 🌿\n\nSaya adalah **AI Guru SIAGURU**, asisten pedagogik cerdas madrasah yang siap membantu Anda dalam:\n- 📖 Merancang strategi pembelajaran Kurikulum Merdeka (KMA 450 Tahun 2024)\n- 🎯 Menyusun Tujuan Pembelajaran (TP), Alur (ATP), & Modul Ajar berdiferensiasi\n- 📝 Merumuskan Kisi-kisi, Bank Soal asesmen (LOTS, MOTS, HOTS), & Rubrik KKTP\n- 🕌 Mengintegrasikan karakter Profil Pelajar Pancasila & Rahmatan Lil Alamin (P5-PPRA)\n- 💡 Konsultasi penanganan siswa, remedial, dan ide ice breaking edukatif.\n\nAda yang bisa saya bantu hari ini?`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyForApi = newHistory
        .filter((m) => m.id !== 'msg_welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await aiService.sendChatMessage(historyForApi, textToSend, {
        school: 'MI Syuriyah Pebatan',
        curriculum: 'Kurikulum Merdeka KMA 450 Tahun 2024',
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedAll = [...newHistory, assistantMsg];
      setMessages(updatedAll);
      aiService.saveChatHistory(updatedAll);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: `Mohon maaf, terjadi kendala jaringan saat memproses respon AI: ${err.message || 'Coba sesaat lagi.'}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleSaveToArtifacts = (msg: ChatMessage) => {
    aiService.saveItem({
      category: 'chat',
      title: msg.content.slice(0, 60).replace(/[#*`_]/g, '') + '...',
      content: msg.content,
    });
    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat percakapan dengan AI Guru?')) {
      aiService.clearChatHistory();
      setMessages([
        {
          id: 'msg_welcome',
          role: 'assistant',
          content: `Percakapan telah direset. Silakan ajukan pertanyaan atau topik pembelajaran baru yang ingin didiskusikan!`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[740px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Chat Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                AI Asisten Guru Madrasah
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.7 Flash Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pakar Kurikulum Merdeka KMA 450, PAI, Diferensiasi, & Karakter P5-PPRA
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          type="button"
          title="Bersihkan Percakapan"
          className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/20">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isAssistant
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 dark:bg-slate-700 text-white border-slate-700'
                }`}
              >
                {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Box */}
              <div className="space-y-1.5 max-w-[88%] sm:max-w-[82%]">
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed ${
                    isAssistant
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'bg-emerald-600 text-white rounded-tr-sm shadow-sm'
                  }`}
                >
                  {isAssistant ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-emerald-700 dark:prose-strong:text-emerald-400">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  )}
                </div>

                {/* Footer Info & Actions */}
                <div className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <span>{msg.timestamp}</span>

                  {isAssistant && msg.id !== 'msg_welcome' && (
                    <>
                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <span>&bull;</span>
                      <button
                        type="button"
                        onClick={() => handleSaveToArtifacts(msg)}
                        className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {savedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Tersimpan</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3 h-3" />
                            <span>Simpan</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-4xl mr-auto animate-in fade-in">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 border border-emerald-500 shadow-sm">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                AI Guru sedang merumuskan jawaban terbaik...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (Shown when few messages or easy tap) */}
      {messages.length <= 4 && (
        <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1 pl-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Inspirasi Topik:
          </span>
          {QUICK_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.text)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-all shadow-2xs font-medium cursor-pointer"
            >
              {item.text}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tanyakan materi pembelajaran, asesmen, modul ajar, atau konsultasi metode mengajar..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-2xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              inputMessage.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2">
          AI Guru disesuaikan khusus untuk kurikulum madrasah. Selalu tinjau dan sesuaikan perangkat ajar dengan kondisi kelas Anda.
        </p>
      </div>
    </div>
  );
};
