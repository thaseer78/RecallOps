import React from 'react';
import { Bell, Sparkles, Cpu, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  hindsightConfigured?: boolean;
  groqConfigured?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ hindsightConfigured, groqConfigured }) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400">Environment:</span>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
          dev-local
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-slate-400" />
          Memory Bank: <code className="text-slate-300 font-mono bg-slate-800/80 px-1 rounded">recallops-demo</code>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Service badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs">
            <span className={`h-2 w-2 rounded-full ${hindsightConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300">Hindsight:</span>
            <span className={hindsightConfigured ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {hindsightConfigured ? 'Active' : 'Unconfigured'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-300">Groq LLM:</span>
            <span className={groqConfigured ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
              {groqConfigured ? 'Active' : 'Unconfigured'}
            </span>
          </div>
        </div>

        <Link
          to="/investigate"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Investigation</span>
        </Link>
      </div>
    </header>
  );
};

