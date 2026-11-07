import React, { useEffect, useState } from 'react';
import { 
  Brain, 
  Search, 
  Database, 
  History, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { memoryApi } from '../services/api';
import type { MemoryOperation } from '../types';

export const MemoryExplorerPage: React.FC = () => {
  const [stats, setStats] = useState<{
    totalRetains: number;
    totalRecalls: number;
    totalReflects: number;
    successfulRetains: number;
    hindsightConfigured: boolean;
    bankId: string;
  } | null>(null);

  const [recentOperations, setRecentOperations] = useState<MemoryOperation[]>([]);
  const [retainedLessons, setRetainedLessons] = useState<Array<{
    incidentId: string;
    incidentTitle: string;
    service: string;
    severity: string;
    actualCause: string;
    resolution: string;
    outcome: string;
    memoryRef: string;
    resolvedAt: string;
  }>>([]);

  const [loading, setLoading] = useState(true);

  // Interactive recall tester state
  const [testQuery, setTestQuery] = useState('database connection pool exhaustion timeouts');
  const [recalling, setRecalling] = useState(false);
  const [recallResults, setRecallResults] = useState<{
    memories: Array<{ content?: string; score?: number; timestamp?: string }>;
    count: number;
    hindsightConfigured: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    memoryApi.getMemories()
      .then((data) => {
        setStats(data.stats);
        setRecentOperations(data.recentOperations);
        setRetainedLessons(data.retainedLessons);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setRecalling(true);
    try {
      const data = await memoryApi.recall(testQuery);
      setRecallResults(data);
    } catch (err: any) {
      setRecallResults({
        memories: [],
        count: 0,
        hindsightConfigured: false,
        error: err?.response?.data?.error || err?.message || 'Recall test failed',
      });
    } finally {
      setRecalling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Brain className="h-6 w-6 text-purple-400" />
            Hindsight Memory Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative persistent memory layer inspecting retain, recall, and reflect operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400">Memory Bank:</span>
            <span className="text-slate-200 font-semibold">{stats?.bankId || 'recallops-demo'}</span>
          </div>
        </div>
      </div>

      {/* Memory Operations Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-purple-900/40 bg-purple-950/20">
          <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
            <span>Retained Lessons</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.successfulRetains ?? retainedLessons.length}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">Verified incident solutions</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Recall Invocations</span>
            <Search className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.totalRecalls ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">4-way parallel memory searches</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Reflect Syntheses</span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.totalReflects ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Deep pattern evaluations</div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Hindsight Status</span>
            <span className={`h-2 w-2 rounded-full ${stats?.hindsightConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          </div>
          <div className={`text-base font-bold mt-2 ${stats?.hindsightConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stats?.hindsightConfigured ? 'CONNECTED' : 'STANDBY'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats?.hindsightConfigured ? '@vectorize-io/hindsight-client' : 'Configure API Key in Settings'}
          </div>
        </div>
      </div>

      {/* Interactive Recall Tester */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-400" />
            Interactive Memory Recall Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test Hindsight 4-way parallel recall (semantic, keyword BM25, knowledge graph, temporal) against the persistent bank.
          </p>
        </div>

        <form onSubmit={handleTestRecall} className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Search symptoms, e.g. token validation latency or database connection pool..."
            className="input font-mono text-xs flex-1"
          />
          <button
            type="submit"
            disabled={recalling}
            className="btn-primary text-xs flex items-center gap-2 whitespace-nowrap"
          >
            {recalling ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Recalling...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Test Recall</span>
              </>
            )}
          </button>
        </form>

        {recallResults && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300">
                Recall Result ({recallResults.count} matches)
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                recallResults.hindsightConfigured 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {recallResults.hindsightConfigured ? 'Hindsight Live API' : 'Unconfigured Mode'}
              </span>
            </div>

            {recallResults.error && (
              <p className="text-xs text-amber-300 font-mono">Notice: {recallResults.error}</p>
            )}

            {recallResults.memories.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No matching memories returned for this query.
              </p>
            ) : (
              <div className="space-y-2">
                {recallResults.memories.map((m, i) => (
                  <div key={i} className="p-3 rounded bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                      <span>Memory #{i + 1}</span>
                      {m.score !== undefined && <span>Relevance: {m.score.toFixed(3)}</span>}
                    </div>
                    <p className="text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retained Incident Lessons in Memory */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400" />
            Verified Incident Lessons in Knowledge Base ({retainedLessons.length})
          </h2>
          <span className="text-xs text-slate-400">
            Source incident links & verified fixes
          </span>
        </div>

        {retainedLessons.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No lessons retained yet. Resolve an incident to retain your first lesson in Hindsight!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retainedLessons.map((lesson) => (
              <div
                key={lesson.incidentId}
                className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 hover:border-purple-800/80 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-purple-300 font-medium bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                    {lesson.service}
                  </span>
                  <Link
                    to={`/incidents/${lesson.incidentId}`}
                    className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                  >
                    Source Incident <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <h3 className="text-sm font-semibold text-slate-200">
                  {lesson.incidentTitle}
                </h3>

                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-medium">Root Cause:</span>
                  <p className="text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 text-[11px]">
                    {lesson.actualCause}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-emerald-400 font-medium">Confirmed Fix:</span>
                  <p className="text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 text-[11px]">
                    {lesson.resolution}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Ref: {lesson.memoryRef || 'retained-demo'}</span>
                  <span>{new Date(lesson.resolvedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Memory Operations Audit Log */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          Hindsight Operations Audit Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Context / Query</th>
                <th className="py-2.5 px-3">Result Count</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentOperations.slice(0, 10).map((op) => (
                <tr key={op.id} className="table-row">
                  <td className="py-2.5 px-3 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      op.operation === 'retain' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      op.operation === 'recall' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {op.operation.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs font-mono text-[11px]">
                    {op.query || op.content || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{op.resultCount}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      op.success ? 'text-emerald-400 bg-emerald-950/60' : 'text-amber-400 bg-amber-950/60'
                    }`}>
                      {op.success ? 'SUCCESS' : 'UNAVAILABLE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(op.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
