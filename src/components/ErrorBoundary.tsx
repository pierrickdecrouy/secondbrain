import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
                        Une erreur est survenue
                    </h1>
                    <p style={{ marginBottom: '2rem' }}>
                        L'application a rencontré un problème inattendu.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            marginBottom: '2rem'
                        }}
                    >
                        Recharger l'application
                    </button>

                    {this.state.error && (
                        <details style={{ width: '100%', maxWidth: '800px' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Détails de l'erreur
                            </summary>
                            <div style={{
                                backgroundColor: '#1e293b',
                                color: '#e2e8f0',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace'
                            }}>
                                <p style={{ color: '#f87171', marginBottom: '0.5rem' }}>
                                    {this.state.error.toString()}
                                </p>
                                <pre style={{ whiteSpace: 'pre-wrap' }}>
                                    {this.state.errorInfo?.componentStack || 'Pas de stack trace disponible'}
                                </pre>
                            </div>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
