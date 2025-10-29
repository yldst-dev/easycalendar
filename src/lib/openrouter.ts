"use client";

import { AiSchedule, ConversationMessage, ScheduleItem } from "@/lib/types";

interface OpenRouterChoice {
  message?: {
    role?: string;
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
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
  signal?: AbortSignal,
): Promise<AiSchedule> {
  try {
    // Convert image files to base64 for API transmission
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments && message.attachments.length > 0) {
          const processedAttachments = await Promise.all(
            message.attachments.map(async (attachment) => {
              if (attachment.type.startsWith('image/') && attachment.file) {
                // Convert image file to base64
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
      body: JSON.stringify({ messages: processedMessages }),
      signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const detail = typeof data.detail === "string" ? data.detail : undefined;
      throw new Error(detail ?? data.error ?? "OpenRouter 요청에 실패했습니다.");
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content ?? "";
    const modelId = (data as { model?: string }).model;
    const timestamp = new Date().toISOString();

    // 빈 응답 처리
    if (!content.trim()) {
      return {
        summary: "AI 응답이 비어있습니다. 다시 시도해 주세요.",
        items: [],
        meta: {
          status: "error",
          model: modelId,
          timestamp,
          note: "빈 응답",
        },
      };
    }

    try {
      // Try to extract JSON from the content (AI might return extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;

      if (!jsonString.trim()) {
        return {
          summary: "유효한 JSON 응답을 찾을 수 없습니다. 다시 시도해 주세요.",
          items: [],
          meta: {
            status: "error",
            model: modelId,
            timestamp,
            note: "JSON 파싱 실패",
          },
        };
      }

      const parsed = JSON.parse(jsonString) as { items?: ScheduleItem[]; summary?: string };
      return {
        summary: parsed.summary ?? "AI 일정 제안",
        items: (parsed.items ?? []).map((item) => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
        })),
        meta: {
          status: "success",
          model: modelId,
          timestamp,
        },
      };
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content, parseError);
      // Return a fallback response with the raw content
      return {
        summary: "응답을 처리하지 못했습니다. 다시 시도해 주세요.",
        items: [],
        meta: {
          status: "error",
          model: modelId,
          timestamp,
          note: "JSON 파싱 예외",
        },
      };
    }
  } catch (error) {
    // AbortError인 경우 (사용자가 취소) MOCK_PLAN 반환하지 않음
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    console.error("AI plan request failed", error);
    await pause();
    return {
      ...MOCK_PLAN,
      meta: {
        status: "fallback",
        timestamp: new Date().toISOString(),
        note: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function pause(duration = 650) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
