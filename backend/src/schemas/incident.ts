import { z } from 'zod';

export const severityValues = ['Critical', 'High', 'Medium', 'Low'] as const;
export const statusValues = ['Open', 'Investigating', 'Resolved'] as const;

export const CreateIncidentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  service: z.string().min(1, 'Service is required').max(100),
  severity: z.enum(severityValues),
  symptoms: z.string().min(10, 'Please describe the symptoms in detail').max(5000),
  logs: z.string().max(10000).optional().default(''),
  status: z.enum(statusValues).optional().default('Open'),
  isSynthetic: z.boolean().optional().default(false),
});

export const UpdateIncidentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  service: z.string().min(1).max(100).optional(),
  severity: z.enum(severityValues).optional(),
  status: z.enum(statusValues).optional(),
  symptoms: z.string().min(10).max(5000).optional(),
  logs: z.string().max(10000).optional(),
});

export const InvestigateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  service: z.string().min(1).max(100).optional(),
  severity: z.enum(severityValues).optional(),
  symptoms: z.string().min(10).max(5000).optional(),
  logs: z.string().max(10000).optional(),
});

export const ResolveSchema = z.object({
  proposedCause: z.string().max(500).optional().default(''),
  actualCause: z.string().min(5, 'Actual root cause is required').max(1000),
  resolution: z.string().min(5, 'Resolution is required').max(2000),
  outcome: z.string().min(3).max(500),
});

export const RecallSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export const RetainSchema = z.object({
  content: z.string().min(10).max(10000),
  context: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
export type InvestigateInput = z.infer<typeof InvestigateSchema>;
export type ResolveInput = z.infer<typeof ResolveSchema>;
export type RecallInput = z.infer<typeof RecallSchema>;
export type RetainInput = z.infer<typeof RetainSchema>;

