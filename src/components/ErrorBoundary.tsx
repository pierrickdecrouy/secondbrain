import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl" >
          <div className="bg-red-500/10 text-red-500 p-4 rounded-full mb-6" >
            <Warning size={48} weight="duotone" />
          </div>
          <h2 className="mb-4 text-2xl font-bold" >Oups ! Une erreur est survenue.</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[400px]" >
            L'application a rencontré un problème inattendu. Rassurez-vous, vos données sont sauvegardées.
          </p>
          
          {this.state.error && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg text-sm text-red-500 max-w-[600px] overflow-auto text-left mb-8 font-mono" >
              {(this.state.error as Error).message}
            </div>
          )}

          <div className="flex gap-4" >
            <button
              onClick={this.handleReset}
              className="settings-btn secondary flex items-center gap-2"
              
            >
              <ArrowClockwise size={18} />
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="settings-btn primary flex items-center gap-2"
              
            >
              <House size={18} />
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
