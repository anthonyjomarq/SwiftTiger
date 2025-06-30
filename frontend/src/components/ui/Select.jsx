import React from "react";
import clsx from "clsx";

export default function Select({
  label,
  error,
  helperText,
  options = [],
  className = "",
  ...rest
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-1 font-medium text-primary-700">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full px-4 py-2 rounded-lg border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none",
          error
            ? "border-error-500 focus:ring-error-300 bg-error-50"
            : "border-gray-300 focus:ring-primary-300 bg-white",
          className
        )}
        aria-invalid={!!error}
        {...rest}
      >
        <option value="" disabled hidden>
          Select an option
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
      {error && <p className="text-xs text-error-500 mt-1">{error}</p>}
    </div>
  );
}
