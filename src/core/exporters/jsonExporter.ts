import { SprintPlan } from '../../types/index.js';

export function exportToJson(plan: SprintPlan, pretty: boolean = true): string {
  return JSON.stringify(plan, null, pretty ? 2 : 0);
}
