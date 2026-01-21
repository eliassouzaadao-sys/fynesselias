"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

export function Modal({ isOpen, onClose, title, children, size = "md", description, variant = "dark" }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      document.body.style.overflow = "hidden"
    } else {
      dialog.close()
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  const isDark = variant === "dark"

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={`fixed inset-0 m-auto ${sizeClasses[size]} w-[90%] max-h-[85vh] overflow-y-auto rounded-2xl border p-0 shadow-2xl backdrop:backdrop-blur-sm ${
        isDark
          ? "border-fyn-border bg-fyn-bg backdrop:bg-fyn-primary/60"
          : "border-gray-200 bg-white backdrop:bg-black/50"
      }`}
    >
      <div
        className={`flex items-start justify-between border-b px-6 py-4 ${isDark ? "border-fyn-border" : "border-gray-200"}`}
      >
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? "text-fyn-text" : "text-gray-900"}`}>{title}</h2>
          {description && (
            <p className={`mt-0.5 text-sm ${isDark ? "text-fyn-text-muted" : "text-gray-500"}`}>{description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`rounded-lg p-2 transition-colors ${
            isDark
              ? "text-fyn-muted hover:bg-fyn-surface hover:text-fyn-text"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
