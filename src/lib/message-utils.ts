import type { ConversationAttachment } from "@/lib/types";

export function withAttachmentContext(
  content: string,
  attachments: ConversationAttachment[] | undefined,
) {
  if (!attachments?.length) return content;
  const details = attachments
    .map((attachment, index) => {
      const sizeKb = (attachment.size / 1024).toFixed(1);
      return `${index + 1}. ${attachment.name} (${attachment.type || "unknown"}, ${sizeKb}KB)`;
    })
    .join("\n");

  return `${content}\n\n첨부된 파일 정보:\n${details}`;
}
