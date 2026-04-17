"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Toast, ToastItem } from "@/components/ui/toast";

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        items={toasts}
        onClose={(id) =>
          setToasts((current) => current.filter((item) => item.id !== id))
        }
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast doit etre utilise dans ToastProvider.");
  }

  return context;
}
