import { ScheduleItem } from "@/lib/types";

export function exportScheduleAsJson(items: ScheduleItem[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "schedule.json");
}

export function exportScheduleAsIcs(items: ScheduleItem[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EasyCalendar//AI Planner//EN",
  ];

  items.forEach((item) => {
    const uid = item.id ?? crypto.randomUUID();
    const dtStamp = formatDate(new Date());
    const dtStart = formatDate(new Date(item.start));
    const dtEnd = item.end ? formatDate(new Date(item.end)) : undefined;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    if (dtEnd) {
      lines.push(`DTEND:${dtEnd}`);
    }
    if (item.title) {
      lines.push(`SUMMARY:${escapeText(item.title)}`);
    }
    if (item.location) {
      lines.push(`LOCATION:${escapeText(item.location)}`);
    }
    if (item.description) {
      lines.push(`DESCRIPTION:${escapeText(item.description)}`);
    }
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar",
  });
  downloadBlob(blob, "schedule.ics");
}

export function exportSingleItemAsIcs(item: ScheduleItem) {
  const filename = `${item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.ics`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EasyCalendar//AI Planner//EN",
  ];

  const uid = item.id ?? crypto.randomUUID();
  const dtStamp = formatDate(new Date());
  const dtStart = formatDate(new Date(item.start));
  const dtEnd = item.end ? formatDate(new Date(item.end)) : undefined;

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`DTSTART:${dtStart}`);
  if (dtEnd) {
    lines.push(`DTEND:${dtEnd}`);
  }
  if (item.title) {
    lines.push(`SUMMARY:${escapeText(item.title)}`);
  }
  if (item.location) {
    lines.push(`LOCATION:${escapeText(item.location)}`);
  }
  if (item.description) {
    lines.push(`DESCRIPTION:${escapeText(item.description)}`);
  }
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar",
  });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string) {
  return value.replace(/[\\,;]/g, (match) => `\\${match}`);
}

export function addToGoogleCalendar(item: ScheduleItem) {
  const baseUrl = "https://calendar.google.com/calendar/render";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: formatGoogleCalendarDate(item.start, item.end),
    details: item.description || "",
    location: item.location || "",
  });

  const url = `${baseUrl}?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatGoogleCalendarDate(start: string, end?: string) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  };

  return `${formatDate(startDate)}/${formatDate(endDate)}`;
}

export function addToAppleCalendar(item: ScheduleItem) {
  // Create ICS content for Apple Calendar
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EasyCalendar//Apple Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const uid = item.id ?? crypto.randomUUID();
  const dtStamp = formatDate(new Date());
  const dtStart = formatDate(new Date(item.start));
  const dtEnd = item.end ? formatDate(new Date(item.end)) : formatDate(new Date(new Date(item.start).getTime() + 60 * 60 * 1000));

  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`DTSTART:${dtStart}`);
  lines.push(`DTEND:${dtEnd}`);
  if (item.title) {
    lines.push(`SUMMARY:${escapeText(item.title)}`);
  }
  if (item.location) {
    lines.push(`LOCATION:${escapeText(item.location)}`);
  }
  if (item.description) {
    lines.push(`DESCRIPTION:${escapeText(item.description)}`);
  }
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  // Create blob and download
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar",
  });

  // For Apple devices, try to use the calendar:// protocol first, fallback to download
  const userAgent = navigator.userAgent.toLowerCase();
  const isAppleDevice = /iphone|ipad|ipod|macintosh|mac os x/.test(userAgent);

  if (isAppleDevice) {
    // Create a temporary URL for the ICS file
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download/open
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_apple.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // For non-Apple devices, just download the ICS file
    downloadBlob(blob, `${item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_apple.ics`);
  }
}
