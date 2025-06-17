import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon error-icon-warning">
          <AlertTriangle className="icon-lg text-warning-600" />
        </div>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-subtitle">
          The page you're looking for doesn't exist.
        </p>
      </div>

      <div className="error-content">
        <div className="card error-card">
          <div className="error-message">
            <div className="error-404">404</div>

            <p className="error-description">
              The page you're trying to access might have been moved, deleted,
              or never existed.
            </p>

            <div className="error-actions">
              <Link to="/" className="btn btn-primary btn-md">
                <Home className="icon-sm mr-2" />
                Go Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="btn btn-outline btn-md"
              >
                <ArrowLeft className="icon-sm mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
