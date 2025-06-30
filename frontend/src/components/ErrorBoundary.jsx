import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }

    // Log error to external service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo, errorId);
    }
  }

  logErrorToService = async (error, errorInfo, errorId) => {
    try {
      // You can integrate with services like Sentry, LogRocket, etc.
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem("userId") || "anonymous",
      };

      // Example: Send to your own error logging endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

      console.error("Error logged:", errorData);
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;

    // Create error report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert("Error report copied to clipboard. Please send it to support.");
      })
      .catch(() => {
        // Fallback: show in alert
        alert(`Error ID: ${errorId}\nPlease report this error to support.`);
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#00809d] to-[#fcecdd] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-[#ff7601] rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Our team has been
              notified and is working to fix this issue.
            </p>

            {/* Error ID */}
            {this.state.errorId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-500 mb-1">Error ID:</p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {this.state.errorId}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-[#00809d] text-white py-2 px-4 rounded-lg hover:bg-[#006d85] transition-colors duration-200"
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-[#f3a26d] text-white py-2 px-4 rounded-lg hover:bg-[#e8945a] transition-colors duration-200"
              >
                Go to Dashboard
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Report Error
              </button>
            </div>

            {/* Development Info */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-50 rounded-lg">
                  <pre className="text-xs text-red-800 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback = null) => {
  return class extends React.Component {
    render() {
      return (
        <ErrorBoundary fallback={fallback}>
          <Component {...this.props} />
        </ErrorBoundary>
      );
    }
  };
};

// Hook for throwing errors (useful for testing error boundaries)
export const useErrorThrower = () => {
  return (error) => {
    throw error;
  };
};

export default ErrorBoundary;
