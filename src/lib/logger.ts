import { LogStatus, PlannerLogEntry } from "@/lib/types";

export interface CreateLogEntryInput {
  status: LogStatus;
  message: string;
  details?: string;
  model?: string;
  timestamp?: string;
}

export function createLogEntry({
  status,
  message,
  details,
  model,
  timestamp,
}: CreateLogEntryInput): PlannerLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: timestamp ?? new Date().toISOString(),
    status,
    message,
    details,
    model,
  };
}

export function resolveModelLabel(model?: string): string | undefined {
  if (!model) return undefined;
  return model.replace(/:free$/i, "");
}
