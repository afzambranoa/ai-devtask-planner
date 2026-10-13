export const SYSTEM_PROMPT = `You are a Principal Software Architect and Agile Engineering Leader.
Your mission is to analyze software requirements, PRDs, or user requests, and break them down into an exhaustive, production-grade Sprint Plan and Task Breakdown.

Follow these strict engineering guidelines:
1. ARCHITECTURAL DECOMPOSITION: Group tasks logically into Epics mapped to architectural layers (frontend, backend, database, ai-ml, devops, security, qa, general).
2. REALISTIC ESTIMATION: Estimate effort realistically in developer hours (e.g. 1h, 2h, 4h, 8h, 16h). Avoid superficial 0.1h or unachievable 200h monolithic tasks.
3. CONCRETE GHERKIN CRITERIA: Every subtask MUST have 2-4 acceptance criteria using standard Given-When-Then format.
4. TARGET FILES: Identify exact or plausible file paths (e.g., 'src/api/auth.ts', 'src/models/user.ts').
5. DEPENDENCIES: Accurately link prerequisite tasks (e.g., DB migrations must precede API endpoints).
6. FORMAT: Respond ONLY with a valid JSON object matching the requested schema. No markdown code fence wrappers, no explanations before or after.`;

export function buildUserPrompt(requirementText: string, context?: string): string {
  const contextBlock = context ? `\nADDITIONAL CONTEXT / CONSTRAINTS:\n${context}\n---\n` : '';
  return `Analyze and break down the following software requirement into an actionable, enterprise-ready Sprint Plan:

---
REQUIREMENT / SPECIFICATION:
${requirementText}
---${contextBlock}
Output ONLY valid JSON matching this schema:
{
  "projectTitle": "String",
  "summary": "String",
  "targetSprintDurationDays": 14,
  "totalEstimatedHours": 0,
  "epics": [
    {
      "id": "EPIC-1",
      "title": "String",
      "goal": "String",
      "layer": "frontend | backend | database | ai-ml | devops | security | qa | general",
      "tasks": [
        {
          "id": "TASK-101",
          "title": "String",
          "description": "String",
          "priority": "low | medium | high | critical",
          "complexity": "XS | S | M | L | XL",
          "estimateHours": 4,
          "suggestedFiles": ["src/path/to/file.ts"],
          "acceptanceCriteria": [
            { "given": "...", "when": "...", "then": "..." }
          ],
          "dependencies": []
        }
      ]
    }
  ],
  "technicalRisks": ["Risk 1", "Risk 2"],
  "architectureRecommendations": ["Recommendation 1", "Recommendation 2"],
  "generatedAt": "${new Date().toISOString()}"
}`;
}
