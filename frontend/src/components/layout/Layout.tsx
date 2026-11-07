import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { settingsApi } from '../../services/api';
import type { SettingsStatus } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [status, setStatus] = useState<SettingsStatus | null>(null);

  useEffect(() => {
    settingsApi.getStatus()
      .then(setStatus)
      .catch((err) => console.warn('Could not fetch settings status:', err));
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar hindsightConfigured={status?.hindsight.configured} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          hindsightConfigured={status?.hindsight.configured} 
          groqConfigured={status?.groq.configured} 
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

