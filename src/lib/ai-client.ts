"use client";

import { AiProviderPreference, AiSchedule, ConversationMessage, ScheduleItem } from "@/lib/types";

interface AiChoice {
  message?: {
    role?: string;
    content?: string;
  };
}

interface AiResponse {
  choices?: AiChoice[];
}

const MOCK_PLAN: AiSchedule = {
  summary: "AI가 제안한 기본 일정",
  items: [
    {
      id: crypto.randomUUID(),
      title: "팀 회의",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      location: "Zoom",
      description: "프로젝트 진행 상황 점검",
    },
  ],
};

export async function requestScheduleFromAi(
  messages: ConversationMessage[],
  provider: AiProviderPreference,
  signal?: AbortSignal,
): Promise<AiSchedule> {
  try {
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments && message.attachments.length > 0) {
          const processedAttachments = await Promise.all(
            message.attachments.map(async (attachment) => {
              if (attachment.type.startsWith('image/') && attachment.file) {
                return new Promise<typeof attachment & { base64?: string }>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    resolve({
                      ...attachment,
                      base64: reader.result as string
                    });
                  };
                  reader.onerror = () => resolve(attachment);
                  reader.readAsDataURL(attachment.file!);
                });
              }
              return attachment;
            })
          );
          return { ...message, attachments: processedAttachments };
        }
        return message;
      })
    );

    const response = await fetch("/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: processedMessages, provider }),
      signal,
    });

    if (!response.ok) {
      let errorPayload: unknown = {};
      try {
        errorPayload = await response.json();
      } catch (parseError) {
        console.warn("[easycalendar] Failed to parse AI error response", parseError);
      }
      const detail = readStringField(errorPayload, "detail");
      const errorMessage = readStringField(errorPayload, "error");
      throw new Error(detail ?? errorMessage ?? "AI 요청에 실패했습니다.");
    }

    const data = (await response.json()) as AiResponse;
    const content = data.choices?.[0]?.message?.content ?? "";

    if (!content.trim()) {
      return {
        summary: "AI 응답이 비어있습니다. 다시 시도해 주세요.",
        items: [],
      };
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      if (!jsonString.trim()) {
        return {
          summary: "유효한 JSON 응답을 찾을 수 없습니다. 다시 시도해 주세요.",
          items: [],
        };
      }

      const parsed = JSON.parse(jsonString) as { items?: ScheduleItem[]; summary?: string };
      return {
        summary: parsed.summary ?? "AI 일정 제안",
        items: (parsed.items ?? []).map((item) => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
        })),
      };
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content, parseError);
      return {
        summary: "응답을 처리하지 못했습니다. 다시 시도해 주세요.",
        items: [],
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("AI plan request failed", error);
    await pause();
    return MOCK_PLAN;
  }
}

async function pause(duration = 650) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function readStringField(payload: unknown, key: "detail" | "error") {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}
