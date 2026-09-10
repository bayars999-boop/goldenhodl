'use client';

import type { ReactNode } from 'react';

type ConsentFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  summary: string;
};

export default function ConsentField({ id, checked, onChange, children, summary }: ConsentFieldProps) {
  return <label htmlFor={id} className="consent-field"><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{children}<small>{summary}</small></span></label>;
}
