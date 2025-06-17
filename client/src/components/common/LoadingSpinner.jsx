import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/className.js";

const LoadingSpinner = ({
  size = "md",
  className,
  text,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "loading-spinner-sm",
    md: "loading-spinner-md",
    lg: "loading-spinner-lg",
    xl: "loading-spinner-xl",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "",
    lg: "text-lg",
    xl: "text-xl",
  };

  const spinner = (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen",
        className
      )}
      style={{ gap: "8px" }}
    >
      <Loader2
        className={cn("spinner-icon text-primary-600", sizeClasses[size])}
      />
      {text && (
        <span
          className={cn(
            "text-secondary-600 font-medium",
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="loading-overlay">{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
