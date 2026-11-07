import React, { useEffect, useState } from 'react';
import { 
  History, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { incidentApi, memoryApi, activityApi } from '../services/api';
import type { Incident, ActivityLog } from '../types';
import { SeverityBadge } from '../components/ui/Badge';

export const LearningHistoryPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [retainedLessons, setRetainedLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      incidentApi.list({ status: 'Resolved' }),
      activityApi.list(),
      memoryApi.getMemories(),
    ])
      .then(([incSettled, actSettled, memSettled]) => {
        if (incSettled.status === 'fulfilled' && incSettled.value) {
          setIncidents(Array.isArray(incSettled.value.data) ? incSettled.value.data : []);
        } else {
          setIncidents([]);
        }

        if (actSettled.status === 'fulfilled' && Array.isArray(actSettled.value)) {
          setActivities(actSettled.value);
        } else {
          setActivities([]);
        }

        if (memSettled.status === 'fulfilled' && memSettled.value) {
          setRetainedLessons(Array.isArray(memSettled.value.retainedLessons) ? memSettled.value.retainedLessons : []);
        } else {
          setRetainedLessons([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setIncidents([]);
        setActivities([]);
        setRetainedLessons([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const safeRetainedLessons = Array.isArray(retainedLessons) ? retainedLessons : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeIncidents = Array.isArray(incidents) ? incidents : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
          <History className="h-6 w-6 text-blue-400" />
          Continuous Learning History
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Visualizing how every verified incident resolution strengthens Hindsight memory for future response
        </p>
      </div>

      {/* Concept Flow Banner */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-blue-950/20 to-purple-950/20 border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-200">Incident Occurs</div>
              <div className="text-slate-400">Symptoms & logs ingested</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-200">Hindsight Recalls</div>
              <div className="text-slate-400">Matches verified past lessons</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-semibold text-slate-200">Engineer Confirms</div>
              <div className="text-slate-400">Human verifies true fix</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <div className="font-semibold text-slate-200">Lesson Retained</div>
              <div className="text-slate-400">Memory expands forever</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Retained Lessons on Left, Full Activity Stream on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Retained Lessons (7 cols) */}
        <div className="lg:col-span-7 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Retained Lessons in Persistent Memory ({safeRetainedLessons.length})
            </h2>
            <Link to="/investigate" className="text-xs text-blue-400 hover:text-blue-300">
              Run test investigation
            </Link>
          </div>

          <div className="space-y-4">
            {safeRetainedLessons.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No lessons retained yet.
              </p>
            ) : (
              safeRetainedLessons.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60 font-semibold">
                      {item.service}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(item.resolvedAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100">
                    {item.incidentTitle}
                  </h3>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-400">
                      <span className="text-slate-300 font-medium">Root Cause:</span> {item.actualCause}
                    </div>
                    <div className="text-slate-400">
                      <span className="text-emerald-400 font-medium">Resolution:</span> {item.resolution}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-500">Ref: {item.memoryRef}</span>
                    <Link
                      to={`/incidents/${item.incidentId}`}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                    >
                      Inspect Source <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Chronological Activity Log (5 cols) */}
        <div className="lg:col-span-5 card p-5 space-y-4 h-fit">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Chronological Audit Trail
            </h2>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {safeActivities.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No activity records found.</p>
            ) : (
              safeActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="uppercase text-blue-400 font-semibold">{act.type.replace('_', ' ')}</span>
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 text-xs">{act.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
