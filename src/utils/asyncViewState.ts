export type AsyncViewState =
  | 'idle'
  | 'loading-initial'
  | 'loading-refresh'
  | 'success-empty'
  | 'success-data'
  | 'error-recoverable';

interface BuildAsyncViewStateParams {
  enabled: boolean;
  hasData: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
}

export function buildAsyncViewState({
  enabled,
  hasData,
  isLoading,
  isFetching,
  isError,
}: BuildAsyncViewStateParams): AsyncViewState {
  if (!enabled) return 'idle';

  if (isError) return 'error-recoverable';

  if (isLoading && !hasData) return 'loading-initial';

  if (isFetching && hasData) return 'loading-refresh';

  return hasData ? 'success-data' : 'success-empty';
}
