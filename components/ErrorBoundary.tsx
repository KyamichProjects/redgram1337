
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-200">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-3xl">⚠️</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
             <p className="text-gray-500 mb-6 text-sm">
               The app encountered an error (likely due to old data in your browser). 
               Please reset the app data to fix it.
             </p>
             
             <div className="bg-gray-50 p-3 rounded-xl mb-6 text-left overflow-auto max-h-32">
                 <code className="text-xs text-red-500 font-mono break-words">
                     {this.state.error?.toString()}
                 </code>
             </div>

             <button 
               onClick={this.handleReset}
               className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/30"
             >
               Reset App Data & Reload
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
