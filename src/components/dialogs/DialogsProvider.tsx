import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { DialogsContext, type ConfirmOptions, type PromptOptions, type ToastKind } from './context';
import './dialogs.css';

type ActiveDialog =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };

type Toast = { id: number; message: string; kind: ToastKind };

const TOAST_DURATION = 4500;

/**
 * Remplace window.alert / confirm / prompt par des dialogues dans le style de l'appli.
 * Les fonctions renvoient des promesses : `if (await confirm({...}))`, comme avant.
 */
export function DialogsProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  const confirm = useCallback((options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => setDialog({ kind: 'confirm', options, resolve })), []);

  const prompt = useCallback((options: PromptOptions) =>
    new Promise<string | null>((resolve) => setDialog({ kind: 'prompt', options, resolve })), []);

  const dismissToast = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextToastId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, kind }]);
    window.setTimeout(() => dismissToast(id), TOAST_DURATION);
  }, [dismissToast]);

  const api = useMemo(() => ({ confirm, prompt, toast }), [confirm, prompt, toast]);

  const close = (value: boolean | string | null) => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') dialog.resolve(value === true);
    else dialog.resolve(typeof value === 'string' && value.trim() ? value.trim() : null);
    setDialog(null);
  };

  return (
    <DialogsContext.Provider value={api}>
      {children}
      {dialog && <DialogView dialog={dialog} onClose={close} />}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.kind === 'error' ? <AlertCircle size={18} /> : t.kind === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
            <span className="toast-message">{t.message}</span>
            <button type="button" className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </DialogsContext.Provider>
  );
}

function DialogView({ dialog, onClose }: { dialog: ActiveDialog; onClose: (value: boolean | string | null) => void }) {
  const titleId = useId();
  const [value, setValue] = useState(dialog.kind === 'prompt' ? dialog.options.defaultValue ?? '' : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancel = () => onClose(dialog.kind === 'confirm' ? false : null);

  useEffect(() => {
    if (dialog.kind === 'prompt') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      confirmRef.current?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois par dialogue
  }, [dialog]);

  const { options } = dialog;
  const danger = dialog.kind === 'confirm' && dialog.options.danger;

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <form
        className="modal-content dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault();
          onClose(dialog.kind === 'confirm' ? true : value);
        }}
      >
        <h3 id={titleId} className="modal-title">{options.title}</h3>
        {dialog.kind === 'confirm' && dialog.options.message && (
          <p className="modal-text">{dialog.options.message}</p>
        )}
        {dialog.kind === 'prompt' && (
          <>
            {dialog.options.label && <label className="field-label" htmlFor={`${titleId}-input`}>{dialog.options.label}</label>}
            <input
              id={`${titleId}-input`}
              ref={inputRef}
              className="input"
              value={value}
              placeholder={dialog.options.placeholder}
              onChange={(e) => setValue(e.target.value)}
            />
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={cancel}>
            {(dialog.kind === 'confirm' && dialog.options.cancelLabel) || 'Annuler'}
          </button>
          <button
            type="submit"
            ref={confirmRef}
            className={danger ? 'btn btn-danger-solid' : 'btn-confirm'}
            disabled={dialog.kind === 'prompt' && !value.trim()}
          >
            {options.confirmLabel || (dialog.kind === 'confirm' ? 'Confirmer' : 'Valider')}
          </button>
        </div>
      </form>
    </div>
  );
}
