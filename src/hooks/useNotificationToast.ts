import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ResolvedNotification } from '../utils/notificationPolicy';

function isToastChannel(channel: ResolvedNotification['channel']) {
  return channel === 'toast' || channel === 'toast-inline';
}

interface NotifyOptions {
  bypassDedupe?: boolean;
  dedupeWindowMs?: number;
}

const DEFAULT_DEDUPE_WINDOW_MS = 1800;

export function useNotificationToast() {
  const dedupeRef = useRef<Map<string, number>>(new Map());

  const notify = useCallback(
    (notification: ResolvedNotification, options: NotifyOptions = {}) => {
      if (!isToastChannel(notification.channel)) return;
      if (!notification.message) return;

      const dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;

      if (!options.bypassDedupe) {
        const now = Date.now();
        const lastShownAt = dedupeRef.current.get(notification.dedupeKey);

        if (
          typeof lastShownAt === 'number' &&
          now - lastShownAt < dedupeWindowMs
        ) {
          return;
        }

        dedupeRef.current.set(notification.dedupeKey, now);
      }

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
    },
    []
  );

  return { notify };
}
