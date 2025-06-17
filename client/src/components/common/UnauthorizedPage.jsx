import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

const UnauthorizedPage = () => {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon error-icon-danger">
          <Shield className="icon-lg text-error-600" />
        </div>
        <h2 className="error-title">Access Denied</h2>
        <p className="error-subtitle">
          You don't have permission to access this page.
        </p>
      </div>

      <div className="error-content">
        <div className="card error-card">
          <div className="error-message">
            <p className="error-description">
              Your current role doesn't have the necessary permissions to view
              this content. If you believe this is an error, please contact your
              administrator.
            </p>

            <div className="error-actions">
              <Link to="/dashboard" className="btn btn-primary btn-md">
                <ArrowLeft className="icon-sm mr-2" />
                Go to Dashboard
              </Link>
              <Link to="/profile" className="btn btn-outline btn-md">
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
