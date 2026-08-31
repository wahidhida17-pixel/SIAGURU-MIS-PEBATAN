import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { AuditLog } from '../types/academic';

export const auditService = {
  async log(
    userId: string,
    userName?: string,
    action?: string,
    module?: string,
    targetId?: string,
    description?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        userId,
        userName: userName || 'Pengguna',
        action: action || 'ACTION',
        module: module || 'SYSTEM',
        targetId: targetId || '',
        description: description || '',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
};
