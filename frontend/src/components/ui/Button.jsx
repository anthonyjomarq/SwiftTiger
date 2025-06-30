import React from "react";
import clsx from "clsx";

const VARIANTS = {
  primary:
    "bg-primary-500 hover:bg-primary-600 text-white shadow-primary focus:ring-primary-300",
  secondary:
    "bg-secondary-500 hover:bg-secondary-600 text-primary-700 shadow-soft focus:ring-secondary-300",
  danger:
    "bg-error-500 hover:bg-error-600 text-white shadow-strong focus:ring-error-300",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...rest
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin mr-2 h-5 w-5 text-inherit"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
