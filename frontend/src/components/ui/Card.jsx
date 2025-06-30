import React from "react";
import clsx from "clsx";

export default function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={clsx(
        "bg-secondary-500 border border-secondary-300 rounded-xl shadow-soft p-6",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
