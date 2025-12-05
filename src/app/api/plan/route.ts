import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { withAttachmentContext } from "@/lib/message-utils";
import { logAiEvent } from "@/lib/server/logger";
import type { AiProvider, AiProviderPreference, ConversationMessage } from "@/lib/types";

type PlanRequestBody = {
  messages?: ConversationMessage[];
  provider?: AiProviderPreference | string;
};

function normalizePreference(
  value?: string | null,
  fallback: AiProviderPreference = "openrouter",
): AiProviderPreference {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (normalized === "auto" || normalized === "groq" || normalized === "openrouter") {
    return normalized as AiProviderPreference;
  }
  return fallback;
}

export async function POST(request: Request) {

  let body: PlanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (!body.messages?.length) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  // Use vision-capable model for image processing, fallback to text-only model
  const hasImages = body.messages.some(
    (msg) => msg.attachments && msg.attachments.some((att) => att.type?.startsWith("image/")),
  );

  const envPreference = normalizePreference(process.env.PLANNER_AI_PROVIDER, "openrouter");
  const providerPreference = normalizePreference(
    typeof body.provider === "string" ? body.provider : undefined,
    envPreference,
  );
  const isAutoPreference = providerPreference === "auto";
  const openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim();
  const groqApiKey = process.env.GROQ_API_KEY?.trim();

  let provider: AiProvider = "openrouter";
  let apiKey: string | undefined;

  if (providerPreference === "groq") {
    provider = "groq";
    apiKey = groqApiKey;
  } else if (isAutoPreference) {
    if (groqApiKey) {
      provider = "groq";
      apiKey = groqApiKey;
    } else {
      provider = "openrouter";
      apiKey = openrouterApiKey;
    }
  } else {
    provider = "openrouter";
    apiKey = openrouterApiKey;
  }

  if (!apiKey) {
    const missingSource = isAutoPreference
      ? "Groq 또는 OpenRouter"
      : provider === "groq"
        ? "Groq"
        : "OpenRouter";
    return NextResponse.json(
      { error: `${missingSource} API key is not configured.` },
      { status: 503 },
    );
  }
  const resolvedApiKey = apiKey;

  const groqTextOverride = process.env.GROQ_MODEL?.trim();
  const groqVisionOverride = process.env.GROQ_VISION_MODEL?.trim();
  const openrouterTextOverride = process.env.OPENROUTER_MODEL?.trim();
  const openrouterVisionOverride = process.env.OPENROUTER_VISION_MODEL?.trim();

  const providerLabel = provider === "groq" ? "Groq" : "OpenRouter";
  const origin = request.headers.get("origin") ?? "https://easycalendar.local";

  const groqTextModel = groqTextOverride ?? "meta-llama/llama-3.3-70b-versatile";
  const groqVisionModel = groqVisionOverride ?? groqTextOverride ?? "meta-llama/llama-4-maverick-17b-128e-instruct";
  const openrouterTextModel = openrouterTextOverride ?? "x-ai/grok-4-fast:free";
  const openrouterVisionModel = openrouterVisionOverride ?? openrouterTextOverride ?? "openai/gpt-4o-mini";

  const endpoint = provider === "groq"
    ? "https://api.groq.com/openai/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
  const headers: Record<string, string> = provider === "groq"
    ? {
        Authorization: `Bearer ${resolvedApiKey}`,
        "Content-Type": "application/json",
      }
    : {
        Authorization: `Bearer ${resolvedApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "EasyCalendar",
      };
  const model = hasImages
    ? (provider === "groq" ? groqVisionModel : openrouterVisionModel)
    : (provider === "groq" ? groqTextModel : openrouterTextModel);

  // Add current date and time context to system prompt
  const now = new Date();
  const currentDateKST = `${new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)}/${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now)} (KST)`;
  const currentDateISO = now.toISOString();

  const enhancedSystemPrompt = `${SYSTEM_PROMPT}

### Future Scheduling Guardrail
- EasyCalendar는 현재 시각(${currentDateKST}) 이전 일정은 허용하지 않습니다. 과거 일정은 안내만 하고 items는 비워 두세요.

### Current Context
- 현재 날짜 및 시간: ${currentDateKST}
- ISO 8601 형식: ${currentDateISO}
- 월/일만 주어지면 올해(${currentDateKST.slice(0, 4)}년)로 우선 해석하고, 이미 지난 날짜라면 다음 해로 이월하세요.
- 사용자가 "오늘", "내일", "이번 주" 등의 상대적 날짜를 언급할 때 위의 현재 시간을 기준으로 계산하세요.`;

  // Process messages to handle image attachments
  const processedMessages = body.messages.map((message) => {
    // Handle messages with image attachments
    if (message.attachments && message.attachments.length > 0) {
      const imageAttachments = message.attachments.filter(att => att.type?.startsWith('image/'));
      if (imageAttachments.length > 0 && ('base64' in imageAttachments[0]) && imageAttachments[0].base64) {
        return {
          role: message.role,
          content: [
            {
              type: "text",
              text: message.content || "이미지를 분석해서 일정을 생성해 주세요."
            },
            {
              type: "image_url",
              image_url: {
                url: (imageAttachments[0] as typeof imageAttachments[0] & { base64: string }).base64
              }
            }
          ]
        };
      }
    }

    // Handle text-only messages
    return {
      role: message.role,
      content: withAttachmentContext(message.content, message.attachments),
    };
  });

  const payload = {
    model,
    messages: [
      {
        role: "system",
        content: enhancedSystemPrompt,
      },
      ...processedMessages,
    ],
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      next: { revalidate: 0 },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logAiEvent({
      source: provider,
      status: "error",
      message: `${providerLabel} 요청을 전송하지 못했습니다.`,
      model,
      details: message,
    });
    return NextResponse.json({ error: `Failed to reach ${providerLabel}.` }, { status: 502 });
  }

  const requestId =
    response.headers.get("x-request-id") ??
    response.headers.get("x-groq-request-id") ??
    undefined;

  if (!response.ok) {
    const errorText = await response.text();
    logAiEvent({
      source: provider,
      status: "error",
      message: `${providerLabel} 응답 오류 (${response.status})`,
      model,
      details: errorText,
      requestId,
    });
    return NextResponse.json(
      { error: `${providerLabel} error: ${response.status}`, detail: errorText },
      { status: response.status },
    );
  }

  logAiEvent({
    source: provider,
    status: "success",
    message: `${providerLabel} 요청이 성공했습니다.`,
    model,
    requestId,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
