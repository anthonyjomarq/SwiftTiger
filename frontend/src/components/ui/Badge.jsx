import React from "react";
import clsx from "clsx";

const COLORS = {
  primary: "bg-primary-500 text-white",
  accent: "bg-accent-500 text-white",
  success: "bg-success-500 text-white",
  error: "bg-error-500 text-white",
  warning: "bg-warning-500 text-white",
  info: "bg-info-500 text-white",
  warm: "bg-warm-500 text-white",
  secondary: "bg-secondary-500 text-primary-700",
};

export default function Badge({
  color = "primary",
  children,
  className = "",
  ...rest
}) {
  return (
    <span
      className={clsx(
        "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
        COLORS[color],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
