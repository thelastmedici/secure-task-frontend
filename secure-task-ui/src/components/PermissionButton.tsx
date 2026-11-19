import { LockKeyhole } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  allowed: boolean;
  reason: string;
  children: ReactNode;
};

export function PermissionButton({ allowed, reason, children, className = '', ...props }: Props) {
  return (
    <span className={`permission-button-wrap ${allowed ? '' : 'permission-denied'}`} title={allowed ? undefined : reason}>
      <button {...props} className={className} disabled={!allowed} aria-label={allowed ? undefined : reason}>
        {!allowed && <LockKeyhole size={14} aria-hidden="true" />}{children}
      </button>
    </span>
  );
}
