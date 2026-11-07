import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Server, 
  Terminal, 
  Brain, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { incidentApi } from '../services/api';
import type { Incident } from '../types';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { ResolutionModal } from '../components/ui/ResolutionModal';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);

  const fetchIncident = () => {
    if (!id) return;
    setLoading(true);
    incidentApi.get(id)
      .then(setIncident)
      .catch((err) => setError(err?.response?.data?.error || 'Incident not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading incident details...</div>;
  }

  if (error || !incident) {
    return (
      <div className="card p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-semibold text-slate-100">{error || 'Incident not found'}</h2>
        <Link to="/incidents" className="btn-secondary inline-flex items-center gap-2 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/incidents" className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Incident List
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/investigate/${incident.id}`}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Investigation
          </Link>

          {incident.status !== 'Resolved' && (
            <button
              onClick={() => setIsResolveOpen(true)}
              className="btn-success text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm Resolution
            </button>
          )}
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {incident.service}
          </span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-xs text-slate-400">{incident.id}</span>
          <span className="text-slate-600">•</span>
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          {incident.isSynthetic && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              SYNTHETIC DEMO
            </span>
          )}
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-100">
          {incident.title}
        </h1>

        <div className="text-xs text-slate-400 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Created: {new Date(incident.createdAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Server className="h-3.5 w-3.5" /> Service: {incident.service}
          </span>
        </div>
      </div>

      {/* Symptoms & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Observed Symptoms
          </h2>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {incident.symptoms}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Logs & Error Patterns
          </h2>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
            {incident.logs || 'No error logs captured.'}
          </div>
        </div>
      </div>

      {/* Resolution Card if resolved */}
      {incident.resolution && (
        <div className="card p-5 border-emerald-800/60 bg-emerald-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmed Incident Resolution
            </h2>
            {incident.resolution.hindsightRetained && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[11px] font-mono">
                <Brain className="h-3 w-3" />
                Retained in Hindsight
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Verified Root Cause:</span>
              <p className="text-slate-200 mt-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                {incident.resolution.actualCause}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Confirmed Fix:</span>
              <p className="text-slate-200 mt-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                {incident.resolution.resolution}
              </p>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 font-medium">Outcome:</span>
              <p className="text-slate-200 mt-1 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                {incident.resolution.outcome}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prior Investigation Reports */}
      {incident.investigations && incident.investigations.length > 0 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Previous AI Investigations ({incident.investigations.length})
          </h2>

          <div className="space-y-4">
            {incident.investigations.map((inv) => (
              <div key={inv.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    {new Date(inv.createdAt).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Confidence: {Math.round(inv.confidence * 100)}%
                    </span>
                    {inv.hindsightUsed && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                        <Brain className="h-3 w-3" /> {inv.memoryCount} Memories Used
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300">{inv.summary}</p>

                {inv.rootCauses && inv.rootCauses.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Identified Root Cause Hypotheses:
                    </span>
                    {inv.rootCauses.map((rc, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 text-xs flex items-start gap-2">
                        <span className="text-blue-400 font-mono">#{idx + 1}</span>
                        <div className="flex-1">
                          <span className="text-slate-200 font-medium">{rc.hypothesis}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{rc.evidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {isResolveOpen && (
        <ResolutionModal
          incident={incident}
          isOpen={true}
          onClose={() => setIsResolveOpen(false)}
          onSuccess={() => {
            setIsResolveOpen(false);
            fetchIncident();
          }}
        />
      )}
    </div>
  );
};
