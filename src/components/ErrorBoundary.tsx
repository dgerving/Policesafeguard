import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, ShieldCheck, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Police SafeGuard] Caught runtime error in ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {}
  };

  private handleResetSession = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('police_safeguard_active_recording_session');
        localStorage.removeItem('police_protection_stream_active');
        localStorage.removeItem('police_safeguard_failover_mode');
        window.location.href = '/';
      }
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50">
                APPLICATION RECOVERY
              </span>
              <h2 className="text-lg font-black text-white mt-2">
                Police SafeGuard Shield Active
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                A temporary interface issue occurred. All your certified evidence records, legal settings, and recovery keys remain securely saved.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-28">
              <span className="text-amber-400 font-bold">SafeGuard Error: </span>
              {this.state.error?.message || 'Unexpected application state'}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-black" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-zinc-400" />
                <span>Reset to Dashboard</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FRE 902 Evidence Vault Protection Unaffected</span>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
