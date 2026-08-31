import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firestore';
import type { ReminderItem, AppNotification } from '../types/calendar';
import { auditService } from './auditService';

export const reminderService = {
  async getReminders(targetUserId?: string): Promise<ReminderItem[]> {
    try {
      const q = query(collection(db, 'reminders'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReminderItem));

      if (targetUserId && targetUserId !== 'all') {
        items = items.filter(
          r => r.targetUserId === targetUserId || r.targetUserId === 'all' || r.targetUserId === 'teachers'
        );
      }

      return items;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  },

  async createReminder(
    data: Omit<ReminderItem, 'id' | 'createdAt' | 'isDismissed'>,
    currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const payload = {
      ...data,
      isDismissed: false,
      createdAt: timestamp
    };
    const docRef = await addDoc(collection(db, 'reminders'), payload);

    // Also trigger in-app notification
    await this.createNotification({
      title: `Pengingat: ${data.title}`,
      message: `${data.notes || 'Pengingat terjadwal'} pada ${data.date} pukul ${data.time}`,
      date: timestamp,
      type: data.priority === 'high' ? 'deadline' : 'reminder',
      targetUserId: data.targetUserId,
      isRead: false
    });

    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'CREATE',
        'PENGINGAT',
        docRef.id,
        `Membuat pengingat "${data.title}" untuk tanggal ${data.date}`
      );
    }

    return docRef.id;
  },

  async dismissReminder(id: string, currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }): Promise<void> {
    const docRef = doc(db, 'reminders', id);
    await updateDoc(docRef, { isDismissed: true });
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'DISMISS',
        'PENGINGAT',
        id,
        `Menandai pengingat selesai/tutup`
      );
    }
  },

  async deleteReminder(id: string, currentUser?: { uid: string; name?: string; displayName?: string; [key: string]: any }): Promise<void> {
    await deleteDoc(doc(db, 'reminders', id));
    if (currentUser) {
      await auditService.log(
        currentUser.uid,
        currentUser.name || currentUser.displayName || 'Pengguna',
        'DELETE',
        'PENGINGAT',
        id,
        `Menghapus pengingat ID: ${id}`
      );
    }
  },

  // =========================================================================
  // IN-APP NOTIFICATIONS
  // =========================================================================
  async getNotifications(userId?: string): Promise<AppNotification[]> {
    try {
      const q = query(collection(db, 'notifications'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));

      if (userId) {
        list = list.filter(n => !n.targetUserId || n.targetUserId === 'all' || n.targetUserId === userId);
      }

      return list;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async createNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
    const payload = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'notifications'), payload);
    return docRef.id;
  },

  async markNotificationRead(id: string): Promise<void> {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { isRead: true });
  },

  async markAllNotificationsRead(userId?: string): Promise<void> {
    const notifs = await this.getNotifications(userId);
    for (const n of notifs.filter(x => !x.isRead)) {
      if (n.id) {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      }
    }
  }
};
