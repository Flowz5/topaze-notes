import { createContext } from 'react';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Action destructrice : bouton de confirmation en rouge */
  danger?: boolean;
};

export type PromptOptions = {
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
};

export type ToastKind = 'info' | 'success' | 'error';

export type DialogsApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Renvoie le texte saisi (nettoyé), ou null si annulé / vide */
  prompt: (options: PromptOptions) => Promise<string | null>;
  toast: (message: string, kind?: ToastKind) => void;
};

export const DialogsContext = createContext<DialogsApi | null>(null);
