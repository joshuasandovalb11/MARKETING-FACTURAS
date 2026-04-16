import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../services/httpClient';
import {
  resolveErrorMessageNotification,
  resolveErrorNotification,
  resolveEventNotification,
} from './notificationPolicy';

describe('notificationPolicy', () => {
  it('maps analysis errors to toast channel', () => {
    const resolved = resolveErrorNotification({
      scope: 'analysis-map',
      error: new ApiRequestError('Tiempo de espera agotado', 'TIMEOUT'),
      fallback: 'fallback',
    });

    expect(resolved.channel).toBe('toast');
    expect(resolved.level).toBe('error');
    expect(resolved.message).toContain('solicitud');
  });

  it('maps picker errors to toast-inline channel', () => {
    const resolved = resolveErrorNotification({
      scope: 'vendors-picker',
      error: new ApiRequestError('Error de red', 'NETWORK'),
      fallback: 'fallback',
    });

    expect(resolved.channel).toBe('toast-inline');
    expect(resolved.level).toBe('error');
    expect(resolved.message).toContain('conectar');
  });

  it('uses fallback when message is empty in resolveErrorMessageNotification', () => {
    const resolved = resolveErrorMessageNotification({
      scope: 'client-search',
      message: '   ',
      fallback: 'fallback-search',
    });

    expect(resolved.message).toBe('fallback-search');
    expect(resolved.dedupeKey).toBe('client-search:fallback-search');
  });

  it('resolves filters-reset-empty info event', () => {
    const resolved = resolveEventNotification('filters-reset-empty');

    expect(resolved.channel).toBe('toast');
    expect(resolved.level).toBe('info');
    expect(resolved.message).toBe('No hay filtros activos para limpiar.');
  });

  it('uses custom message for session-message events', () => {
    const resolved = resolveEventNotification(
      'session-message',
      'Sesion iniciada'
    );

    expect(resolved.channel).toBe('toast');
    expect(resolved.level).toBe('success');
    expect(resolved.message).toBe('Sesion iniciada');
  });
});
