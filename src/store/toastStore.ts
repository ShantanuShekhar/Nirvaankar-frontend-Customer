import { create } from 'zustand'

export type ToastTone = 'neutral' | 'success' | 'warn' | 'danger'

export type ToastItem = {
  id: string
  title: string
  description?: string
  tone?: ToastTone
  durationMs?: number
}

type ToastState = {
  items: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (toast) => {
    const id = toast.id ?? crypto.randomUUID()
    set((s) => ({ items: [...s.items, { ...toast, id }] }))
    const duration = toast.durationMs ?? 3800
    if (duration > 0) {
      window.setTimeout(() => get().dismiss(id), duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}))

export function toast(input: Omit<ToastItem, 'id'> & { id?: string }) {
  return useToastStore.getState().push(input)
}
