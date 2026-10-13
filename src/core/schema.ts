import { z } from 'zod';

export const AcceptanceCriterionSchema = z.object({
  given: z.string().describe('Context or precondition'),
  when: z.string().describe('Specific action performed'),
  then: z.string().describe('Expected verifiable outcome'),
});

export const SubTaskSchema = z.object({
  id: z.string().describe('Unique task ID, e.g. TASK-101'),
  title: z.string().describe('Concise, imperative task title'),
  description: z.string().describe('Technical implementation details and instructions'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']),
  estimateHours: z.number().min(0.5).max(80).describe('Realistic developer hours'),
  suggestedFiles: z.array(z.string()).describe('Files or paths to create or modify'),
  acceptanceCriteria: z.array(AcceptanceCriterionSchema),
  dependencies: z.array(z.string()).default([]).describe('IDs of prerequisite tasks'),
});

export const EpicSchema = z.object({
  id: z.string().describe('Epic identifier, e.g. EPIC-1'),
  title: z.string().describe('Name of the module or feature epic'),
  goal: z.string().describe('Business or technical milestone'),
  layer: z.enum(['frontend', 'backend', 'database', 'ai-ml', 'devops', 'security', 'qa', 'general']),
  tasks: z.array(SubTaskSchema).min(1),
});

export const SprintPlanSchema = z.object({
  projectTitle: z.string(),
  summary: z.string(),
  targetSprintDurationDays: z.number().default(14),
  totalEstimatedHours: z.number(),
  epics: z.array(EpicSchema).min(1),
  technicalRisks: z.array(z.string()),
  architectureRecommendations: z.array(z.string()),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedSprintPlan = z.infer<typeof SprintPlanSchema>;
