export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved';

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  symptoms: string;
  logs: string;
  createdAt: string;
  updatedAt: string;
  isSynthetic: boolean;
  investigations?: Investigation[];
  resolution?: Resolution;
  activityLog?: ActivityLog[];
}

export interface RootCause {
  hypothesis: string;
  type: 'verified_historical' | 'current_observation' | 'ai_hypothesis';
  confidence: number;
  evidence: string;
}

export interface Evidence {
  source: 'hindsight_memory' | 'current_incident' | 'pattern_analysis';
  description: string;
  incidentRef?: string;
  timestamp?: string;
}

export interface SimilarIncident {
  incidentId: string;
  title: string;
  service: string;
  similarity: number;
  resolvedWith?: string;
  memorySource: boolean;
}

export interface InvestigationStep {
  priority: number;
  action: string;
  rationale: string;
  safeToAutomate: boolean;
}

export interface RemediationItem {
  action: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  historicallyVerified: boolean;
}

export interface MemoryItem {
  content?: string;
  score?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface Investigation {
  id: string;
  incidentId: string;
  summary: string;
  rootCauses: RootCause[];
  evidence: Evidence[];
  similarIncidents: SimilarIncident[];
  steps: InvestigationStep[];
  remediation: RemediationItem[];
  confidence: number;
  confidenceReason: string;
  safetyWarnings: string[];
  hindsightUsed: boolean;
  memoryCount: number;
  rawMemories: MemoryItem[];
  createdAt: string;
}

export interface Resolution {
  id: string;
  incidentId: string;
  proposedCause: string;
  actualCause: string;
  resolution: string;
  outcome: string;
  hindsightRetained: boolean;
  hindsightMemoryRef: string;
  resolvedAt: string;
}

export interface MemoryOperation {
  id: string;
  operation: 'retain' | 'recall' | 'reflect';
  bankId: string;
  query: string;
  content: string;
  incidentId: string;
  resultCount: number;
  success: boolean;
  errorMsg: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  incidentId: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  incident?: {
    id: string;
    title: string;
    service: string;
    severity: Severity;
    status: IncidentStatus;
  };
}

export interface SettingsStatus {
  hindsight: {
    configured: boolean;
    baseUrl: string | null;
    bankId: string;
    apiKeyPresent: boolean;
  };
  groq: {
    configured: boolean;
    model: string;
    apiKeyPresent: boolean;
  };
  database: {
    connected: boolean;
    incidentCount: number;
    memoryOperationCount: number;
  };
  backend: {
    healthy: boolean;
    version: string;
    environment: string;
    port: number;
  };
  setupChecklist: {
    hindsightBaseUrl: boolean;
    hindsightApiKey: boolean;
    hindsightBankId: boolean;
    groqApiKey: boolean;
    groqModel: boolean;
    database: boolean;
  };
}
