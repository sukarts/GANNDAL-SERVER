'use client';
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

// État vide standard : icône discrète + message + action facultative.
export default function EmptyState({
  title, hint, action, icon,
}: { title: string; hint?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="text-muted mb-3">{icon ?? <Inbox size={32} strokeWidth={1.5} />}</div>
      <p className="font-medium text-content">{title}</p>
      {hint && <p className="text-sm text-muted mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
