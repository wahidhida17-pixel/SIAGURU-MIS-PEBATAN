import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { assignmentService } from '../services/assignmentService';
import { subjectService } from '../services/subjectService';
import { classService } from '../services/classService';
import { teacherService } from '../services/teacherService';
import { settingsService } from '../services/settingsService';
import type { Assignment, Subject, ClassData } from '../types/academic';

export function useTeacherAssignments() {
  const { userProfile, role } = useAuth();
  const [teacherId, setTeacherId] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const settings = await settingsService.getGeneralSettings();
        if (settings) {
          setAcademicYear(settings.academicYear || '2026/2027');
          setSemester(settings.semester || 'Ganjil');
        }

        const [allSubjects, allClasses] = await Promise.all([
          subjectService.getAll(),
          classService.getAll()
        ]);

        if (role === 'guru') {
          // Find teacher record by matching email or uid
          const allTeachers = await teacherService.getAll();
          const currentTeacher = allTeachers.find(
            t => t.id === userProfile?.uid || t.email === userProfile?.email
          );

          if (currentTeacher?.id) {
            setTeacherId(currentTeacher.id);
            setTeacherName(currentTeacher.name);
            const teacherAssigns = await assignmentService.getByTeacher(currentTeacher.id);
            const activeAssigns = teacherAssigns.filter(a => a.status === 'active');
            setAssignments(activeAssigns);

            // Filter subjects and classes assigned to this teacher
            const assignedSubjectIds = new Set(activeAssigns.map(a => a.subjectId).filter(Boolean));
            const assignedClassIds = new Set(activeAssigns.map(a => a.classId).filter(Boolean));

            // If guru kelas has empty subjectId in assignment, allow all general subjects or assigned subjects
            const hasGuruKelas = activeAssigns.some(a => a.assignmentType === 'guru_kelas');
            
            if (hasGuruKelas) {
              setSubjects(allSubjects);
            } else {
              setSubjects(allSubjects.filter(s => assignedSubjectIds.has(s.id!)));
            }

            setClasses(allClasses.filter(c => assignedClassIds.has(c.id!)));
          } else {
            // Fallback for mock/test admin logged in as teacher
            setTeacherId(userProfile?.uid || 'GURU_MOCK');
            setTeacherName(userProfile?.displayName || 'Guru Pengampu');
            setSubjects(allSubjects);
            setClasses(allClasses);
          }
        } else {
          // Admin has access to all
          setSubjects(allSubjects);
          setClasses(allClasses);
          const allAssigns = await assignmentService.getAll();
          setAssignments(allAssigns.filter(a => a.status === 'active'));
        }
      } catch (err) {
        console.error('Error loading teacher assignments:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userProfile, role]);

  return {
    teacherId,
    teacherName,
    assignments,
    subjects,
    classes,
    academicYear,
    semester,
    loading
  };
}
