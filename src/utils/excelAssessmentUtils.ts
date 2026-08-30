import * as XLSX from 'xlsx';
import type { Student } from '../types/academic';
import type { Assessment, Grade } from '../types/assessment';

export interface ExcelImportRowResult {
  rowNumber: number;
  nis: string;
  studentName: string;
  studentId?: string;
  score: number;
  note?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface ExcelImportSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: ExcelImportRowResult[];
  errors: string[];
}

export const excelAssessmentUtils = {
  /**
   * Generates and downloads an Excel template for grading an assessment.
   */
  downloadGradingTemplate(assessment: Assessment, students: Student[]) {
    const data = students.map((s, idx) => ({
      'No': idx + 1,
      'Student_ID': s.id || '',
      'NIS': s.nis || '',
      'Nama Siswa': s.name || '',
      'Nilai (0-100)': '',
      'Catatan': ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai Siswa');

    const fileName = `Template_Nilai_${assessment.className || assessment.classId}_${assessment.subjectName || assessment.subjectId}_${assessment.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  /**
   * Parses and validates uploaded Excel file against student list.
   */
  async parseAndValidateExcel(
    file: File,
    students: Student[]
  ): Promise<ExcelImportSummary> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const wb = XLSX.read(buffer, { type: 'binary' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

          const results: ExcelImportRowResult[] = [];
          const globalErrors: string[] = [];

          if (rawRows.length === 0) {
            globalErrors.push('File Excel kosong atau format tidak sesuai.');
            return resolve({
              totalRows: 0,
              validCount: 0,
              invalidCount: 0,
              rows: [],
              errors: globalErrors
            });
          }

          rawRows.forEach((row, index) => {
            const rowNum = index + 2; // header is row 1
            const studentId = String(row['Student_ID'] || row['studentId'] || row['ID'] || '').trim();
            const nis = String(row['NIS'] || row['nis'] || '').trim();
            const name = String(row['Nama Siswa'] || row['Nama'] || row['name'] || '').trim();
            const rawScore = row['Nilai (0-100)'] !== undefined && row['Nilai (0-100)'] !== '' 
              ? row['Nilai (0-100)'] 
              : row['Nilai'] !== undefined && row['Nilai'] !== '' ? row['Nilai'] : row['score'];
            const note = String(row['Catatan'] || row['catatan'] || row['note'] || '').trim();

            let matchedStudent = students.find(s => s.id && s.id === studentId);
            if (!matchedStudent && nis) {
              matchedStudent = students.find(s => s.nis === nis);
            }
            if (!matchedStudent && name) {
              matchedStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase());
            }

            if (!matchedStudent) {
              results.push({
                rowNumber: rowNum,
                nis,
                studentName: name || 'Tidak Diketahui',
                score: 0,
                note,
                isValid: false,
                errorMessage: `Baris ${rowNum}: Siswa "${name || nis || studentId}" tidak ditemukan dalam rombel kelas ini.`
              });
              return;
            }

            // Validate score
            if (rawScore === '' || rawScore === undefined || rawScore === null) {
              results.push({
                rowNumber: rowNum,
                nis: matchedStudent.nis,
                studentName: matchedStudent.name,
                studentId: matchedStudent.id,
                score: 0,
                note,
                isValid: true // Empty score is valid as draft
              });
              return;
            }

            const parsedScore = Number(rawScore);
            if (isNaN(parsedScore)) {
              results.push({
                rowNumber: rowNum,
                nis: matchedStudent.nis,
                studentName: matchedStudent.name,
                studentId: matchedStudent.id,
                score: 0,
                note,
                isValid: false,
                errorMessage: `Baris ${rowNum}: Nilai "${rawScore}" tidak valid (harus berupa angka).`
              });
              return;
            }

            if (parsedScore < 0 || parsedScore > 100) {
              results.push({
                rowNumber: rowNum,
                nis: matchedStudent.nis,
                studentName: matchedStudent.name,
                studentId: matchedStudent.id,
                score: parsedScore,
                note,
                isValid: false,
                errorMessage: `Baris ${rowNum}: Nilai ${parsedScore} di luar jangkauan (harus antara 0 - 100).`
              });
              return;
            }

            results.push({
              rowNumber: rowNum,
              nis: matchedStudent.nis,
              studentName: matchedStudent.name,
              studentId: matchedStudent.id,
              score: parsedScore,
              note,
              isValid: true
            });
          });

          const validRows = results.filter(r => r.isValid);
          const invalidRows = results.filter(r => !r.isValid);

          resolve({
            totalRows: results.length,
            validCount: validRows.length,
            invalidCount: invalidRows.length,
            rows: results,
            errors: invalidRows.map(r => r.errorMessage || '')
          });
        } catch (err: any) {
          reject(new Error(err?.message || 'Gagal memproses file Excel.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file.'));
      };

      reader.readAsBinaryString(file);
    });
  },

  /**
   * Exports full class grade recap matrix to Excel.
   */
  exportRecapMatrixToExcel(
    className: string,
    subjectName: string,
    academicYear: string,
    semester: string,
    students: Student[],
    assessments: Assessment[],
    gradesMap: { [studentId_assessmentId: string]: number },
    studentAverages: { [studentId: string]: number }
  ) {
    const data = students.map((s, idx) => {
      const row: any = {
        'No': idx + 1,
        'NIS': s.nis || '',
        'Nama Siswa': s.name
      };

      assessments.forEach(a => {
        const key = `${s.id}_${a.id}`;
        const score = gradesMap[key];
        row[`${a.title} (${a.type})`] = score !== undefined ? score : '-';
      });

      row['Rata-Rata Akhir'] = studentAverages[s.id || ''] !== undefined ? studentAverages[s.id || ''] : '-';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');

    const fileName = `Rekap_Nilai_${className}_${subjectName}_${academicYear.replace('/', '_')}_${semester}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
};
