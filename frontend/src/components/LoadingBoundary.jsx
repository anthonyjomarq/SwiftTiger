import React from "react";
import Spinner from "./ui/Spinner";

const LoadingBoundary = React.memo(
  ({
    loading,
    error,
    children,
    loadingText = "Loading...",
    errorText = "An error occurred",
    onRetry,
    showSpinner = true,
    className = "",
  }) => {
    if (loading) {
      return (
        <div
          className={`flex flex-col items-center justify-center p-8 ${className}`}
        >
          {showSpinner && <Spinner className="mb-4" />}
          <p className="text-gray-600">{loadingText}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={`flex flex-col items-center justify-center p-8 ${className}`}
        >
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">{errorText}</p>
          {error.message && (
            <p className="text-gray-600 text-sm mb-4 text-center max-w-md">
              {error.message}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return children;
  }
);

LoadingBoundary.displayName = "LoadingBoundary";

export default LoadingBoundary;
