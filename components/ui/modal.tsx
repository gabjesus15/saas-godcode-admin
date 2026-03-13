"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-zinc-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
