import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Brain, 
  Cpu, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Terminal,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { settingsApi } from '../services/api';
import type { SettingsStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    settingsApi.getStatus()
      .then(setStatus)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-slate-400" />
            System Status & Integration Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verify Hindsight Cloud, Groq LLM inference, and Band AI Desktop developer workflows
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hindsight Status */}
        <div className="card p-5 space-y-4 border-purple-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Brain className="h-5 w-5" />
              <span>Hindsight Memory Cloud</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              status?.hindsight.configured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {status?.hindsight.configured ? 'CONNECTED' : 'UNCONFIGURED'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">SDK:</span>
              <span className="text-slate-200">@vectorize-io/hindsight-client</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Bank ID:</span>
              <span className="text-slate-200">{status?.hindsight.bankId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Base URL:</span>
              <span className="text-slate-300 truncate max-w-[150px]">
                {status?.hindsight.baseUrl || 'https://api.hindsight.vectorize.io'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">API Key:</span>
              <span className="text-slate-300">
                {status?.hindsight.apiKeyPresent ? '••••••••••••••••' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Groq LLM Status */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Cpu className="h-5 w-5" />
              <span>Groq LLM Reasoning</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
              status?.groq.configured
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {status?.groq.configured ? 'ACTIVE' : 'UNCONFIGURED'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">SDK:</span>
              <span className="text-slate-200">groq-sdk</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Model:</span>
              <span className="text-slate-200">{status?.groq.model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Structured JSON:</span>
              <span className="text-emerald-400">Zod Validated</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">API Key:</span>
              <span className="text-slate-300">
                {status?.groq.apiKeyPresent ? '••••••••••••••••' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Database className="h-5 w-5" />
              <span>Application Database</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Engine:</span>
              <span className="text-slate-200">SQLite (Prisma ORM)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Incident Records:</span>
              <span className="text-slate-200">{status?.database.incidentCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Memory Logs:</span>
              <span className="text-slate-200">{status?.database.memoryOperationCount}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Backend Port:</span>
              <span className="text-slate-200">:{status?.backend.port}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Checklist */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Environment Setup Checklist
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-mono">HINDSIGHT_API_KEY</span>
            {status?.setupChecklist.hindsightApiKey ? (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Configured
              </span>
            ) : (
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Pending key in backend/.env
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-mono">GROQ_API_KEY</span>
            {status?.setupChecklist.groqApiKey ? (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Configured
              </span>
            ) : (
              <span className="text-amber-400 font-mono flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Pending key in backend/.env
              </span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-mono">DATABASE_URL</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> file:./dev.db
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300 font-mono">HINDSIGHT_BANK_ID</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> recallops-demo
            </span>
          </div>
        </div>
      </div>

      {/* Band AI Desktop Integration Section */}
      <div className="card p-5 space-y-3 border-blue-900/40 bg-blue-950/10">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          Band AI Desktop Developer Workflow
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          RecallOps is built to seamlessly pair with Band AI Desktop for local and enterprise agent orchestration. Developers can invoke RecallOps investigations, audit memory operations, and verify incident runbooks directly inside Band AI Desktop sessions.
        </p>
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          # Band AI Desktop API Hook Endpoint: <br />
          POST http://localhost:5000/api/incidents/:id/investigate
        </div>
      </div>
    </div>
  );
};
