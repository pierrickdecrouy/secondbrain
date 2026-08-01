import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Warning, ArrowClockwise, House } from '@phosphor-icons/react';
import './styles/ErrorBoundary.css';

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
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
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
        <div className="errorboundary-style-1" >
          <div className="errorboundary-style-2" >
            <Warning size={48} weight="duotone" />
          </div>
          <h2 className="errorboundary-style-3" >Oups ! Une erreur est survenue.</h2>
          <p className="errorboundary-style-4" >
            L'application a rencontré un problème inattendu. Rassurez-vous, vos données sont sauvegardées.
          </p>
          
          {this.state.error && (
            <div className="errorboundary-style-5" >
              {this.state.error.message}
            </div>
          )}

          <div className="errorboundary-style-6" >
            <button
              onClick={this.handleReset}
              className="settings-btn secondary errorboundary-style-7"
              
            >
              <ArrowClockwise size={18} />
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="settings-btn primary errorboundary-style-8"
              
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
