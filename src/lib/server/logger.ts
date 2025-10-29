import { randomUUID } from "node:crypto";

export type OpenRouterLogStatus = "success" | "error";

export interface OpenRouterLogEvent {
  status: OpenRouterLogStatus;
  message: string;
  model?: string;
  details?: string;
  requestId?: string;
}

export function logOpenRouterEvent(event: OpenRouterLogEvent) {
  const timestamp = new Date().toISOString();
  const payload = {
    source: "openrouter",
    status: event.status,
    message: event.message,
    model: event.model ?? "unknown",
    details: event.details ?? null,
    requestId: event.requestId ?? randomUUID(),
    timestamp,
  };

  const logLine = JSON.stringify(payload);
  if (event.status === "error") {
    console.error(logLine);
  } else {
    console.log(logLine);
  }
}
