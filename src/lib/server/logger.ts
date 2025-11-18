import { randomUUID } from "node:crypto";

export type AiLogStatus = "success" | "error";
export type AiLogSource = "openrouter" | "groq";

export interface AiLogEvent {
  source: AiLogSource;
  status: AiLogStatus;
  message: string;
  model?: string;
  details?: string;
  requestId?: string;
}

export function logAiEvent(event: AiLogEvent) {
  const timestamp = new Date().toISOString();
  const payload = {
    source: event.source,
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
