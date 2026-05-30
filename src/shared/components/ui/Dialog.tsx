import { ReactNode } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md scale-100 rounded-xl border border-border bg-card p-6 shadow-xl transition-all duration-300 mx-4">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
