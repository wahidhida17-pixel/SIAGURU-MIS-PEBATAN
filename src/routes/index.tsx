import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { GuruLayout } from '../layouts/GuruLayout';
import { HeadmasterLayout } from '../layouts/HeadmasterLayout';

// Pages
import { Login } from '../pages/auth/Login';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { GuruDashboard } from '../pages/guru/GuruDashboard';
import { Profile } from '../pages/shared/Profile';
import { ComingSoon } from '../components/common/ComingSoon';

// Admin Phase 2 & 3 Pages
import { TeacherList } from '../pages/admin/teachers/TeacherList';
import { StudentList } from '../pages/admin/students/StudentList';
import { ClassList } from '../pages/admin/classes/ClassList';
import { SubjectList } from '../pages/admin/subjects/SubjectList';
import { AssignmentList } from '../pages/admin/assignments/AssignmentList';
import { ScheduleList } from '../pages/admin/schedules/ScheduleList';
import { AttendanceList } from '../pages/admin/attendance/AttendanceList';
import { JournalList } from '../pages/admin/journals/JournalList';
import { MonitoringDashboard } from '../pages/admin/monitoring/MonitoringDashboard';

// Guru Phase 3 Pages
import { GuruSchedule } from '../pages/guru/schedule/GuruSchedule';
import { GuruAttendance } from '../pages/guru/attendance/GuruAttendance';
import { GuruJournal } from '../pages/guru/journal/GuruJournal';

// Phase 4: Administrasi Pembelajaran
import { AdminLearningOverview } from '../pages/admin/learning/AdminLearningOverview';
import { GuruAdministrationHub } from '../pages/guru/learning/GuruAdministrationHub';
import { CPList } from '../pages/guru/learning/CPList';
import { TPList } from '../pages/guru/learning/TPList';
import { ATPList } from '../pages/guru/learning/ATPList';
import { ProtaList } from '../pages/guru/learning/ProtaList';
import { PromesList } from '../pages/guru/learning/PromesList';
import { ModuleAjarList } from '../pages/guru/learning/ModuleAjarList';
import { ModuleAjarWizard } from '../pages/guru/learning/ModuleAjarWizard';
import { KKTPList } from '../pages/guru/learning/KKTPList';
import { DocumentBank } from '../pages/guru/learning/DocumentBank';

// Phase 5: Penilaian Siswa, Rekap Nilai & Persiapan Rapor
import { AssessmentDashboard } from '../pages/guru/assessment/AssessmentDashboard';
import { AssessmentList } from '../pages/guru/assessment/AssessmentList';
import { AssessmentForm } from '../pages/guru/assessment/AssessmentForm';
import { GradeInputView } from '../pages/guru/assessment/GradeInputView';
import { GradeRecapView } from '../pages/guru/assessment/GradeRecapView';
import { ObjectivesAssessmentView } from '../pages/guru/assessment/ObjectivesAssessmentView';
import { StudentDescriptionsView } from '../pages/guru/assessment/StudentDescriptionsView';
import { FollowUpView } from '../pages/guru/assessment/FollowUpView';
import { GuruRaporPrepView } from '../pages/guru/assessment/GuruRaporPrepView';

import { AdminAssessmentOverview } from '../pages/admin/assessment/AdminAssessmentOverview';
import { AdminMonitoringView } from '../pages/admin/assessment/AdminMonitoringView';
import { AdminAssessmentConfigView } from '../pages/admin/assessment/AdminAssessmentConfigView';
import { AdminRaporPrepView } from '../pages/admin/assessment/AdminRaporPrepView';

// Phase 6: Rapor, Leger Nilai, Kenaikan Kelas & Arsip Akademik
import { AdminReportDashboard } from '../pages/admin/rapor/AdminReportDashboard';
import { AdminReportPeriodsView } from '../pages/admin/rapor/AdminReportPeriodsView';
import { AdminReportListView } from '../pages/admin/rapor/AdminReportListView';
import { AdminLegerView } from '../pages/admin/rapor/AdminLegerView';
import { AdminReportMonitoringView } from '../pages/admin/rapor/AdminReportMonitoringView';
import { AdminPromotionView } from '../pages/admin/rapor/AdminPromotionView';
import { AdminReportArchivesView } from '../pages/admin/rapor/AdminReportArchivesView';

import { GuruHomeroomReportView } from '../pages/guru/rapor/GuruHomeroomReportView';
import { GuruSubjectReportView } from '../pages/guru/rapor/GuruSubjectReportView';

// Phase 7: Dokumen Administrasi Guru, Kalender Akademik, Agenda & Arsip
import { GuruDocumentDashboard } from '../pages/guru/documents/GuruDocumentDashboard';
import { GuruMyDocumentsView } from '../pages/guru/documents/GuruMyDocumentsView';
import { GuruDocumentTemplatesView } from '../pages/guru/documents/GuruDocumentTemplatesView';
import { GuruClassDocumentsView } from '../pages/guru/documents/GuruClassDocumentsView';
import { GuruLearningDocumentsView } from '../pages/guru/documents/GuruLearningDocumentsView';
import { GuruAssessmentDocumentsView } from '../pages/guru/documents/GuruAssessmentDocumentsView';
import { GuruLettersView } from '../pages/guru/documents/GuruLettersView';
import { GuruDocumentArchivesView } from '../pages/guru/documents/GuruDocumentArchivesView';
import { GuruTrashView } from '../pages/guru/documents/GuruTrashView';

import { GuruCalendarView } from '../pages/guru/calendar/GuruCalendarView';
import { GuruAgendaView } from '../pages/guru/calendar/GuruAgendaView';
import { GuruRemindersView } from '../pages/guru/calendar/GuruRemindersView';

import { AdminDocumentDashboard } from '../pages/admin/documents/AdminDocumentDashboard';
import { AdminDocumentTemplatesView } from '../pages/admin/documents/AdminDocumentTemplatesView';
import { AdminLettersView } from '../pages/admin/documents/AdminLettersView';
import { AdminAdministrationMonitoringView } from '../pages/admin/documents/AdminAdministrationMonitoringView';
import { AdminDocumentArchivesView } from '../pages/admin/documents/AdminDocumentArchivesView';
import { AdminTrashView as AdminDocumentTrashView } from '../pages/admin/documents/AdminTrashView';

import { AdminCalendarView } from '../pages/admin/calendar/AdminCalendarView';
import { AdminRemindersView } from '../pages/admin/calendar/AdminRemindersView';
import { SchoolSettings } from '../pages/admin/settings/SchoolSettings';
import { AccountSettings } from '../pages/admin/settings/AccountSettings';

// Phase 8: AI Guru Cerdas Madrasah
import { AIGuruDashboard } from '../pages/guru/ai/AIGuruDashboard';

// Phase 8: Headmaster
import { HeadmasterDashboardView } from '../pages/headmaster/dashboard/HeadmasterDashboardView';
import { HeadmasterTeachersView } from '../pages/headmaster/teachers/HeadmasterTeachersView';
import { HeadmasterClassesView } from '../pages/headmaster/classes/HeadmasterClassesView';
import { HeadmasterReportsView } from '../pages/headmaster/reports/HeadmasterReportsView';

// Components & Hooks
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Errors
import { Unauthorized } from '../pages/errors/Unauthorized';
import { NotFound } from '../pages/errors/NotFound';
import { ServerError } from '../pages/errors/ServerError';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'guru') return <Navigate to="/guru/dashboard" replace />;
  if (role === 'headmaster') return <Navigate to="/headmaster/dashboard" replace />;
  
  return <Navigate to="/unauthorized" replace />;
};

const ProfileRedirect: React.FC = () => {
  const { role, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}/profile`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* Phase 2: Master Data */}
        <Route path="guru" element={<TeacherList />} />
        <Route path="siswa" element={<StudentList />} />
        <Route path="kelas" element={<ClassList />} />
        <Route path="mapel" element={<SubjectList />} />
        <Route path="penugasan" element={<AssignmentList />} />
        
        {/* Phase 3: Jadwal, Absensi, Jurnal, Monitoring */}
        <Route path="jadwal" element={<ScheduleList />} />
        <Route path="absensi" element={<AttendanceList />} />
        <Route path="jurnal" element={<JournalList />} />
        <Route path="monitoring" element={<MonitoringDashboard />} />
        
        {/* Phase 4: Administrasi Pembelajaran Admin */}
        <Route path="administrasi" element={<AdminLearningOverview />} />
        
        {/* Phase 5: Penilaian & Supervisi Admin */}
        <Route path="penilaian" element={<AdminAssessmentOverview />} />
        <Route path="assessment" element={<AdminAssessmentOverview />} />
        <Route path="assessment/monitoring" element={<AdminMonitoringView />} />
        <Route path="assessment/recap" element={<GradeRecapView />} />
        <Route path="assessment/config" element={<AdminAssessmentConfigView />} />
        <Route path="assessment/rapor-prep" element={<AdminRaporPrepView />} />

        {/* Phase 6: Rapor, Leger, Kenaikan Kelas, Arsip */}
        <Route path="rapor" element={<AdminReportDashboard />} />
        <Route path="rapor/periods" element={<AdminReportPeriodsView />} />
        <Route path="rapor/list" element={<AdminReportListView />} />
        <Route path="rapor/leger" element={<AdminLegerView />} />
        <Route path="rapor/monitoring" element={<AdminReportMonitoringView />} />
        <Route path="rapor/promotion" element={<AdminPromotionView />} />
        <Route path="rapor/archives" element={<AdminReportArchivesView />} />

        {/* Phase 7: Dokumen Administrasi & Kalender Admin */}
        <Route path="documents" element={<AdminDocumentDashboard />} />
        <Route path="documents/templates" element={<AdminDocumentTemplatesView />} />
        <Route path="documents/letters" element={<AdminLettersView />} />
        <Route path="documents/monitoring" element={<AdminAdministrationMonitoringView />} />
        <Route path="documents/archives" element={<AdminDocumentArchivesView />} />
        <Route path="documents/trash" element={<AdminDocumentTrashView />} />

        <Route path="calendar" element={<AdminCalendarView />} />
        <Route path="calendar/reminders" element={<AdminRemindersView />} />

        <Route path="pengaturan" element={<SchoolSettings />} />
        <Route path="settings" element={<SchoolSettings />} />
        <Route path="pengaturan/sekolah" element={<SchoolSettings />} />
        <Route path="pengaturan/akun" element={<AccountSettings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Guru Routes */}
      <Route path="/guru" element={<GuruLayout />}>
        <Route index element={<Navigate to="/guru/dashboard" replace />} />
        <Route path="dashboard" element={<GuruDashboard />} />
        
        {/* Phase 3: Guru Jadwal, Absensi, Jurnal */}
        <Route path="jadwal" element={<GuruSchedule />} />
        <Route path="absensi" element={<GuruAttendance />} />
        <Route path="jurnal" element={<GuruJournal />} />
        
        {/* Phase 4: Administrasi Pembelajaran Guru */}
        <Route path="administrasi" element={<GuruAdministrationHub />} />
        <Route path="learning/cp" element={<CPList />} />
        <Route path="learning/tp" element={<TPList />} />
        <Route path="learning/atp" element={<ATPList />} />
        <Route path="learning/prota" element={<ProtaList />} />
        <Route path="learning/promes" element={<PromesList />} />
        <Route path="learning/modules" element={<ModuleAjarList />} />
        <Route path="learning/modules/new" element={<ModuleAjarWizard />} />
        <Route path="learning/modules/edit/:id" element={<ModuleAjarWizard />} />
        <Route path="learning/kktp" element={<KKTPList />} />
        <Route path="learning/bank" element={<DocumentBank />} />
        
        {/* Phase 5: Penilaian Siswa, Rekap Nilai & Persiapan Rapor */}
        <Route path="nilai" element={<Navigate to="/guru/assessment" replace />} />
        <Route path="assessment" element={<AssessmentDashboard />} />
        <Route path="assessment/list" element={<AssessmentList />} />
        <Route path="assessment/new" element={<AssessmentForm />} />
        <Route path="assessment/edit/:id" element={<AssessmentForm />} />
        <Route path="assessment/:assessmentId/grades" element={<GradeInputView />} />
        <Route path="assessment/recap" element={<GradeRecapView />} />
        <Route path="assessment/objectives" element={<ObjectivesAssessmentView />} />
        <Route path="assessment/descriptions" element={<StudentDescriptionsView />} />
        <Route path="assessment/follow-up" element={<FollowUpView />} />
        <Route path="assessment/rapor-prep" element={<GuruRaporPrepView />} />

        {/* Phase 6: Rapor Guru (Wali Kelas, Mapel & Leger) */}
        <Route path="rapor" element={<GuruHomeroomReportView />} />
        <Route path="rapor/homeroom" element={<GuruHomeroomReportView />} />
        <Route path="rapor/subjects" element={<GuruSubjectReportView />} />
        <Route path="rapor/leger" element={<AdminLegerView />} />

        {/* Phase 7: Dokumen Administrasi & Kalender Guru */}
        <Route path="documents" element={<GuruDocumentDashboard />} />
        <Route path="documents/my" element={<GuruMyDocumentsView />} />
        <Route path="documents/templates" element={<GuruDocumentTemplatesView />} />
        <Route path="documents/class" element={<GuruClassDocumentsView />} />
        <Route path="documents/learning" element={<GuruLearningDocumentsView />} />
        <Route path="documents/assessment" element={<GuruAssessmentDocumentsView />} />
        <Route path="documents/letters" element={<GuruLettersView />} />
        <Route path="documents/archives" element={<GuruDocumentArchivesView />} />
        <Route path="documents/trash" element={<GuruTrashView />} />

        <Route path="calendar" element={<GuruCalendarView />} />
        <Route path="agenda" element={<GuruAgendaView />} />
        <Route path="reminders" element={<GuruRemindersView />} />

        {/* Phase 8: AI Guru Cerdas Madrasah */}
        <Route path="ai" element={<AIGuruDashboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Headmaster Routes */}
      <Route path="/headmaster" element={<HeadmasterLayout />}>
        <Route index element={<Navigate to="/headmaster/dashboard" replace />} />
        <Route path="dashboard" element={<HeadmasterDashboardView />} />
        <Route path="teachers" element={<HeadmasterTeachersView />} />
        <Route path="classes" element={<HeadmasterClassesView />} />
        <Route path="learning" element={<ComingSoon />} />
        <Route path="assessment" element={<ComingSoon />} />
        <Route path="administration" element={<ComingSoon />} />
        <Route path="rapor" element={<ComingSoon />} />
        <Route path="statistics" element={<ComingSoon />} />
        <Route path="calendar" element={<ComingSoon />} />
        <Route path="documents" element={<ComingSoon />} />
        <Route path="reports" element={<HeadmasterReportsView />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Shared Redirects */}
      <Route path="/profile" element={<ProfileRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
