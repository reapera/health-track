"use client";

import { useEffect, useRef } from "react";

// Bottom sheet on phones, centered dialog on wider screens. Built on <dialog> for
// focus trapping, Escape to close and an inert background.
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Tapping the backdrop closes the sheet
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
      className="food-sheet m-0 mt-auto w-full max-w-none sm:m-auto sm:max-w-md bg-transparent p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-700 sm:hidden" aria-hidden />
        <div className="flex items-center gap-3 mb-4">
          <h2 className="flex-1 text-lg font-semibold truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 h-10 w-10 grid place-items-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
