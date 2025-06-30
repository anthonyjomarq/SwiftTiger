import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function Modal({ open, onClose, title, children, actions }) {
  const overlayRef = useRef();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-strong w-full max-w-lg mx-4 animate-fade-in">
        {title && (
          <div className="px-6 pt-6 pb-2 text-xl font-bold text-primary-700">
            {title}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {actions && (
          <div className="px-6 pb-6 flex gap-2 justify-end">{actions}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
