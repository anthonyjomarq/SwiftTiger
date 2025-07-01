/**
 * Example Component Demonstrating Error Handling System
 * Shows various ways to use the error handling utilities
 */

import React, { useState } from "react";
import {
  useErrorHandler,
  useAuthErrorHandler,
  useValidationErrorHandler,
  useNetworkErrorHandler,
} from "../hooks/useErrorHandler";
import { toast } from "../utils/toast";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function ErrorHandlingExample() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  // General error handler
  const generalErrorHandler = useErrorHandler({
    context: { type: "example_component" },
  });

  // Specific error type handlers
  const authErrorHandler = useAuthErrorHandler({
    context: { type: "auth_example" },
  });

  const validationErrorHandler = useValidationErrorHandler({
    context: { type: "validation_example" },
  });

  const networkErrorHandler = useNetworkErrorHandler({
    context: { type: "network_example" },
  });

  // Example 1: Basic error handling with API call
  const handleApiCall = generalErrorHandler.handleApiCall(
    async () => {
      // Simulate API call that might fail
      const response = await fetch("/api/test-endpoint");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    {
      retries: 3,
      retryDelay: 1000,
      onSuccess: (data) => {
        console.log("API call successful:", data);
      },
      onRetry: (error, attempt, maxRetries) => {
        console.log(`Retry attempt ${attempt}/${maxRetries}`);
      },
    }
  );

  // Example 2: Form submission with error handling
  const handleFormSubmit = generalErrorHandler.handleSubmit(
    async (data) => {
      // Simulate form submission
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Form submission failed");
      }

      return response.json();
    },
    {
      successMessage: "Form submitted successfully!",
      errorContext: { action: "submit_form", formData: Object.keys(formData) },
    }
  );

  // Example 3: File upload with validation
  const handleFileUpload = generalErrorHandler.handleFileUpload(
    async (file, onProgress) => {
      // Simulate file upload with progress
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress?.(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    },
    {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
      onSuccess: (result) => {
        console.log("File uploaded:", result);
      },
    }
  );

  // Example 4: Simulate different error types
  const simulateErrors = {
    network: () => {
      networkErrorHandler.handleError(new Error("Network connection failed"), {
        action: "test_network_error",
      });
    },

    validation: () => {
      validationErrorHandler.handleError(new Error("Invalid input data"), {
        action: "test_validation_error",
      });
    },

    auth: () => {
      authErrorHandler.handleError(new Error("Authentication required"), {
        action: "test_auth_error",
      });
    },

    server: () => {
      generalErrorHandler.handleError(new Error("Internal server error"), {
        action: "test_server_error",
      });
    },
  };

  // Example 5: Custom error handling with toast
  const handleCustomError = () => {
    try {
      // Simulate some operation that might fail
      throw new Error("Custom error message");
    } catch (error) {
      const handledError = generalErrorHandler.handleError(error, {
        action: "custom_operation",
        customData: "example",
      });

      // Show custom toast
      toast.error(handledError.userMessage, {
        title: "Custom Error",
        action: {
          id: "retry",
          label: "Retry",
        },
      });
    }
  };

  // Example 6: Async function wrapper
  const handleAsyncOperation = generalErrorHandler.withErrorHandling(
    async (param) => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (param === "error") {
        throw new Error("Async operation failed");
      }

      return `Operation completed with param: ${param}`;
    },
    { action: "async_operation" }
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Error Handling Examples</h2>

        {/* Error Status Display */}
        {generalErrorHandler.hasError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800">Current Error:</h3>
            <p className="text-red-700">{generalErrorHandler.userMessage}</p>
            <button
              onClick={generalErrorHandler.clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Clear Error
            </button>
          </div>
        )}

        {/* Example 1: API Call */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">1. API Call with Retry</h3>
          <Button
            onClick={handleApiCall}
            disabled={generalErrorHandler.isLoading}
            className="mr-2"
          >
            {generalErrorHandler.isLoading ? "Calling API..." : "Test API Call"}
          </Button>
        </div>

        {/* Example 2: Form Submission */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">2. Form Submission</h3>
          <div className="space-y-2 mb-3">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={() => handleFormSubmit(formData)}
            disabled={generalErrorHandler.isLoading}
          >
            {generalErrorHandler.isLoading ? "Submitting..." : "Submit Form"}
          </Button>
        </div>

        {/* Example 3: File Upload */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">3. File Upload</h3>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleFileUpload(file, (progress) => {
                  console.log(`Upload progress: ${progress}%`);
                });
              }
            }}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Example 4: Error Simulation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            4. Simulate Error Types
          </h3>
          <div className="space-x-2">
            <Button onClick={simulateErrors.network} variant="secondary">
              Network Error
            </Button>
            <Button onClick={simulateErrors.validation} variant="secondary">
              Validation Error
            </Button>
            <Button onClick={simulateErrors.auth} variant="secondary">
              Auth Error
            </Button>
            <Button onClick={simulateErrors.server} variant="secondary">
              Server Error
            </Button>
          </div>
        </div>

        {/* Example 5: Custom Error Handling */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            5. Custom Error with Toast
          </h3>
          <Button onClick={handleCustomError} variant="secondary">
            Trigger Custom Error
          </Button>
        </div>

        {/* Example 6: Async Operation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            6. Async Operation Wrapper
          </h3>
          <div className="space-x-2">
            <Button
              onClick={() => handleAsyncOperation("success")}
              disabled={generalErrorHandler.isLoading}
            >
              {generalErrorHandler.isLoading ? "Processing..." : "Success Case"}
            </Button>
            <Button
              onClick={() => handleAsyncOperation("error")}
              disabled={generalErrorHandler.isLoading}
              variant="secondary"
            >
              {generalErrorHandler.isLoading ? "Processing..." : "Error Case"}
            </Button>
          </div>
        </div>

        {/* Toast Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">7. Toast Notifications</h3>
          <div className="space-x-2">
            <Button
              onClick={() => toast.success("Success message!")}
              variant="success"
            >
              Success Toast
            </Button>
            <Button
              onClick={() => toast.error("Error message!")}
              variant="danger"
            >
              Error Toast
            </Button>
            <Button
              onClick={() => toast.warning("Warning message!")}
              variant="warning"
            >
              Warning Toast
            </Button>
            <Button onClick={() => toast.info("Info message!")} variant="info">
              Info Toast
            </Button>
            <Button onClick={() => toast.clear()} variant="secondary">
              Clear All
            </Button>
          </div>
        </div>

        {/* Error Context Builder */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            8. Error Context Builder
          </h3>
          <Button
            onClick={() => {
              const context = generalErrorHandler.buildErrorContext(
                "test_operation",
                "example_resource",
                { customField: "customValue" }
              );
              console.log("Built error context:", context);
              toast.info("Check console for error context");
            }}
            variant="secondary"
          >
            Build Error Context
          </Button>
        </div>
      </div>
    </div>
  );
}
