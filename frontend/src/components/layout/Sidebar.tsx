import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Search, 
  Brain, 
  History, 
  Settings,
  ShieldCheck,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  hindsightConfigured?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ hindsightConfigured }) => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/investigate', label: 'AI Investigation', icon: Search, highlight: true },
    { to: '/memory', label: 'Hindsight Memory', icon: Brain },
    { to: '/history', label: 'Learning History', icon: History },
    { to: '/settings', label: 'Settings & Status', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
              RecallOps
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Persistent Incident Intelligence</p>
          </div>
        </div>
      </div>

      {/* Memory engine indicator pill */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-mono">
            <Brain className="h-3.5 w-3.5 text-purple-400" /> Hindsight Memory
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
            hindsightConfigured 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
              : 'bg-amber-950/70 text-amber-400 border border-amber-800/70'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${hindsightConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {hindsightConfigured ? 'CONNECTED' : 'DEMO MODE'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Incident Response
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${item.highlight ? 'relative' : ''}`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-925">
        <div className="flex items-start gap-2.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-slate-200 font-medium">Safe Investigation</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Human-in-the-loop: remediation requires explicit engineer confirmation.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

