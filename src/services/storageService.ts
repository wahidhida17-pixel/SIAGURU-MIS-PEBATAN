import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/storage';
import type { DocumentFileType } from '../types/document';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpg',
  'jpeg',
  'png',
  'webp'
];

export const storageService = {
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  },

  getFileType(filename: string): DocumentFileType {
    const ext = this.getFileExtension(filename);
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return ext as 'doc' | 'docx';
    if (['xls', 'xlsx'].includes(ext)) return ext as 'xls' | 'xlsx';
    if (['ppt', 'pptx'].includes(ext)) return ext as 'ppt' | 'pptx';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext as 'jpg' | 'jpeg' | 'png' | 'webp';
    return 'other';
  },

  validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `Ukuran file (${this.formatFileSize(file.size)}) melebihi batas maksimum 25MB.`
      };
    }

    const ext = this.getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: `Format file .${ext} tidak didukung. Format yang didukung: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, JPG/PNG/WEBP.`
      };
    }

    return { isValid: true };
  },

  async uploadFile(
    file: File,
    academicYear: string,
    teacherId: string,
    category: string
  ): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; fileType: DocumentFileType }> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const cleanCategory = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanYear = academicYear.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `documents/${cleanYear}/${teacherId}/${cleanCategory}/${timestamp}_${sanitizedFileName}`;

    let downloadUrl = '';

    try {
      // Attempt upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream'
      });
      downloadUrl = await getDownloadURL(snapshot.ref);
    } catch (storageError) {
      console.warn('Firebase Storage upload failed or not configured, using local fallback:', storageError);
      // Fallback: Read file as Data URL / create Blob URL for demo environment
      downloadUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    }

    const fileType = this.getFileType(file.name);

    return {
      downloadUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      fileType
    };
  },

  async deleteFile(storagePath: string): Promise<void> {
    if (!storagePath) return;
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Error deleting from storage (may have been fallback):', error);
    }
  }
};
