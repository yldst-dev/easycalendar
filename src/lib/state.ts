"use client";
import {
  ConversationAttachment,
  ConversationMessage,
  PlannerAction,
  PlannerState,
  ScheduleItem,
} from "@/lib/types";
import {
  bumpDateOnlyToNextYearIfPast,
  isFutureOrPresent,
  isSameOrAfterDay,
} from "@/lib/datetime";

const SCHEDULE_STORAGE_KEY = "easycalendar_schedule";

export const loadScheduleFromSession = (): ScheduleItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(SCHEDULE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("[easycalendar] Failed to load schedule from session storage", error);
    return [];
  }
};

export const saveScheduleToSession = (schedule: ScheduleItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.warn("[easycalendar] Failed to save schedule to session storage", error);
  }
};

export const createInitialState = (): PlannerState => ({
  messages: [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "안녕하세요! 일정에 대해 설명해주시면 계획을 만들어드릴게요.",
      createdAt: new Date().toISOString(),
    },
  ],
  schedule: [],
  isLoading: false,
});

export const plannerReducer = (
  state: PlannerState,
  action: PlannerAction,
): PlannerState => {
  switch (action.type) {
    case "ADD_MESSAGE": {
      const message = action.payload as ConversationMessage;
      return {
        ...state,
        messages: [...state.messages, message],
      };
    }
    case "UPDATE_MESSAGE_STATUS": {
      const { id, status, content, error } = action.payload as {
        id: string;
        status?: ConversationMessage["status"];
        content?: string;
        error?: string;
      };
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                status: status ?? msg.status,
                content: content ?? msg.content,
              }
            : msg,
        ),
        lastError: error,
      };
    }
    case "SET_SCHEDULE": {
      const schedule = action.payload as ScheduleItem[];
      return {
        ...state,
        schedule: sanitizeSchedule(schedule),
      };
    }
    case "ADD_SCHEDULE_ITEMS": {
      return {
        ...state,
        schedule: [...state.schedule, ...sanitizeSchedule(action.payload as ScheduleItem[])],
      };
    }
    case "UPDATE_SCHEDULE_ITEM": {
      let updatedItem = action.payload as ScheduleItem;
      if (updatedItem.reminderMinutes !== undefined) {
        updatedItem = {
          ...updatedItem,
          reminderMinutes: normalizeReminderMinutes(updatedItem.reminderMinutes),
        };
      }
      if (updatedItem.start && !isFutureOrPresent(updatedItem.start)) {
        return state;
      }
      return {
        ...state,
        schedule: state.schedule.map((item) =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item,
        ),
      };
    }
    case "ADD_SCHEDULE_ITEM": {
      const [draft] = sanitizeSchedule([action.payload as ScheduleItem]);
      if (!draft) return state;
      return {
        ...state,
        schedule: [...state.schedule, draft],
      };
    }
    case "REMOVE_SCHEDULE_ITEM": {
      const id = action.payload as string;
      return {
        ...state,
        schedule: state.schedule.filter((item) => item.id !== id),
        selectedItemId:
          state.selectedItemId === id ? undefined : state.selectedItemId,
      };
    }
    case "SELECT_ITEM": {
      return {
        ...state,
        selectedItemId: action.payload as string,
      };
    }
    case "SET_LOADING": {
      return {
        ...state,
        isLoading: Boolean(action.payload),
        lastError: Boolean(action.payload) ? undefined : state.lastError,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        lastError: action.payload as string | undefined,
      };
    }
    default:
      return state;
  }
};

export const createDraftMessage = (
  content: string,
  attachments: ConversationAttachment[] = [],
): ConversationMessage => ({
  id: crypto.randomUUID(),
  role: "user",
  content,
  createdAt: new Date().toISOString(),
  attachments,
  status: "sent",
});

function sanitizeSchedule(items: ScheduleItem[]): ScheduleItem[] {
  const toleranceMs = 60 * 1000;
  const reference = new Date(Date.now() - toleranceMs);
  return items
    .map((item) => {
      if (!item?.start) return item;
      const bumped = bumpDateOnlyToNextYearIfPast(item.start, reference);
      const nextStart = bumped || item.start;
      return {
        ...item,
        start: nextStart,
        reminderMinutes: normalizeReminderMinutes(item.reminderMinutes),
      } satisfies ScheduleItem;
    })
    .filter((item) => {
      if (!item || !item.start) return false;
      const ok =
        isFutureOrPresent(item.start, reference) ||
        isSameOrAfterDay(item.start, reference);
      if (!ok && process.env.NODE_ENV === "development") {
        console.warn("[easycalendar][filter] dropped past item", {
          start: item.start,
          reference: reference.toISOString(),
        });
      }
      return ok;
    });
}

function normalizeReminderMinutes(
  value: ScheduleItem["reminderMinutes"],
): number[] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  const filtered = list
    .map((entry) => (Number.isFinite(entry) ? Math.round(entry) : NaN))
    .filter((entry) => Number.isFinite(entry) && entry > 0) as number[];
  return Array.from(new Set(filtered));
}
