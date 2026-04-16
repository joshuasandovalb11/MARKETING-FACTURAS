interface RecoverableErrorBannerProps {
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export default function RecoverableErrorBanner({
  message,
  retryLabel = 'Reintentar',
  onRetry,
}: RecoverableErrorBannerProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-35 w-[92%] max-w-xl">
      <div className="rounded-lg border border-red-200 bg-white/95 backdrop-blur-sm shadow-lg px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-xs font-medium text-red-700 truncate">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
