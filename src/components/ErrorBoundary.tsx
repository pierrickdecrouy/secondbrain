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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderRadius: '12px'
        }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Warning size={48} weight="duotone" />
          </div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Oups ! Une erreur est survenue.</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
            L'application a rencontré un problème inattendu. Rassurez-vous, vos données sont sauvegardées.
          </p>
          
          {this.state.error && (
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#ef4444',
              maxWidth: '600px',
              overflow: 'auto',
              textAlign: 'left',
              marginBottom: '2rem',
              fontFamily: 'monospace'
            }}>
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              className="settings-btn secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowClockwise size={18} />
              Réessayer
            </button>
            <button
              onClick={() => window.location.reload()}
              className="settings-btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
