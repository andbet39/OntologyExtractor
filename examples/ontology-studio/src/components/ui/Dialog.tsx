"use client";

import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className = "" }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`bg-surface-elevated border border-surface-border rounded-lg shadow-2xl text-text-primary max-w-2xl w-full mx-auto p-0 backdrop:bg-black/60 ${className}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
