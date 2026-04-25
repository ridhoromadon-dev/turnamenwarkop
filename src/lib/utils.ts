import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { auth, db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { OperationType, type FirestoreErrorInfo, ThemeConfig } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logAdminAction(username: string, action: string, details: string, targetId?: string) {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, "admin_logs"), {
      userId: auth.currentUser.uid,
      username,
      action,
      details,
      targetId: targetId || "",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const DEFAULT_THEMES: Record<string, ThemeConfig> = {
  dark: {
    bg: "bg-[#0f172a]",
    text: "text-slate-50",
    primary: "bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700",
    card: "bg-slate-800/40 backdrop-blur-md border-slate-700/50 rounded-[1.5rem]",
    navbar: "bg-[#0f172a]/80 border-slate-800/50",
    accent: "text-sky-400"
  },
  white: {
    bg: "bg-slate-50",
    text: "text-slate-900",
    primary: "bg-slate-900 hover:bg-slate-800",
    card: "bg-white border-slate-200 shadow-sm rounded-[1.5rem]",
    navbar: "bg-white/80 border-slate-200",
    accent: "text-slate-600"
  },
  red: {
    bg: "bg-[#1a0b0b]",
    text: "text-rose-50",
    primary: "bg-gradient-to-br from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800",
    card: "bg-rose-950/30 backdrop-blur-md border-rose-900/50 rounded-[1.5rem]",
    navbar: "bg-[#1a0b0b]/80 border-rose-900/50",
    accent: "text-rose-400"
  },
  yellow: {
    bg: "bg-[#1a140b]",
    text: "text-amber-50",
    primary: "bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700",
    card: "bg-amber-950/30 backdrop-blur-md border-amber-900/50 rounded-[1.5rem]",
    navbar: "bg-[#1a140b]/80 border-amber-900/50",
    accent: "text-amber-400"
  }
};

