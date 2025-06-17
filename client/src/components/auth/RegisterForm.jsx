import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

// Validation schema
const registerSchema = yup.object({
  firstName: yup
    .string()
    .required("First name is required")
    .min(1, "First name must be at least 1 character")
    .max(50, "First name must be less than 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(1, "Last name must be at least 1 character")
    .max(50, "Last name must be less than 50 characters"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
  phone: yup
    .string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
    .nullable(),
  role: yup
    .string()
    .oneOf(["admin", "dispatcher", "technician"], "Invalid role")
    .required("Role is required"),
});

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      role: "technician",
    },
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus className="icon-md text-primary-600" />
          </div>
          <h2 className="auth-title">Join SwiftTiger</h2>
          <p className="auth-subtitle">
            Or{" "}
            <Link to="/login" className="auth-link">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form
          className="auth-form register-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="form-fields">
            {/* Name Fields */}
            <div className="name-fields">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First name
                </label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <User className="icon-sm text-secondary-400" />
                  </div>
                  <input
                    {...register("firstName")}
                    type="text"
                    autoComplete="given-name"
                    className="input input-with-icon"
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last name
                </label>
                <div className="input-wrapper">
                  <input
                    {...register("lastName")}
                    type="text"
                    autoComplete="family-name"
                    className="input"
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Mail className="icon-sm text-secondary-400" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className="input input-with-icon"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone number (optional)
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Phone className="icon-sm text-secondary-400" />
                </div>
                <input
                  {...register("phone")}
                  type="tel"
                  autoComplete="tel"
                  className="input input-with-icon"
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <div className="input-wrapper">
                <select {...register("role")} className="input select-input">
                  <option value="technician">Technician</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Lock className="icon-sm text-secondary-400" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input input-with-icon"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="icon-sm text-secondary-400" />
                  ) : (
                    <Eye className="icon-sm text-secondary-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm password
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <Lock className="icon-sm text-secondary-400" />
                </div>
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input input-with-icon"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="icon-sm text-secondary-400" />
                  ) : (
                    <Eye className="icon-sm text-secondary-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md w-full"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserPlus className="icon-sm mr-2" />
                  Create account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
