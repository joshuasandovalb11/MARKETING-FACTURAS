import { getUserFacingErrorMessage } from './apiErrors';

export type NotificationChannel = 'toast' | 'inline' | 'toast-inline' | 'none';
export type NotificationLevel = 'success' | 'error' | 'warning' | 'info';

export type ErrorNotificationScope =
  | 'analysis-map'
  | 'dates-picker'
  | 'vendors-picker'
  | 'proveedores-picker'
  | 'grupos-empresariales-picker'
  | 'client-search'
  | 'invoice-drawer';

export type EventNotificationScope =
  | 'network-offline'
  | 'network-online'
  | 'filters-reset'
  | 'filters-reset-empty'
  | 'session-message';

export interface ResolvedNotification {
  channel: NotificationChannel;
  level: NotificationLevel;
  message: string;
  dedupeKey: string;
}

const ERROR_SCOPE_CHANNEL: Record<ErrorNotificationScope, NotificationChannel> =
  {
    'analysis-map': 'toast',
    'dates-picker': 'toast-inline',
    'vendors-picker': 'toast-inline',
    'proveedores-picker': 'toast-inline',
    'grupos-empresariales-picker': 'toast-inline',
    'client-search': 'toast-inline',
    'invoice-drawer': 'toast-inline',
  };

const EVENT_SCOPE_POLICY: Record<
  EventNotificationScope,
  {
    channel: NotificationChannel;
    level: NotificationLevel;
    defaultMessage: string;
  }
> = {
  'network-offline': {
    channel: 'toast',
    level: 'warning',
    defaultMessage:
      'Sin conexion. Algunas acciones pueden fallar temporalmente.',
  },
  'network-online': {
    channel: 'toast',
    level: 'success',
    defaultMessage: 'Conexion restablecida.',
  },
  'filters-reset': {
    channel: 'toast',
    level: 'success',
    defaultMessage: 'Filtros restablecidos',
  },
  'filters-reset-empty': {
    channel: 'toast',
    level: 'info',
    defaultMessage: 'No hay filtros activos para limpiar.',
  },
  'session-message': {
    channel: 'toast',
    level: 'success',
    defaultMessage: '',
  },
};

export function resolveErrorNotification(params: {
  scope: ErrorNotificationScope;
  error: unknown;
  fallback: string;
}): ResolvedNotification {
  const message = getUserFacingErrorMessage(params.error, {
    fallback: params.fallback,
  });

  return {
    channel: ERROR_SCOPE_CHANNEL[params.scope],
    level: 'error',
    message,
    dedupeKey: `${params.scope}:${message}`,
  };
}

export function resolveErrorMessageNotification(params: {
  scope: ErrorNotificationScope;
  message: string | null | undefined;
  fallback: string;
}): ResolvedNotification {
  const sanitized = (params.message || '').trim();

  return {
    channel: ERROR_SCOPE_CHANNEL[params.scope],
    level: 'error',
    message: sanitized || params.fallback,
    dedupeKey: `${params.scope}:${sanitized || params.fallback}`,
  };
}

export function resolveEventNotification(
  scope: EventNotificationScope,
  customMessage?: string
): ResolvedNotification {
  const policy = EVENT_SCOPE_POLICY[scope];
  const message = (customMessage || '').trim() || policy.defaultMessage;

  return {
    channel: policy.channel,
    level: policy.level,
    message,
    dedupeKey: `${scope}:${message}`,
  };
}
