import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { incidentApi } from '../services/api';
import type { Incident, Severity, IncidentStatus } from '../types';
import { SeverityBadge, StatusBadge } from '../components/ui/Badge';
import { ResolutionModal } from '../components/ui/ResolutionModal';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Create Incident Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('payment-api');
  const [newSeverity, setNewSeverity] = useState<Severity>('High');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newLogs, setNewLogs] = useState('');
  const [creating, setCreating] = useState(false);

  // Resolution Modal State
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);

  const fetchIncidents = () => {
    setLoading(true);
    incidentApi.list()
      .then((res) => setIncidents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSymptoms.trim()) return;

    setCreating(true);
    try {
      await incidentApi.create({
        title: newTitle,
        service: newService,
        severity: newSeverity,
        symptoms: newSymptoms,
        logs: newLogs,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewSymptoms('');
      setNewLogs('');
      fetchIncidents();
    } catch (err) {
      console.error('Failed to create incident:', err);
    } finally {
      setCreating(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch = 
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.service.toLowerCase().includes(search.toLowerCase()) ||
      inc.symptoms.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || inc.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'all' || inc.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Incident Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage engineering outages, start AI investigations, and confirm verified lessons
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Report Incident
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, service, symptoms, or error logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="select"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading incidents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300">No matching incidents found</p>
            <p className="text-xs text-slate-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Incident Details</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="table-row">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {inc.service}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors block"
                      >
                        {inc.title}
                      </Link>
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">
                        {inc.symptoms}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/investigate/${inc.id}`}
                        className="btn-secondary text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                        title="Investigate with Hindsight memory recall"
                      >
                        <Sparkles className="h-3 w-3 text-blue-400" />
                        Investigate
                      </Link>

                      {inc.status !== 'Resolved' && (
                        <button
                          onClick={() => setResolvingIncident(inc)}
                          className="btn-success text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-100 mb-1">Report New Incident</h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter incident symptoms and logs to trigger historical memory recall.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Incident Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Payment API Connection Pool Exhaustion under load"
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Affected Service <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="e.g. payment-api"
                    className="input font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Severity <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
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
                  Observed Symptoms <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  rows={3}
                  placeholder="Describe error rates, latency spikes, or failed user journeys..."
                  className="textarea"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Error Logs / Stack Traces (Optional)
                </label>
                <textarea
                  value={newLogs}
                  onChange={(e) => setNewLogs(e.target.value)}
                  rows={3}
                  placeholder="Paste error logs, stack traces, or metrics..."
                  className="textarea text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolvingIncident && (
        <ResolutionModal
          incident={resolvingIncident}
          isOpen={true}
          onClose={() => setResolvingIncident(null)}
          onSuccess={() => {
            setResolvingIncident(null);
            fetchIncidents();
          }}
        />
      )}
    </div>
  );
};
