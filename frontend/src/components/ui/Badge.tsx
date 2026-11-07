import React from 'react';
import type { Severity, IncidentStatus } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const styles: Record<Severity, string> = {
    Critical: 'bg-red-950/80 text-red-400 border-red-800/80',
    High: 'bg-orange-950/80 text-orange-400 border-orange-800/80',
    Medium: 'bg-amber-950/80 text-amber-400 border-amber-800/80',
    Low: 'bg-blue-950/80 text-blue-400 border-blue-800/80',
  };

  const dotColors: Record<Severity, string> = {
    Critical: 'bg-red-400 animate-pulse',
    High: 'bg-orange-400',
    Medium: 'bg-amber-400',
    Low: 'bg-blue-400',
  };

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${styles[severity]} ${sizeClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[severity]}`}></span>
      {severity}
    </span>
  );
};

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<IncidentStatus, string> = {
    Open: 'bg-red-950/60 text-red-300 border-red-800/50',
    Investigating: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
    Resolved: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  };

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${styles[status]} ${sizeClass}`}>
      {status === 'Investigating' && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
      )}
      {status}
    </span>
  );
};

