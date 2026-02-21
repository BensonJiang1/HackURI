// Minimal toast hook stub — not used in our main flow
import React, { useState, useCallback } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, variant }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
