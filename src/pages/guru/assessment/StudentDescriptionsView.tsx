import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Save, Printer, Filter, CheckCircle2, 
  AlertCircle, BookOpen, Users, RefreshCw, Edit, Award 
} from 'lucide-react';
import { assessmentService } from '../../../services/assessmentService';
import { learningService } from '../../../services/learningService';
import { studentService } from '../../../services/studentService';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import type { Assessment, Grade, StudentDescription } from '../../../types/assessment';
import type { LearningObjective } from '../../../types/learning';
import type { Student } from '../../../types/academic';

export const StudentDescriptionsView: React.FC = () => {
  const { teacherId, teacherName, subjects, classes, academicYear, semester, loading: assignLoading } = useTeacherAssignments();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [students, setStudents] = useState<Student[]>([]);
  const [tps, setTps] = useState<LearningObjective[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [descriptions, setDescriptions] = useState<{ [studentId: string]: StudentDescription }>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [classes, subjects]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      loadData();
    }
  }, [selectedClassId, selectedSubjectId, academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, tpList, assessList, gradeList, existingDescs] = await Promise.all([
        studentService.getByClass(selectedClassId),
        learningService.getLearningObjectives({
          teacherId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        }),
        assessmentService.getAssessments({
          teacherId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        }),
        assessmentService.getGradesByClassSubject(selectedClassId, selectedSubjectId, academicYear, semester),
        assessmentService.getStudentDescriptions({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          academicYear,
          semester
        })
      ]);

      setStudents(classList);
      setTps(tpList);
      setAssessments(assessList);
      setGrades(gradeList);

      const descMap: { [id: string]: StudentDescription } = {};
      existingDescs.forEach(d => {
        descMap[d.studentId] = d;
      });

      // For any student without existing description, generate initial template
      classList.forEach(st => {
        if (!descMap[st.id!]) {
          descMap[st.id!] = {
            studentId: st.id!,
            studentName: st.name,
            studentNis: st.nis || '',
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            teacherId,
            academicYear,
            semester,
            tpDescriptions: [],
            strengthsText: '',
            improvementsText: '',
            finalDescription: '',
            status: 'draft'
          };
        }
      });

      setDescriptions(descMap);
    } catch (err) {
      console.error('Error loading descriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Grade Map
  const gradesMap: { [studentId_assessmentId: string]: number } = {};
  grades.forEach(g => {
    if (g.score !== undefined && g.score !== null) {
      gradesMap[`${g.studentId}_${g.assessmentId}`] = g.score;
    }
  });

  // Calculate Student Average for each TP
  const getStudentTpScores = (studentId: string): Array<{ tpCode: string; tpTitle: string; averageScore: number }> => {
    const list: Array<{ tpCode: string; tpTitle: string; averageScore: number }> = [];

    tps.forEach(tp => {
      const matchAssess = assessments.filter(a => a.objectiveIds && a.objectiveIds.includes(tp.id || ''));
      if (matchAssess.length > 0) {
        let sum = 0;
        let count = 0;
        matchAssess.forEach(a => {
          const sc = gradesMap[`${studentId}_${a.id}`];
          if (sc !== undefined) {
            sum += sc;
            count++;
          }
        });
        if (count > 0) {
          list.push({
            tpCode: tp.code,
            tpTitle: tp.title,
            averageScore: Math.round(sum / count)
          });
        }
      }
    });

    return list;
  };

  // Auto Generate All Descriptions
  const handleAutoGenerateAll = () => {
    const updated = { ...descriptions };

    students.forEach(st => {
      const tpScores = getStudentTpScores(st.id!);
      const generated = assessmentService.generateDataDrivenDescription(st.name, tpScores);

      updated[st.id!] = {
        ...updated[st.id!],
        studentId: st.id!,
        studentName: st.name,
        studentNis: st.nis || '',
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId,
        academicYear,
        semester,
        highestScoreTp: generated.highestScoreTp,
        lowestScoreTp: generated.lowestScoreTp,
        strengthsText: generated.strengthsText,
        improvementsText: generated.improvementsText,
        finalDescription: generated.finalDescription,
        status: 'draft'
      };
    });

    setDescriptions(updated);
    setStatusMessage('Berhasil men-generate deskripsi otomatis berbasis nilai untuk seluruh siswa.');
  };

  const handleDescriptionChange = (studentId: string, text: string) => {
    setDescriptions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        finalDescription: text
      }
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      const promises = (Object.values(descriptions) as StudentDescription[]).map(desc =>
        assessmentService.saveStudentDescription(desc, { uid: teacherId, name: teacherName })
      );

      await Promise.all(promises);
      setStatusMessage('Seluruh deskripsi capaian pembelajaran berhasil disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan deskripsi: ' + (err?.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || 'Kelas';
  const currentSubjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'Mata Pelajaran';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <span>Deskripsi Capaian Pembelajaran (Rapor)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generator deskripsi capaian hasil belajar berbasis Tujuan Pembelajaran (Kurikulum Merdeka)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoGenerateAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Generate Otomatis Semua</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Deskripsi</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Semua'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Kelas / Rombel
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Printable Formal Header */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider">YAYASAN PENDIDIKAN ISLAM SYURIYAH PEBATAN</h2>
        <h1 className="text-lg font-black uppercase">MADRASAH IBTIDAIYAH (MI) SYURIYAH PEBATAN</h1>
        <p className="text-xs text-slate-600">Alamat: Jl. Raya Pebatan No. 12, Kec. Pebatan, Kab. Brebes</p>
        <div className="mt-3 text-sm font-bold underline">
          DESKRIPSI CAPAIAN KOMPETENSI / CAPAIAN PEMBELAJARAN
        </div>
        <div className="mt-1 flex justify-between text-xs font-medium px-4">
          <span>Mata Pelajaran: {currentSubjectName}</span>
          <span>Kelas: {currentClassName}</span>
          <span>Semester: {semester} - TP {academicYear}</span>
        </div>
      </div>

      {/* Student Description Cards */}
      {loading || assignLoading ? (
        <div className="flex justify-center p-16">
          <LoadingSpinner />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">Tidak ada siswa ditemukan</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student, idx) => {
            const desc = descriptions[student.id!] || { finalDescription: '' };
            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 hover:border-emerald-300 transition-all print:border print:border-slate-300 print:shadow-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold text-xs">
                      {student.absentNumber || idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">NIS: {student.nis || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {desc.finalDescription ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Deskripsi Terisi
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Belum Diisi
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deskripsi Capaian Pembelajaran (Rapor)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Deskripsi pencapaian kompetensi tertinggi dan hal yang perlu ditingkatkan..."
                    value={desc.finalDescription || ''}
                    onChange={(e) => handleDescriptionChange(student.id!, e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
