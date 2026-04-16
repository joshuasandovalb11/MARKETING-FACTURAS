import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface AsyncFeedbackBlockProps {
  isLoading: boolean;
  isError: boolean;
  loadingMessage: string;
  errorTitle?: string;
  errorMessage: string;
  onRetry?: () => void;
  className?: string;
}

export default function AsyncFeedbackBlock({
  isLoading,
  isError,
  loadingMessage,
  errorTitle = 'Error de conexion',
  errorMessage,
  onRetry,
  className = 'p-6',
}: AsyncFeedbackBlockProps) {
  if (isLoading) {
    return (
      <div
        className={`${className} flex flex-1 flex-col items-center justify-center text-slate-400 gap-3`}
      >
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs font-medium text-center">
          {loadingMessage}
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={`${className} flex flex-1 flex-col items-center justify-center text-slate-600 text-xs text-center gap-2`}
      >
        <AlertCircle className="w-6 h-6 text-slate-400" />
        <span className="font-medium text-sm">{errorTitle}</span>
        <p className="text-slate-500 max-w-56 text-center">{errorMessage}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex text-xs font-medium items-center gap-1.5 px-3 py-1.5 mt-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md cursor-pointer shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}
