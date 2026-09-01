const fs = require('fs');

const path = 'src/pages/admin/calendar/AdminCalendarView.tsx';
let content = fs.readFileSync(path, 'utf8');

const importTarget = `import {
  Calendar as CalendarIcon,
  Plus,
  Layers,
  Clock,
  MapPin,
  Users,
  Filter,
  FileText,
  Trash2,
  Edit2
} from 'lucide-react';`;
const importReplacement = `import {
  Calendar as CalendarIcon,
  Plus,
  Layers,
  Clock,
  MapPin,
  Users,
  Filter,
  FileText,
  Trash2,
  Edit2,
  RefreshCw
} from 'lucide-react';`;
content = content.replace(importTarget, importReplacement);

const stateTarget = `  const [isFormOpen, setIsFormOpen] = useState(false);`;
const stateReplacement = `  const [isSyncing, setIsSyncing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);`;
content = content.replace(stateTarget, stateReplacement);

const methodTarget = `  const handleCreateNew = () => {`;
const methodReplacement = `  const handleSyncKemenag = async () => {
    try {
      setIsSyncing(true);
      await calendarService.syncKemenagCalendar('2026/2027');
      await fetchEvents();
      alert('Berhasil menyinkronkan Kalender Akademik Kemenag.');
    } catch (e) {
      console.error('Error syncing kemenag calendar:', e);
      alert('Gagal menyinkronkan jadwal Kemenag.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNew = () => {`;
content = content.replace(methodTarget, methodReplacement);

const buttonTarget = `        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Tambah Kegiatan / Agenda Baru
        </button>`;
const buttonReplacement = `        <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-auto">
          <button
            onClick={handleSyncKemenag}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-70"
          >
            <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin' : ''}\`} /> 
            {isSyncing ? 'Menyinkronkan...' : 'Sinkron Kalender Kemenag'}
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Kegiatan
          </button>
        </div>`;
content = content.replace(buttonTarget, buttonReplacement);

fs.writeFileSync(path, content, 'utf8');

