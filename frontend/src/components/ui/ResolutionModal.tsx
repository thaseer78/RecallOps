import React, { useState } from 'react';
import { CheckCircle2, Brain, AlertCircle, X, ShieldAlert, Sparkles } from 'lucide-react';
import { incidentApi } from '../../services/api';
import type { Incident } from '../../types';

interface ResolutionModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const latestInvestigation = incident.investigations?.[0];
  const initialProposedCause = latestInvestigation?.rootCauses?.[0]?.hypothesis || '';

  const [proposedCause, setProposedCause] = useState(initialProposedCause);
  const [actualCause, setActualCause] = useState(initialProposedCause);
  const [resolution, setResolution] = useState('');
  const [outcome, setOutcome] = useState('Service fully recovered. Error rate back to normal baseline.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    hindsightRetained: boolean;
    hindsightConfigured: boolean;
    memoryRef: string;
    retainError?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCause.trim() || !resolution.trim() || !outcome.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await incidentApi.resolve(incident.id, {
        proposedCause,
        actualCause,
        resolution,
        outcome,
      });

      setResult({
        hindsightRetained: res.hindsightRetained,
        hindsightConfigured: res.hindsightConfigured,
        memoryRef: res.memoryRef,
        retainError: res.retainError,
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to resolve incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Confirm Incident Resolution & Retain Lesson</h2>
            <p className="text-xs text-slate-400">
              {incident.service} • {incident.id}
            </p>
          </div>
        </div>

        {result ? (
          <div className="space-y-4 py-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Incident Marked as Resolved</h3>
            
            {result.hindsightRetained ? (
              <div className="p-4 bg-purple-950/40 border border-purple-800/60 rounded-lg text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-medium">
                  <Brain className="h-4 w-4" />
                  <span>Retained in Hindsight Persistent Memory</span>
                </div>
                <div className="font-mono text-[11px] text-purple-200/90 bg-purple-900/40 p-2 rounded border border-purple-800/40">
                  Memory Ref: {result.memoryRef}
                </div>
                <p className="text-slate-400 text-[11px]">
                  This confirmed resolution is now indexed in Hindsight. Future incidents matching these symptoms will recall this verified lesson.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-left text-xs text-amber-300">
                <div className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Hindsight not configured
                </div>
                <p className="text-[11px] text-amber-200/70 mt-1">
                  Incident saved locally to database. To retain memories in Hindsight Cloud, configure HINDSIGHT_API_KEY in backend/.env.
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg text-xs text-blue-300 flex items-start gap-2.5">
              <Brain className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <span className="font-semibold text-blue-200">Continuous Memory Loop:</span> Confirming this resolution will synthesize and retain the verified fix into Hindsight persistent memory so future investigations can immediately recall it.
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {initialProposedCause && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  AI Proposed Hypothesis (for reference)
                </label>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                  {initialProposedCause}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Verified Root Cause <span className="text-red-400">*</span>
              </label>
              <textarea
                value={actualCause}
                onChange={(e) => setActualCause(e.target.value)}
                rows={2}
                placeholder="What actually caused this incident? (e.g. database connection pool size insufficient for traffic spike)"
                className="textarea"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmed Resolution / Fix Applied <span className="text-red-400">*</span>
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Step-by-step resolution that restored normal operations..."
                className="textarea"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Outcome / Verification Results <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. Error rates back to 0%, latency normalized, pool usage stable"
                className="input"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Retaining in Hindsight...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Confirm & Retain Lesson</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

