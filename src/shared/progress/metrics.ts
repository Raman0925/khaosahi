/**
 * Progress metrics. Shared because navigation params, reminders and the plan's Day-90 summary
 * refer to them. Storage format and the progress-log store are owned by A4 (see docs/agents.md).
 */
export const METRICS = ['weight', 'waist', 'alt', 'ast', 'uricAcid', 'ultrasound'] as const;
export type Metric = (typeof METRICS)[number];
