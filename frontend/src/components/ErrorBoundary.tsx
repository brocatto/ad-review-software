import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defense: a runtime error anywhere in the tree shows a recoverable
 * screen instead of a blank page, and is reported to Sentry when configured.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack);
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="card-static p-8 w-full max-w-md text-center animate-fadeIn">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Algo deu errado</h1>
          <p className="text-text-tertiary mb-6">
            Ocorreu um erro inesperado nesta tela. Recarregue a página; se continuar, volte ao início.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs text-status-error bg-black/30 rounded-xl p-3 mb-6 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Recarregar
            </button>
            <a href="/" className="btn btn-secondary">
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    );
  }
}
