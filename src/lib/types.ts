export type AuthorRole = "user" | "assistant" | "system";

export interface ConversationAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  file?: File;
}

export interface ConversationMessage {
  id: string;
  role: AuthorRole;
  content: string;
  createdAt: string;
  attachments?: ConversationAttachment[];
  status?: "pending" | "sent" | "error";
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO string
  end?: string; // ISO string
  allDay?: boolean;
}

export interface PlannerState {
  messages: ConversationMessage[];
  schedule: ScheduleItem[];
  selectedItemId?: string;
  isLoading: boolean;
  lastError?: string;
}

export interface PlannerAction {
  type:
    | "ADD_MESSAGE"
    | "UPDATE_MESSAGE_STATUS"
    | "SET_SCHEDULE"
    | "ADD_SCHEDULE_ITEMS"
    | "UPDATE_SCHEDULE_ITEM"
    | "ADD_SCHEDULE_ITEM"
    | "REMOVE_SCHEDULE_ITEM"
    | "SELECT_ITEM"
    | "SET_LOADING"
    | "SET_ERROR";
  payload?: unknown;
}

export interface AiSchedulePayload {
  request: {
    text: string;
    attachments?: ConversationAttachment[];
  };
  response: {
    raw: string;
    parsed?: AiSchedule;
  };
}

export interface AiSchedule {
  summary: string;
  items: ScheduleItem[];
}

export interface ExportFormat {
  id: "json" | "ics";
  label: string;
  description: string;
}
