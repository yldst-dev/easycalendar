"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { ImageIcon, X as XIcon, MapPin, Trash2 } from "lucide-react";

function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <g>
        <g transform="translate(3.75 3.75)">
          <path fill="#FFFFFF" d="M148.882,43.618l-47.368-5.263l-57.895,5.263L38.355,96.25l5.263,52.632l52.632,6.579l52.632-6.579
            l5.263-53.947L148.882,43.618z"/>
          <path fill="#1A73E8" d="M65.211,125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c0.829,3.158,2.276,5.605,4.342,7.342
            c2.053,1.737,4.553,2.592,7.474,2.592c2.987,0,5.553-0.908,7.697-2.724s3.224-4.132,3.224-6.934c0-2.868-1.132-5.211-3.395-7.026
            s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921,0,5.382-0.789,7.382-2.368c2-1.579,3-3.737,3-6.487
            c0-2.447-0.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684,0-4.816,0.711-6.395,2.145s-2.724,3.197-3.447,5.276
            l-9.039-3.763c1.197-3.395,3.395-6.395,6.618-8.987c3.224-2.592,7.342-3.895,12.342-3.895c3.697,0,7.026,0.711,9.974,2.145
            c2.947,1.434,5.263,3.421,6.934,5.947c1.671,2.539,2.5,5.382,2.5,8.539c0,3.224-0.776,5.947-2.329,8.184
            c-1.553,2.237-3.461,3.947-5.724,5.145v0.539c2.987,1.25,5.421,3.158,7.342,5.724c1.908,2.566,2.868,5.632,2.868,9.211
            s-0.908,6.776-2.724,9.579c-1.816,2.803-4.329,5.013-7.513,6.618c-3.197,1.605-6.789,2.421-10.776,2.421
            C73.408,129.263,69.145,127.934,65.211,125.276z"/>
          <path fill="#1A73E8" d="M121.25,79.961l-9.974,7.25l-5.013-7.605l17.987-12.974h6.895v61.197h-9.895L121.25,79.961z"/>
          <path fill="#EA4335" d="M148.882,196.25l47.368-47.368l-23.684-10.526l-23.684,10.526l-10.526,23.684L148.882,196.25z"/>
          <path fill="#34A853" d="M33.092,172.566l10.526,23.684h105.263v-47.368H43.618L33.092,172.566z"/>
          <path fill="#4285F4" d="M12.039-3.75C3.316-3.75-3.75,3.316-3.75,12.039v136.842l23.684,10.526l23.684-10.526V43.618h105.263
            l10.526-23.684L148.882-3.75H12.039z"/>
          <path fill="#188038" d="M-3.75,148.882v31.579c0,8.724,7.066,15.789,15.789,15.789h31.579v-47.368H-3.75z"/>
          <path fill="#FBBC04" d="M148.882,43.618v105.263h47.368V43.618l-23.684-10.526L148.882,43.618z"/>
          <path fill="#1967D2" d="M196.25,43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z"/>
        </g>
      </g>
    </svg>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ConversationAttachment,
  ConversationMessage,
  ScheduleItem,
} from "@/lib/types";
import {
  createDraftMessage,
  createInitialState,
  loadScheduleFromSession,
  plannerReducer,
  saveScheduleToSession,
} from "@/lib/state";
import { exportSingleItemAsIcs, addToGoogleCalendar } from "@/lib/exporters";
import { requestScheduleFromAi } from "@/lib/openrouter";
import { isFutureOrPresent, parseDate, isBefore } from "@/lib/datetime";

export default function Home() {
  const [state, dispatch] = useReducer(plannerReducer, undefined, createInitialState);
  const [composerValue, setComposerValue] = useState("");
  const [attachments, setAttachments] = useState<ConversationAttachment[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(
    null,
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (text: string, tone: ToastMessage["tone"] = "info") => {
      setToast({ id: crypto.randomUUID(), text, tone, isClosing: false });
    },
    [],
  );

  // 초기 로드 시 세션에서 일정 데이터 복원 (hydration 이후)
  useEffect(() => {
    const savedSchedule = loadScheduleFromSession();
    if (savedSchedule.length > 0) {
      dispatch({ type: "SET_SCHEDULE", payload: savedSchedule });
    }
  }, []);

  // 일정 변경 시 세션 저장
  useEffect(() => {
    saveScheduleToSession(state.schedule);
  }, [state.schedule]);

  // 일정이 있을 때 페이지 닫기 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.schedule.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.schedule.length]);

  const appendAttachments = useCallback(
    (input: FileList | File[]) => {
      const files = Array.isArray(input) ? input : Array.from(input ?? []);
      if (!files.length) return;

      const { added, rejected } = files.reduce<{
        added: ConversationAttachment[];
        rejected: string[];
      }>(
        (acc, file) => {
          if (file.type.startsWith("image/")) {
            acc.added.push({
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
              type: file.type,
              file,
              previewUrl: URL.createObjectURL(file),
            });
          } else {
            acc.rejected.push(file.name);
          }
          return acc;
        },
        { added: [], rejected: [] },
      );

      if (rejected.length) {
        showToast(`이미지 파일만 첨부할 수 있어요: ${rejected.join(", ")}`, "error");
      }

      if (added.length) {
        setAttachments((prev) => [...prev, ...added]);
        showToast(`${added.length}개 이미지가 첨부되었습니다.`, "info");
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (!toast || toast.isClosing) return;
    const timer = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, isClosing: true } : prev));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toast?.isClosing) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 220);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      appendAttachments(event.target.files ?? []);
      event.target.value = "";
    },
    [appendAttachments],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      Array.from(items).forEach((item) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (files.length) {
        event.preventDefault();
        appendAttachments(files);
      }
    },
    [appendAttachments],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      prev
        .filter((item) => item.id === id)
        .forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const scheduleByDate = useMemo(() => groupScheduleByDate(state.schedule), [state.schedule]);

  const handleSubmit = useCallback(async () => {
    const trimmed = composerValue.trim();
    if (!trimmed && !attachments.length) {
      dispatch({ type: "SET_ERROR", payload: "메시지를 입력하거나 이미지를 첨부해 주세요." });
      showToast("메시지를 입력하거나 이미지를 첨부해 주세요.", "error");
      return;
    }

    const draft = createDraftMessage(trimmed || "이미지 첨부", attachments);
    const controller = new AbortController();

    dispatch({ type: "ADD_MESSAGE", payload: draft });
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: undefined });

    attachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });

    setComposerValue("");
    setAttachments([]);
    setAbortController(controller);

    try {
      const aiPlan = await requestScheduleFromAi([draft], controller.signal);

      // 취소된 경우 추가 처리하지 않음
      if (controller.signal.aborted) {
        return;
      }

      const assistantMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiPlan.summary,
        createdAt: new Date().toISOString(),
      };

      const now = new Date(Date.now() - 60 * 1000);
      const filteredItems = (aiPlan.items ?? []).filter(
        (item) => item.start && isFutureOrPresent(item.start, now),
      );
      const droppedCount = (aiPlan.items?.length ?? 0) - filteredItems.length;

      dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
      if (filteredItems.length > 0) {
        dispatch({ type: "ADD_SCHEDULE_ITEMS", payload: filteredItems });
        showToast("AI 일정이 생성되었습니다.", "success");
      }

      if (droppedCount > 0) {
        showToast(`${droppedCount}개의 과거 일정은 제외되었어요.`, "info");
      }
    } catch (error) {
      // AbortError인 경우 (사용자가 취소) 아무것도 하지 않음
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : String(error) });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "죄송해요! 응답을 받아오지 못했습니다. 다시 시도해 주세요.",
          createdAt: new Date().toISOString(),
          status: "error",
        } satisfies ConversationMessage,
      });
      const message = error instanceof Error ? error.message : String(error);
      showToast(message, "error");
    } finally {
      // 취소되지 않은 경우에만 로딩 상태 해제
      if (!controller.signal.aborted) {
        dispatch({ type: "SET_LOADING", payload: false });
        setAbortController(null);
      }
    }
  }, [attachments, composerValue, showToast]);

  const handleAddItem = useCallback(() => {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      title: "새 일정",
      start: now.toISOString(),
      end: nextHour.toISOString(),
    };
    dispatch({ type: "ADD_SCHEDULE_ITEM", payload: newItem });
    showToast("새 일정을 추가했습니다.", "info");
  }, [showToast]);

  const handleItemChange = useCallback(
    (id: string, field: keyof ScheduleItem, value: string | boolean) => {
      const current = state.schedule.find((item) => item.id === id);
      if (!current) return;

      const updates: Partial<ScheduleItem> = {};

      if (field === "allDay") {
        updates.allDay = Boolean(value);
      } else if (field === "start") {
        if (typeof value !== "string" || value.trim() === "") {
          showToast("시작 시간을 다시 선택해 주세요.", "error");
          return;
        }
        const nextStart = parseDate(value);
        if (!nextStart || !isFutureOrPresent(nextStart)) {
          showToast("과거 일정은 생성할 수 없어요.", "error");
          return;
        }
        updates.start = value;

        const currentEnd = parseDate(current.end);
        if (currentEnd && isBefore(currentEnd, nextStart)) {
          updates.end = undefined;
        }
      } else if (field === "end") {
        if (value === "") {
          updates.end = undefined;
        } else if (typeof value === "string") {
          const nextEnd = parseDate(value);
          if (!nextEnd || !isFutureOrPresent(nextEnd)) {
            showToast("종료 시간은 현재 이후로 설정해 주세요.", "error");
            return;
          }

          const startDate = parseDate(current.start);
          if (startDate && isBefore(nextEnd, startDate)) {
            showToast("종료 시간은 시작 이후여야 해요.", "error");
            return;
          }

          updates.end = value;
        }
      } else if (field === "title") {
        updates.title = value as string;
      } else if (field === "description") {
        updates.description = value as string;
      } else if (field === "location") {
        updates.location = value as string;
      }

      if (Object.keys(updates).length === 0) {
        return;
      }

      dispatch({
        type: "UPDATE_SCHEDULE_ITEM",
        payload: {
          ...current,
          ...updates,
        },
      });
    },
    [showToast, state.schedule],
  );

  const handleRemoveItem = useCallback((id: string) => {
    // 삭제할 아이템을 찾아서 저장
    const itemToRemove = state.schedule.find(item => item.id === id);

    if (!itemToRemove) return;

    // 아이템 삭제
    dispatch({ type: "REMOVE_SCHEDULE_ITEM", payload: id });

    // 되돌리기 기능이 있는 토스트 표시
    const undoAction = () => {
      dispatch({ type: "ADD_SCHEDULE_ITEM", payload: itemToRemove });
    };

    setToast({
      id: crypto.randomUUID(),
      text: "일정을 삭제했습니다.",
      tone: "info",
      isClosing: false,
      undoAction,
      undoText: "되돌리기",
      autoClose: true,
      duration: 5000,
    });
  }, [state.schedule]);

  const handleClearAllItems = useCallback(() => {
    if (state.schedule.length === 0) {
      showToast("삭제할 일정이 없습니다.", "info");
      return;
    }

    const previousItems = state.schedule.map((item) => ({ ...item }));

    dispatch({ type: "SET_SCHEDULE", payload: [] });

    setToast({
      id: crypto.randomUUID(),
      text: "모든 일정을 삭제했습니다.",
      tone: "info",
      isClosing: false,
      undoAction: () => {
        dispatch({ type: "ADD_SCHEDULE_ITEMS", payload: previousItems });
      },
      undoText: "되돌리기",
      autoClose: true,
      duration: 5000,
    });
  }, [dispatch, showToast, state.schedule]);

  const cancelRequest = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    dispatch({ type: "SET_LOADING", payload: false });

    // 취소 메시지를 채팅에 추가
    const cancelMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "응답이 취소되었습니다.",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: cancelMessage });

    showToast("요청을 중지했습니다.", "info");
  }, [abortController, showToast]);

  const requestToastClose = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, isClosing: true } : prev));
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 pb-20 sm:py-10 lg:py-12 flex items-center justify-center">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8 lg:grid lg:grid-cols-[minmax(0,_3fr)_minmax(0,_2fr)] lg:items-start lg:gap-8 xl:gap-10">
        <section className="flex flex-col gap-4 lg:gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              EasyCalendar
            </p>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              자연어로 일정을 만들고 다듬어 보세요.
            </h1>
          </header>

          <Card className="flex flex-1 flex-col">
            <CardHeader className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">대화</h2>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {state.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {state.isLoading && <TypingIndicator />}
              </div>

              <div className="flex justify-center">
                <div className="w-full max-w-[98%]">
                  <Composer
                    value={composerValue}
                    onValueChange={setComposerValue}
                    attachments={attachments}
                    onFilesSelected={handleFileChange}
                    onAttachmentRemove={removeAttachment}
                    onSubmit={handleSubmit}
                    onCancel={cancelRequest}
                    onPaste={handlePaste}
                    onFilesDropped={appendAttachments}
                    disabled={state.isLoading}
                    isLoading={state.isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col gap-4">
            <Card className="flex h-full flex-col transition-all duration-300 ease-in-out">
              <CardHeader>
                <h2 className="text-lg font-semibold">AI 일정 미리보기</h2>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4" aria-live="polite">
                <div
                  className={cn(
                    "flex flex-col gap-3 transition-opacity",
                    state.isLoading ? "opacity-90" : "opacity-100",
                  )}
                >
                  {state.schedule.length === 0 && !state.isLoading ? (
                    <EmptyState />
                  ) : (
                    state.schedule.map((item) => (
                      <ScheduleEditor
                        key={item.id}
                        item={item}
                        onChange={handleItemChange}
                        onRemove={handleRemoveItem}
                      />
                    ))
                  )}
                </div>
                {state.isLoading ? <ShimmerSchedulePreview /> : null}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllItems}
                    disabled={state.schedule.length === 0}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    전체 삭제
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleAddItem}>
                    새 일정 추가
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="flex h-full flex-col transition-all duration-300 ease-in-out">
              <CardHeader>
                <h2 className="text-lg font-semibold">캘린더 뷰</h2>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3" aria-live="polite">
                <div
                  className={cn(
                    "flex flex-col gap-3 transition-opacity",
                    state.isLoading ? "opacity-90" : "opacity-100",
                  )}
                >
                  {state.schedule.length === 0 && !state.isLoading ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
                      일정이 생성되면 여기에서 날짜별로 확인할 수 있어요.
                    </div>
                  ) : (
                    Object.entries(scheduleByDate).map(([date, items]) => (
                      <div key={date} className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <TypewriterText text={formatDateLabel(date)} as="span" className="text-xs" />
                        </p>
                        <ul className="flex flex-col gap-2">
                          {items.map((item) => (
                            <li key={item.id} className="rounded-2xl border border-border px-4 py-3 transition-all duration-300 ease-in-out">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 space-y-1.5">
                                  <TypewriterText
                                    text={item.title}
                                    as="span"
                                    className="block text-sm font-medium"
                                  />
                                  <TypewriterText
                                    text={formatTimeRange(item.start, item.end, item.allDay)}
                                    as="span"
                                    className="block text-xs text-muted-foreground"
                                  />
                                  {item.location ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <TypewriterText
                                        text={item.location}
                                        as="span"
                                        className="text-xs text-muted-foreground"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addToGoogleCalendar(item)}
                                      className="h-8 w-8 p-0 hover:bg-blue-50"
                                    >
                                      <GoogleCalendarIcon className="h-4 w-4" />
                                    </Button>
                                    <TooltipContent side="top">
                                      구글 캘린더에 추가
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => exportSingleItemAsIcs(item)}
                                      className="h-8 px-3 text-xs"
                                    >
                                      내보내기
                                    </Button>
                                    <TooltipContent side="top">
                                      ICS 파일로 내보내기
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
                {state.isLoading ? <ShimmerCalendarView /> : null}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
      {toast ? (
        <Toast
          key={toast.id}
          message={toast.text}
          tone={toast.tone}
          isClosing={toast.isClosing}
          onClose={requestToastClose}
          undoAction={toast.undoAction}
          undoText={toast.undoText}
          autoClose={toast.autoClose}
          duration={toast.duration}
        />
      ) : null}
    </main>
  );
}

function TypewriterText({
  text,
  className,
  as: Component = "p",
  speed = 20,
}: {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setCurrentIndex(0);
      return;
    }
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  const TypedComponent = Component;
  return <TypedComponent className={className}>{displayedText}</TypedComponent>;
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const [formattedTime, setFormattedTime] = useState<string>("");
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  useEffect(() => {
    // 클라이언트에서만 날짜 포맷팅
    setFormattedTime(new Date(message.createdAt).toLocaleString());
  }, [message.createdAt]);

  return (
    <article
      className={cn(
        "flex flex-col gap-2 min-h-[60px] transition-all duration-300 ease-in-out",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 transition-all duration-300 ease-in-out",
          isUser ? "bg-foreground text-background" : "bg-secondary text-foreground",
        )}
      >
        {isAssistant ? (
          <TypewriterText text={message.content} />
        ) : (
          <p>{message.content}</p>
        )}
      </div>
      {message.attachments?.length ? (
        <div className="flex flex-wrap justify-end gap-2">
          {message.attachments.map((attachment) => (
            <AttachmentPreview key={attachment.id} attachment={attachment} readOnly />
          ))}
        </div>
      ) : null}
      {formattedTime && (
        <time className="text-xs text-muted-foreground">
          {formattedTime}
        </time>
      )}
    </article>
  );
}

function Composer({
  value,
  onValueChange,
  attachments,
  onFilesSelected,
  onAttachmentRemove,
  onSubmit,
  onCancel,
  onPaste,
  onFilesDropped,
  disabled,
  isLoading,
}: {
  value: string;
  onValueChange: (value: string) => void;
  attachments: ConversationAttachment[];
  onFilesSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachmentRemove: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const placeholderText = "일정을 설명하거나 일정 사진 첨부...";

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, []);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag over state if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesDropped(files);
    }
  }, [onFilesDropped]);

  return (
    <div 
      className="flex flex-col items-center mx-auto px-4 sm:px-5 md:px-6"
      style={{ 
        padding: '16px',
        maxWidth: '100%'
      }}
    >
      {attachments.length ? (
        <div className="flex flex-wrap gap-2 w-full mb-4">
          {attachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={onAttachmentRemove}
              size="sm"
            />
          ))}
        </div>
      ) : null}

      <div 
        className="flex flex-col w-full relative transition-all duration-300 ease-in-out max-w-3xl border rounded-3xl bg-background border-border hover:border-input"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-primary bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex flex-col">
                <p className="text-primary font-medium">이미지를 여기에 놓으세요</p>
                <p className="text-primary/70 text-sm">PNG, JPG, GIF 파일을 지원합니다</p>
              </div>
            </div>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            adjustHeight();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!disabled && (value.trim() || attachments.length)) {
                onSubmit();
              }
            }
          }}
          placeholder={placeholderText}
          aria-label="ChatGPT에게 메시지 보내기..."
          disabled={disabled}
          className="w-full resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base leading-relaxed min-h-[48px] sm:min-h-[52px]"
          onPaste={onPaste}
          rows={1}
        />
        
        <div className="flex items-center justify-between px-3 pb-3">
          <label
            htmlFor="attachment"
            className={cn(
              "inline-flex items-center gap-2 cursor-pointer transition-colors rounded-full px-3 py-1.5 text-sm font-medium border border-border",
              "hover:bg-accent hover:text-accent-foreground hover:border-input"
            )}
          >
            <svg 
              className="h-4 w-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
              />
            </svg>
            <span className="hidden sm:inline">첨부</span>
            <Input
              id="attachment"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={onFilesSelected}
              disabled={disabled}
            />
          </label>
          
          <button
            type="button"
            onClick={isLoading ? onCancel : onSubmit}
            disabled={!isLoading && (!value.trim() && !attachments.length)}
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-colors",
              "h-8 w-8 text-primary-foreground",
              !isLoading && (!value.trim() && !attachments.length)
                ? "bg-muted cursor-not-allowed"
                : isLoading
                ? "bg-black hover:bg-gray-800"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isLoading ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <span className="text-center text-xs text-muted-foreground mt-2">
        이미지는 임시로만 사용되며 서버에 저장되지 않습니다.
      </span>
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
  readOnly,
  size = "md",
}: {
  attachment: ConversationAttachment;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const containerClasses =
    size === "sm"
      ? "flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2"
      : "flex items-center gap-2 rounded-2xl border border-border px-3 py-2";
  const imageClasses = size === "sm" ? "h-12 w-12 rounded-xl object-cover" : "h-12 w-12 rounded-xl object-cover";

  return (
    <div className={containerClasses}>
      {attachment.previewUrl ? (
        <Image
          src={attachment.previewUrl}
          alt={attachment.name}
          width={48}
          height={48}
          className={imageClasses}
          unoptimized
        />
      ) : (
        <span className="text-xs text-muted-foreground">{attachment.type}</span>
      )}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-foreground">{attachment.name}</span>
        <span className="text-[10px] text-muted-foreground">
          {(attachment.size / 1024).toFixed(1)} KB
        </span>
      </div>
      {!readOnly && onRemove ? (
        <button
          type="button"
          className="ml-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onRemove(attachment.id)}
        >
          제거
        </button>
      ) : null}
    </div>
  );
}

function ScheduleEditor({
  item,
  onChange,
  onRemove,
}: {
  item: ScheduleItem;
  onChange: (id: string, field: keyof ScheduleItem, value: string | boolean) => void;
  onRemove: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [draftLocation, setDraftLocation] = useState(item.location ?? "");
  const [draftDescription, setDraftDescription] = useState(item.description ?? "");
  const [draftAllDay, setDraftAllDay] = useState(Boolean(item.allDay));
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraftTitle(item.title);
  }, [item.title]);

  useEffect(() => {
    setDraftLocation(item.location ?? "");
  }, [item.location]);

  useEffect(() => {
    setDraftDescription(item.description ?? "");
  }, [item.description]);

  useEffect(() => {
    setDraftAllDay(Boolean(item.allDay));
  }, [item.allDay]);

  const updateAllDay = useCallback(
    (nextValue: boolean) => {
      setDraftAllDay(nextValue);
      if (Boolean(item.allDay) !== nextValue) {
        onChange(item.id, "allDay", nextValue);
      }
    },
    [item.allDay, item.id, onChange],
  );

  useEffect(() => {
    if (!descriptionRef.current) return;
    const el = descriptionRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draftDescription]);

  return (
    <div className="flex flex-col rounded-3xl border border-border p-4 transition-all duration-300 ease-in-out hover:shadow-sm">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            <TypewriterText text={item.title || "제목 없음"} as="span" />
          </h3>
          <p className="text-xs text-muted-foreground">
            <TypewriterText
              text={formatTimeRange(item.start, item.end, item.allDay)}
              as="span"
              className="text-xs text-muted-foreground"
            />
          </p>
          {item.location ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <TypewriterText
                text={item.location}
                as="span"
                className="text-xs text-muted-foreground"
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "접기" : "펼치기"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            className="h-8 px-3 text-xs whitespace-nowrap transition-all duration-150 hover:-translate-y-[1px]"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
          >
            삭제
          </Button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="mt-4 flex flex-col gap-3">
          <Input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={() => {
              if (draftTitle !== item.title) {
                onChange(item.id, "title", draftTitle);
              }
            }}
            placeholder="일정 제목"
          />
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                종일 이벤트
              </span>
              <div
                className="flex items-center gap-3 rounded-3xl border border-border bg-background px-4 py-3 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => updateAllDay(!draftAllDay)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    updateAllDay(!draftAllDay);
                  }
                }}
                aria-pressed={draftAllDay}
              >
                <Checkbox
                  checked={draftAllDay}
                  onCheckedChange={(checked) => {
                    updateAllDay(checked === true);
                  }}
                  aria-label="종일 일정 여부"
                  onClick={(event) => event.stopPropagation()}
                />
                <span className="text-sm text-foreground">
                  하루 종일 진행
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`start-${item.id}`} className="text-xs text-muted-foreground">
                시작
              </Label>
              <DateTimePicker
                value={item.start}
                onChange={(value) => onChange(item.id, "start", value)}
                placeholder="시작 날짜와 시간을 선택하세요"
                showTime={!draftAllDay}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`end-${item.id}`} className="text-xs text-muted-foreground">
                종료 (선택)
              </Label>
              <div className="flex items-center gap-2">
                <DateTimePicker
                  value={item.end || ""}
                  onChange={(value) => onChange(item.id, "end", value)}
                  placeholder="종료 날짜와 시간을 선택하세요"
                  showTime={!draftAllDay}
                  className="flex-1"
                />
                {item.end ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    onClick={() => onChange(item.id, "end", "")}
                    aria-label="종료 시간 지우기"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`location-${item.id}`} className="text-xs text-muted-foreground">
                위치
              </Label>
              <Input
                id={`location-${item.id}`}
                value={draftLocation}
                placeholder="장소 또는 링크"
                onChange={(event) => setDraftLocation(event.target.value)}
                onBlur={() => {
                  if ((item.location ?? "") !== draftLocation) {
                    onChange(item.id, "location", draftLocation);
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`description-${item.id}`} className="text-xs text-muted-foreground">
                메모
              </Label>
              <textarea
                id={`description-${item.id}`}
                ref={descriptionRef}
                value={draftDescription}
                placeholder="요약, 준비물 등"
                onChange={(event) => {
                  setDraftDescription(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${event.target.scrollHeight}px`;
                }}
                onInput={(event) => {
                  // 자동 높이 조절
                  const target = event.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
                onBlur={() => {
                  if ((item.description ?? "") !== draftDescription) {
                    onChange(item.id, "description", draftDescription);
                  }
                }}
                className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 resize-none min-h-[80px] overflow-hidden"
                style={{ height: "auto" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
      AI가 전송한 일정이 이곳에 표시됩니다. <br />
      또는 직접 일정을 추가하거나 수정해 보세요.
    </div>
  );
}

function groupScheduleByDate(items: ScheduleItem[]) {
  return items.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const key = item.start ? item.start.slice(0, 10) : "기타";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeRange(start: string, end?: string, allDay?: boolean) {
  if (allDay) {
    return "종일";
  }
  if (!start) {
    return "";
  }
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : undefined;
  const startLabel = startDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endLabel = endDate
    ? endDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}


type ToastMessage = {
  id: string;
  text: string;
  tone: "success" | "error" | "info";
  isClosing?: boolean;
  undoAction?: () => void;
  undoText?: string;
  autoClose?: boolean;
  duration?: number;
};

function Toast({
  message,
  tone,
  isClosing,
  onClose,
  undoAction,
  undoText,
  autoClose = true,
  duration = 5000,
}: {
  message: string;
  tone: ToastMessage["tone"];
  isClosing?: boolean;
  onClose: () => void;
  undoAction?: () => void;
  undoText?: string;
  autoClose?: boolean;
  duration?: number;
}) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef<number>(duration);
  const lastTimerStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    remainingRef.current = duration;
    lastTimerStartRef.current = null;

    if (!autoClose || isClosing) {
      return () => {};
    }

    lastTimerStartRef.current = Date.now();
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, remainingRef.current);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = null;
      lastTimerStartRef.current = null;
    };
  }, [autoClose, duration, isClosing, onClose, message, tone, undoAction]);

  const pauseTimer = useCallback(() => {
    if (!autoClose || isClosing) return;
    if (!closeTimerRef.current) return;
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;

    if (lastTimerStartRef.current !== null) {
      const elapsed = Date.now() - lastTimerStartRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
  }, [autoClose, isClosing]);

  const resumeTimer = useCallback(() => {
    if (!autoClose || isClosing) return;
    if (remainingRef.current <= 0) {
      onClose();
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    lastTimerStartRef.current = Date.now();
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, remainingRef.current);
  }, [autoClose, isClosing, onClose]);

  const handleUndo = useCallback(() => {
    if (undoAction) {
      undoAction();
      onClose();
    }
  }, [undoAction, onClose]);

  return (
    <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur",
          isClosing ? "toast-exit" : "toast-enter",
          toastToneStyles[tone],
        )}
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}
      >
        <span className="flex-1">{message}</span>

        <div className="flex items-center gap-2">
          {undoAction ? (
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide hover:opacity-70 transition-opacity"
              onMouseEnter={pauseTimer}
              onMouseLeave={resumeTimer}
              onClick={handleUndo}
            >
              {undoText || "되돌리기"}
            </button>
          ) : (
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide hover:opacity-70 transition-opacity"
              onMouseEnter={pauseTimer}
              onMouseLeave={resumeTimer}
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const toastToneStyles: Record<ToastMessage["tone"], string> = {
  success: "bg-emerald-50/95 text-emerald-700 border-emerald-200",
  error: "bg-rose-50/95 text-rose-600 border-rose-200",
  info: "bg-background/95 text-foreground border-border/70",
};

function TypingIndicator() {
  return (
    <article className="flex flex-col gap-2 items-start transition-all duration-300 ease-in-out">
      <div className="max-w-[80%] rounded-3xl px-4 py-3 bg-secondary transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">AI가 생각중입니다...</div>
    </article>
  );
}

function ShimmerSchedulePreview() {
  return (
    <div className="flex flex-col rounded-3xl border border-border p-4 animate-pulse bg-muted/30 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 bg-muted rounded"></div>
          <div className="h-8 w-12 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}

function ShimmerCalendarView() {
  return (
    <div className="flex flex-col gap-2 animate-pulse bg-muted/20 rounded-3xl p-3 transition-all duration-300 ease-in-out">
      <div className="h-4 bg-muted rounded w-20"></div>
      <div className="rounded-2xl border border-border px-4 py-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 bg-muted rounded"></div>
            <div className="h-8 w-8 bg-muted rounded"></div>
            <div className="h-8 w-16 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
