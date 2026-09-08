import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('sawari_language');
      localStorage.removeItem('sawari_theme');
      localStorage.removeItem('sawari_default_nav');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-zinc-100">Something went wrong</h2>
              <p className="text-xs text-zinc-400">
                The application encountered an unexpected state. Don't worry, your ride data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-left overflow-auto max-h-32 text-xs font-mono text-rose-400">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset Cache & Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
