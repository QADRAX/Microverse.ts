import type { NotificationEntry } from '../../domain/models/notificationEntry.js';

export function createNotificationService() {
  const sent: NotificationEntry[] = [];
  return {
    getSent: (): readonly NotificationEntry[] => sent,
    send: (channel: string, message: string): void => {
      sent.push({ channel, message });
    },
  };
}
