import { INotificationService } from '../interfaces';
import { Notification } from '../../types';
import { StorageService } from '../storageService';

export class LocalNotificationService implements INotificationService {
  async getNotifications(userId?: string, userRole?: string): Promise<Notification[]> {
    const notifs = StorageService.getNotifications();
    if (!userId && !userRole) return notifs;

    return notifs.filter((n) => {
      if (n.userId === 'ALL') return true;
      if (userId && n.userId === userId) return true;
      if (userRole && n.userId === `ROLE_${userRole}`) return true;
      return false;
    });
  }

  async markAsRead(id: string): Promise<void> {
    const notifs = StorageService.getNotifications();
    const index = notifs.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifs[index].isRead = true;
      StorageService.setNotifications(notifs);
    }
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const notifs = StorageService.getNotifications();
    notifs.forEach((n) => {
      if (!userId || n.userId === userId || n.userId === 'ALL') {
        n.isRead = true;
      }
    });
    StorageService.setNotifications(notifs);
  }

  async sendNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
  ): Promise<Notification> {
    const notifs = StorageService.getNotifications();
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    notifs.unshift(newNotif);
    StorageService.setNotifications(notifs);
    return newNotif;
  }

  async deleteNotification(id: string): Promise<boolean> {
    let notifs = StorageService.getNotifications();
    const exists = notifs.some((n) => n.id === id);
    if (!exists) return false;
    notifs = notifs.filter((n) => n.id !== id);
    StorageService.setNotifications(notifs);
    return true;
  }
}
