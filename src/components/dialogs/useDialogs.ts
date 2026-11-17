import { useContext } from 'react';
import { DialogsContext } from './context';

export function useDialogs() {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error('useDialogs doit être utilisé dans un DialogsProvider');
  return ctx;
}
