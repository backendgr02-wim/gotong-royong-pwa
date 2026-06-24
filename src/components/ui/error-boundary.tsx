"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "./button";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[ErrorBoundary]", error.message, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold text-ink">
          {this.props.label ?? "Terjadi kendala"}
        </h2>
        <p className="max-w-xs text-sm text-muted">
          Halaman tidak bisa dimuat. Coba refresh.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.reload();
          }}
        >
          Muat Ulang
        </Button>
      </div>
    );
  }
}
