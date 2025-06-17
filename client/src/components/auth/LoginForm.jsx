import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, user } = useAuth();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("🔍 LoginForm - Form data being sent:", formData);
    console.log("🔍 LoginForm - Individual values:", {
      email: formData.email,
      password: formData.password ? "[HIDDEN]" : "undefined",
    });

    try {
      // CRITICAL FIX: Send email and password as separate parameters
      // NOT as formData object
      const result = await login(formData.email, formData.password);

      console.log("🔍 LoginForm - Login result:", result);

      if (!result.success) {
        setError(result.error || "Login failed");
      }
      // If successful, the redirect will happen automatically via isAuthenticated check
    } catch (err) {
      console.error("🔍 LoginForm - Catch error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔍 LoginForm - Input change - ${name}:`, value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Quick login with default admin credentials
  const quickLogin = () => {
    console.log("🔍 LoginForm - Quick login clicked");
    setFormData({
      email: "admin@swifttiger.com",
      password: "admin123",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: "#333",
              marginBottom: "0.5rem",
              fontSize: "2rem",
            }}
          >
            SwiftTiger
          </h1>
          <p style={{ color: "#666", margin: "0" }}>Field Service Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fee",
                color: "#c33",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                border: "1px solid #fcc",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: isLoading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginBottom: "1rem",
            }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            paddingTop: "1rem",
            borderTop: "1px solid #eee",
          }}
        >
          <p
            style={{
              color: "#666",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
            }}
          >
            Default admin credentials:
          </p>
          <button
            onClick={quickLogin}
            type="button"
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Use Admin Login
          </button>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#666",
          }}
        >
          <strong>Debug Info:</strong>
          <br />
          Current form data: {JSON.stringify(formData, null, 2)}
          <br />
          Authenticated: {String(isAuthenticated)}
          <br />
          User: {user?.email || "None"}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
