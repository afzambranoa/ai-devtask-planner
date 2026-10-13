export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskComplexity = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type ArchitecturalLayer = 'frontend' | 'backend' | 'database' | 'ai-ml' | 'devops' | 'security' | 'qa' | 'general';

export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimateHours: number;
  suggestedFiles: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  dependencies: string[];
}

export interface Epic {
  id: string;
  title: string;
  goal: string;
  layer: ArchitecturalLayer;
  tasks: SubTask[];
}

export interface SprintPlan {
  projectTitle: string;
  summary: string;
  targetSprintDurationDays: number;
  totalEstimatedHours: number;
  epics: Epic[];
  technicalRisks: string[];
  architectureRecommendations: string[];
  generatedAt: string;
}

export interface PlannerProviderOptions {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'lifetime' | 'team';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'inactive';
export type PaymentProvider = 'lemonsqueezy' | 'stripe' | 'sandbox';

export interface LicenseKeyData {
  key: string;
  plan: SubscriptionPlan;
  customerEmail: string;
  createdAt: string;
  expiresAt?: string;
  status: LicenseStatus;
  maxActivations: number;
  activations: string[];
  orderId?: string;
  provider: PaymentProvider;
  signature?: string;
}

export interface CheckoutRequest {
  plan: SubscriptionPlan;
  email: string;
  provider?: PaymentProvider;
  editor?: string;
  redirectUrl?: string;
}

export interface CheckoutResponse {
  success: boolean;
  checkoutUrl: string;
  orderId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  licenseKey?: string;
  message?: string;
}

export interface LicenseVerificationResponse {
  valid: boolean;
  plan: SubscriptionPlan;
  status: LicenseStatus;
  customerEmail?: string;
  expiresAt?: string;
  maxActivations?: number;
  currentActivations?: number;
  message?: string;
}

