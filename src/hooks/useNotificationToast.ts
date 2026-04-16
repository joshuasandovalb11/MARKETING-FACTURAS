import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ResolvedNotification } from '../utils/notificationPolicy';

function isToastChannel(channel: ResolvedNotification['channel']) {
  return channel === 'toast' || channel === 'toast-inline';
}

export function useNotificationToast() {
  const lastToastKeyRef = useRef<string | null>(null);

  const notify = useCallback((notification: ResolvedNotification) => {
    if (!isToastChannel(notification.channel)) return;
    if (!notification.message) return;

    if (notification.dedupeKey === lastToastKeyRef.current) {
      return;
    }

    lastToastKeyRef.current = notification.dedupeKey;

    if (notification.level === 'error') {
      toast.error(notification.message);
      return;
    }

    if (notification.level === 'warning') {
      toast.warning(notification.message);
      return;
    }

    if (notification.level === 'success') {
      toast.success(notification.message);
      return;
    }

    toast.message(notification.message);
  }, []);

  return { notify };
}
