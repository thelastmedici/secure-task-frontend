import type { ReactNode } from 'react';

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="purpose-empty-state"><span className="empty-state-illustration" aria-hidden="true">{icon}</span><strong>{title}</strong><p>{description}</p>{action}</div>;
}
