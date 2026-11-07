import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Brain, 
  Clock, 
  Flame, 
  ArrowRight,
  TrendingUp,
  Activity,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { incidentApi, memoryApi, activityApi } from '../services/api';
import type { Incident, ActivityLog, MemoryOperation } from '../types';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [memoryStats, setMemoryStats] = useState<{
    totalRetains: number;
    totalRecalls: number;
    totalReflects: number;
    successfulRetains: number;
    hindsightConfigured: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      incidentApi.list({ limit: '100' }),
      memoryApi.getMemories(),
      activityApi.list(),
    ])
      .then(([incRes, memRes, actRes]) => {
        setIncidents(incRes.data);
        setMemoryStats(memRes.stats);
        setActivities(actRes.slice(0, 8));
      })
      .catch((err) => console.error('Dashboard load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((i) => i.status === 'Open' || i.status === 'Investigating').length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved').length;
  const criticalIncidents = incidents.filter((i) => i.severity === 'Critical').length;

  // Severity breakdown
  const severityCounts = {
    Critical: incidents.filter((i) => i.severity === 'Critical').length,
    High: incidents.filter((i) => i.severity === 'High').length,
    Medium: incidents.filter((i) => i.severity === 'Medium').length,
    Low: incidents.filter((i) => i.severity === 'Low').length,
  };

  // Unique services
  const uniqueServices = Array.from(new Set(incidents.map((i) => i.service)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading incident command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Incident Overview & Memory State
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persistent incident learning platform powered by Hindsight Cloud & Groq
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/incidents" className="btn-secondary flex items-center gap-2">
            View All Incidents
          </Link>
          <Link to="/investigate" className="btn-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Investigate Incident
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Incidents</span>
            <Layers className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalIncidents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recorded in system</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active / Open</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{openIncidents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires investigation</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{resolvedIncidents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Verified fixes applied</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Severity</span>
            <Flame className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{criticalIncidents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Highest impact</div>
        </div>

        <div className="card p-4 border-purple-900/60 bg-purple-950/20 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-medium">Retained Lessons</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-200 mt-2">
            {memoryStats?.successfulRetains ?? 0}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">
            {memoryStats?.hindsightConfigured ? 'Hindsight Synced' : 'Ready to Sync'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Incidents & Service Health / Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Incidents */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Recent Incidents
            </h2>
            <Link to="/incidents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {incidents.slice(0, 5).map((inc) => (
              <div key={inc.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{inc.service}</span>
                    <span className="text-slate-600">•</span>
                    <SeverityBadge severity={inc.severity} size="sm" />
                    <StatusBadge status={inc.status} size="sm" />
                    {inc.isSynthetic && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        SYNTHETIC
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="text-sm font-medium text-slate-200 hover:text-blue-400 transition-colors truncate block mt-1"
                  >
                    {inc.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/investigate/${inc.id}`}
                    className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    Investigate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Severity Distribution & Services */}
        <div className="space-y-6">
          {/* Severity Distribution */}
          <div className="card p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              Severity Breakdown
            </h2>
            <div className="space-y-3">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map((sev) => {
                const count = severityCounts[sev];
                const pct = totalIncidents ? Math.round((count / totalIncidents) * 100) : 0;
                const barColors = {
                  Critical: 'bg-red-500',
                  High: 'bg-orange-500',
                  Medium: 'bg-amber-500',
                  Low: 'bg-blue-500',
                };
                return (
                  <div key={sev} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{sev}</span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${barColors[sev]}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monitored Services */}
          <div className="card p-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              Active Services ({uniqueServices.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {uniqueServices.map((svc) => (
                <span
                  key={svc}
                  className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Recent Response & Memory Activity
          </h2>
          <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300">
            Full history
          </Link>
        </div>
        <div className="space-y-2.5">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500">No activity logged yet.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/40">
                <span className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200">{act.message}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(act.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
