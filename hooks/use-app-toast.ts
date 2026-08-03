"use client";

import { toast } from "sonner";

const appToast = {
  error(message: string) {
    toast.error(message);
  },
  success(message: string) {
    toast.success(message);
  },
};

export function useAppToast() {
  return appToast;
}
