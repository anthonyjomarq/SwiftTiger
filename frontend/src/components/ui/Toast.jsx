import React, { useEffect } from "react";
import clsx from "clsx";

const COLORS = {
  info: "bg-primary-500",
  success: "bg-success-500",
  error: "bg-error-500",
  warning: "bg-warning-500",
};

export default function Toast({
  type = "info",
  message,
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={clsx(
        "fixed top-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-strong text-white text-sm flex items-center gap-2 animate-fade-in",
        COLORS[type]
      )}
      role="alert"
    >
      {message}
      <button
        className="ml-3 text-white/80 hover:text-white text-lg font-bold"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
