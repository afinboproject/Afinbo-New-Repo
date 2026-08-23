import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }


  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              The application encountered an unexpected runtime error. You can try refreshing the page.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-3 text-left mb-6 overflow-auto max-h-32">
                <p className="text-[11px] font-mono text-rose-700 font-semibold break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
