import React, { Component } from "react";
import type { ErrorInfo } from "react";
import ErrorFallback from "@wrappers/Error/ErrorFallback";
import AuthPageWrapper from "@wrappers/Page/AuthPageWrapper";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AuthPageWrapper>
          <ErrorFallback  error={this.state.error!} />
        </AuthPageWrapper>
      )
      return ;
    }
    return this.props.children;
  }
}