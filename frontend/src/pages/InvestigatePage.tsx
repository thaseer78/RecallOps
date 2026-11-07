import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
  Search,
  History,
  Info
} from 'lucide-react';
import { incidentApi } from '../services/api';
import type { Incident, Investigation, Severity } from '../types';
import { SeverityBadge } from '../components/ui/Badge';
import { ResolutionModal } from '../components/ui/ResolutionModal';

export const InvestigatePage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(id || '');
  
  // Form input state
  const [title, setTitle] = useState('');
  const [service, setService] = useState('payment-api');
  const [severity, setSeverity] = useState<Severity>('Critical');
  const [symptoms, setSymptoms] = useState('');
  const [logs, setLogs] = useState('');

  // Investigation result state
  const [investigating, setInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [hindsightStatus, setHindsightStatus] = useState<{
    hindsightConfigured: boolean;
    groqConfigured: boolean;
    memoriesFound: number;
    error?: string;
  } | null>(null);

  // Resolution modal state
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);

  // Fetch incidents for picker
  useEffect(() => {
    incidentApi.list().then((res) => {
      setIncidents(res.data);
      if (id) {
        const found = res.data.find((i) => i.id === id);
        if (found) {
          selectIncident(found);
        }
      }
    });
  }, [id]);

  const selectIncident = (inc: Incident) => {
    setSelectedIncidentId(inc.id);
    setTitle(inc.title);
    setService(inc.service);
    setSeverity(inc.severity);
    setSymptoms(inc.symptoms);
    setLogs(inc.logs || '');
    setCurrentIncident(inc);

    // If incident already has an investigation, load the latest one
    if (inc.investigations && inc.investigations.length > 0) {
      setInvestigation(inc.investigations[0]);
    } else {
      setInvestigation(null);
    }
  };

  const handleIncidentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const incId = e.target.value;
    if (!incId) {
      setSelectedIncidentId('');
      setTitle('');
      setSymptoms('');
      setLogs('');
      setInvestigation(null);
      setCurrentIncident(null);
      return;
    }
    const found = incidents.find((i) => i.id === incId);
    if (found) selectIncident(found);
  };

  const handleRunInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !symptoms.trim()) return;

    setInvestigating(true);
    setInvestigation(null);
    setHindsightStatus(null);

    try {
      let targetId = selectedIncidentId;

      // If no incident selected or editing new, create or use existing
      if (!targetId) {
        const created = await incidentApi.create({
          title,
          service,
          severity,
          symptoms,
          logs,
        });
        targetId = created.data.id;
        setSelectedIncidentId(targetId);
        setCurrentIncident(created.data);
      }

      const res = await incidentApi.investigate(targetId, {
        title,
        service,
        severity,
        symptoms,
        logs,
      });

      setHindsightStatus({
        hindsightConfigured: res.hindsightConfigured,
        groqConfigured: res.groqConfigured,
        memoriesFound: res.memoriesFound,
        error: res.error,
      });

      if (res.data) {
        setInvestigation(res.data);
      }
    } catch (err: any) {
      setHindsightStatus({
        hindsightConfigured: false,
        groqConfigured: false,
        memoriesFound: 0,
        error: err?.response?.data?.error || err?.message || 'Investigation request failed',
      });
    } finally {
      setInvestigating(false);
    }
  };

  // Helper template fillers for demonstration
  const loadScenario = (type: 'db_pool' | 'cache_ttl' | 'queue_backlog') => {
    if (type === 'db_pool') {
      setTitle('Payment API database connection timeouts and 503 spikes');
      setService('payment-api');
      setSeverity('Critical');
      setSymptoms('HTTP 503 errors on /payments/charge endpoint. Database connection pool exhausted with 5/5 connections in use. 1,800 requests currently queued with p99 response time above 30 seconds.');
      setLogs('[ERROR] payment-api: Connection pool exhausted (size=5)\n[WARN]  payment-api: Request queue depth=1820\n[ERROR] payment-api: Connection acquire timeout after 30000ms');
    } else if (type === 'cache_ttl') {
      setTitle('Auth token validation latency spike under peak morning login traffic');
      setService('auth-service');
      setSeverity('High');
      setSymptoms('Login endpoint p99 latency spiked from 150ms to 7,500ms. Database queries per second increased 10x. Cache hit rate collapsed to 10%.');
      setLogs('[WARN] auth-service: Cache miss rate 90% (threshold 20%)\n[ERROR] auth-service: Token validation timeout\n[METRIC] auth-service: db_queries_sec=450');
    } else if (type === 'queue_backlog') {
      setTitle('Order processing queue depth escalating with consumer stalls');
      setService('order-processor');
      setSeverity('High');
      setSymptoms('Queue backlog reached 15,000 messages. Worker consumer throughput degraded from 500/min to 15/min. DLQ receiving 250 messages per minute.');
      setLogs('[ERROR] order-processor: Worker timeout downstream\n[WARN]  order-processor: Queue depth 15200\n[ERROR] order-processor: Message moved to DLQ');
    }
    setSelectedIncidentId('');
    setInvestigation(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-blue-400" />
            AI Incident Investigation Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Recalls verified historical incident lessons via Hindsight persistent memory to formulate evidence-backed root cause hypotheses
          </p>
        </div>

        {/* Demo Scenario Quick-Pickers */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-mono">Quick Demo Scenarios:</span>
          <button
            type="button"
            onClick={() => loadScenario('db_pool')}
            className="btn-secondary text-xs px-2 py-1"
          >
            DB Pool Outage
          </button>
          <button
            type="button"
            onClick={() => loadScenario('cache_ttl')}
            className="btn-secondary text-xs px-2 py-1"
          >
            Auth Cache Spike
          </button>
          <button
            type="button"
            onClick={() => loadScenario('queue_backlog')}
            className="btn-secondary text-xs px-2 py-1"
          >
            Queue Backlog
          </button>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Investigation Report (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 card p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Incident Context & Symptoms
            </h2>
            {selectedIncidentId && (
              <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                Editing #{selectedIncidentId.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Incident Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Existing Incident (or create new below)
            </label>
            <select
              value={selectedIncidentId}
              onChange={handleIncidentSelectChange}
              className="select font-mono text-xs"
            >
              <option value="">-- New Incident Investigation --</option>
              {incidents.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.service}] {i.title.slice(0, 45)}... ({i.severity})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleRunInvestigation} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Incident Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Payment API Connection Pool Exhaustion under load"
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Service <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="payment-api"
                  className="input font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Severity <span className="text-red-400">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="select"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Observed Symptoms & Metrics <span className="text-red-400">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                placeholder="Describe HTTP status codes, error rates, latency p99 metrics, queue depth..."
                className="textarea"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Application Logs / Stack Traces (Optional)
              </label>
              <textarea
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                rows={3}
                placeholder="Paste log snippets or error messages..."
                className="textarea text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={investigating}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20"
            >
              {investigating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Recalling Hindsight & Reasoning with Groq...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>Start AI Investigation</span>
                </>
              )}
            </button>
          </form>

          {/* Safe AI Banner */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Safety & Verification Guardrails:
            </div>
            <p>
              • Hypotheses are explicitly separated from verified historical facts.
            </p>
            <p>
              • Remediation actions require human engineer approval before execution.
            </p>
          </div>
        </div>

        {/* Right Report: 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {investigating && (
            <div className="card p-8 text-center space-y-4 animate-pulse">
              <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Investigating with Hindsight Persistent Memory</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  1. Querying Hindsight memory bank for matching past incident patterns...
                  <br />
                  2. Extracting verified historical root causes and confirmed resolutions...
                  <br />
                  3. Groq LLM synthesizing structured hypothesis and evidence report...
                </p>
              </div>
            </div>
          )}

          {/* Investigation Result Report */}
          {investigation ? (
            <div className="space-y-4 animate-fade-in">
              {/* Memory Influence Status Banner */}
              <div className={`p-4 rounded-xl border ${
                investigation.hindsightUsed 
                  ? 'bg-purple-950/30 border-purple-800/60 text-purple-200' 
                  : 'bg-blue-950/30 border-blue-800/60 text-blue-200'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Brain className={`h-5 w-5 shrink-0 mt-0.5 ${investigation.hindsightUsed ? 'text-purple-400' : 'text-blue-400'}`} />
                    <div>
                      <div className="font-semibold text-xs tracking-wide uppercase">
                        {investigation.hindsightUsed 
                          ? `Memory-Informed Investigation (${investigation.memoryCount} Historical Lessons Recalled)`
                          : 'Cold-Start Investigation (No Historical Memory Match)'
                        }
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {investigation.hindsightUsed
                          ? 'Hindsight retrieved verified historical incidents with similar symptoms. AI recommendations are anchored in proven past resolutions.'
                          : 'No matching prior incidents in persistent memory. Analysis is based solely on first-principles observation of current symptoms.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-slate-200">
                      Confidence: {Math.round(investigation.confidence * 100)}%
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {investigation.confidenceReason}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="card p-5 space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Incident Synthesis & Overview
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {investigation.summary}
                </p>
              </div>

              {/* Safety Warnings if any */}
              {investigation.safetyWarnings && investigation.safetyWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    Safety Warnings & Blast Radius Precautions
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90">
                    {investigation.safetyWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Root Cause Hypotheses */}
              <div className="card p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Possible Root Causes (Fact vs. Hypothesis)</span>
                  <span className="text-[10px] text-slate-400 lowercase font-sans">
                    Requires human validation
                  </span>
                </h3>

                <div className="space-y-3">
                  {investigation.rootCauses.map((rc, idx) => {
                    const typeBadge = {
                      verified_historical: { label: 'VERIFIED HISTORICAL', style: 'bg-purple-950/80 text-purple-300 border-purple-800' },
                      current_observation: { label: 'CURRENT OBSERVATION', style: 'bg-blue-950/80 text-blue-300 border-blue-800' },
                      ai_hypothesis: { label: 'AI HYPOTHESIS', style: 'bg-slate-800 text-slate-300 border-slate-700' },
                    }[rc.type] || { label: 'HYPOTHESIS', style: 'bg-slate-800 text-slate-300 border-slate-700' };

                    return (
                      <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${typeBadge.style}`}>
                            {typeBadge.label}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Confidence: {Math.round(rc.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-100">{rc.hypothesis}</p>
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/50">
                          <span className="text-slate-300 font-medium">Evidence:</span> {rc.evidence}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Similar Historical Incidents from Hindsight */}
              {investigation.similarIncidents && investigation.similarIncidents.length > 0 && (
                <div className="card p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <History className="h-4 w-4 text-purple-400" />
                    Similar Historical Incidents Recalled
                  </h3>

                  <div className="space-y-2">
                    {investigation.similarIncidents.map((sim, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-purple-900/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">
                            [{sim.service}] {sim.title}
                          </span>
                          <span className="font-mono text-purple-300 text-[11px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                            Similarity: {Math.round(sim.similarity * 100)}%
                          </span>
                        </div>
                        {sim.resolvedWith && (
                          <p className="text-slate-400 text-[11px]">
                            <span className="text-emerald-400 font-medium">Historical Fix:</span> {sim.resolvedWith}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Investigation Steps */}
              <div className="card p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Recommended Investigation Runbook Steps
                </h3>
                <div className="space-y-2">
                  {investigation.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="h-5 w-5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-800 flex items-center justify-center font-mono font-bold shrink-0">
                        {st.priority}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-slate-200">{st.action}</p>
                        <p className="text-[11px] text-slate-400">{st.rationale}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        Human Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Remediation (Human Approval Required) */}
              <div className="card p-5 space-y-3 border-blue-900/40">
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Suggested Remediation Plan</span>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                    Requires Human Approval
                  </span>
                </h3>

                <div className="space-y-2">
                  {investigation.remediation.map((rem, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            rem.risk === 'high' ? 'bg-red-950 text-red-300 border-red-800' :
                            rem.risk === 'medium' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            'bg-blue-950 text-blue-300 border-blue-800'
                          }`}>
                            Risk: {rem.risk.toUpperCase()}
                          </span>
                          {rem.historicallyVerified && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              Historically Proven
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 font-medium">{rem.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action: Confirm & Retain Lesson */}
              <div className="card p-5 bg-gradient-to-r from-blue-950/40 to-purple-950/40 border-purple-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Close the Learning Loop
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Confirm the actual verified root cause and retain this lesson into Hindsight persistent memory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(true)}
                  className="btn-success text-xs px-4 py-2 flex items-center gap-2 whitespace-nowrap"
                >
                  <Brain className="h-4 w-4" />
                  <span>Confirm Resolution & Retain</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-blue-400">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200">
                  Ready for AI Incident Investigation
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Select an incident from the dropdown or pick a demo scenario, then click "Start AI Investigation" to retrieve Hindsight memories.
                </p>
              </div>
            </div>
          )}

          {/* Status / Error Toast if any */}
          {hindsightStatus && hindsightStatus.error && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                API Connection Notice
              </div>
              <p className="text-[11px] text-amber-200/80">
                {hindsightStatus.error}
              </p>
              <div className="text-[11px] text-slate-400 font-mono">
                To connect real AI reasoning, configure <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">GROQ_API_KEY</code> and <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">HINDSIGHT_API_KEY</code> in backend/.env.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {isResolveOpen && currentIncident && (
        <ResolutionModal
          incident={currentIncident}
          isOpen={true}
          onClose={() => setIsResolveOpen(false)}
          onSuccess={() => {
            setIsResolveOpen(false);
            if (currentIncident) selectIncident(currentIncident);
          }}
        />
      )}
    </div>
  );
};
