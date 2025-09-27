import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { withAttachmentContext } from "@/lib/message-utils";
import type { ConversationMessage } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is not configured." },
      { status: 503 },
    );
  }

  let body: { messages?: ConversationMessage[] };
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
  const hasImages = body.messages.some(msg =>
    msg.attachments && msg.attachments.some(att => att.type?.startsWith('image/'))
  );
  const model = process.env.OPENROUTER_MODEL?.trim() ||
    (hasImages ? "openai/gpt-4o-mini" : "x-ai/grok-4-fast:free");

  // Add current date and time context to system prompt
  const now = new Date();
  const currentDateTime = now.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const currentDateISO = now.toISOString();

  const enhancedSystemPrompt = `${SYSTEM_PROMPT}

### Current Context
- 현재 날짜 및 시간: ${currentDateTime} (한국 시간)
- ISO 8601 형식: ${currentDateISO}
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

  const origin = request.headers.get("origin") ?? "https://easycalendar.local";

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "EasyCalendar",
    },
    body: JSON.stringify(payload),
    // OpenRouter recommends identifying the origin
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `OpenRouter error: ${response.status}`, detail: errorText },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
