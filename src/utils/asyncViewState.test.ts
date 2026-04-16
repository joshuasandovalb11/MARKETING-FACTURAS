import { describe, expect, it } from 'vitest';
import { buildAsyncViewState } from './asyncViewState';

describe('buildAsyncViewState', () => {
  it('returns idle when query is disabled', () => {
    const state = buildAsyncViewState({
      enabled: false,
      hasData: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    expect(state).toBe('idle');
  });

  it('prioritizes recoverable error state', () => {
    const state = buildAsyncViewState({
      enabled: true,
      hasData: true,
      isLoading: false,
      isFetching: true,
      isError: true,
    });

    expect(state).toBe('error-recoverable');
  });

  it('returns loading-initial when first load has no data', () => {
    const state = buildAsyncViewState({
      enabled: true,
      hasData: false,
      isLoading: true,
      isFetching: true,
      isError: false,
    });

    expect(state).toBe('loading-initial');
  });

  it('returns loading-refresh while fetching with previous data', () => {
    const state = buildAsyncViewState({
      enabled: true,
      hasData: true,
      isLoading: false,
      isFetching: true,
      isError: false,
    });

    expect(state).toBe('loading-refresh');
  });

  it('returns success-empty when enabled but no rows', () => {
    const state = buildAsyncViewState({
      enabled: true,
      hasData: false,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    expect(state).toBe('success-empty');
  });

  it('returns success-data when rows are available and stable', () => {
    const state = buildAsyncViewState({
      enabled: true,
      hasData: true,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    expect(state).toBe('success-data');
  });
});
