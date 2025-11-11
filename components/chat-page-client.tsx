"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { ChatMessage, SessionDocument } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, Loader2, Menu, MessageSquare, Paperclip, Plus, Send, Trash2, User } from "lucide-react";

type LocalChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  backendSessionId?: string;
  createdAt: string;
  documents: SessionDocument[];
};

const LOCAL_STORAGE_KEY = "legal-assistant-chat-sessions";

function createEmptySession(): LocalChatSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: "Новый чат",
    messages: [],
    documents: [],
    createdAt: now,
  };
}

function generateTitle(message: string) {
  if (!message) return "Новый чат";
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 40) {
    return trimmed;
  }
  return `${trimmed.slice(0, 40)}…`;
}

function normalizeDocument(raw: unknown): SessionDocument | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const value = raw as Partial<SessionDocument> & Record<string, unknown>;
  const text = typeof value.text === "string" ? value.text : "";
  if (!text) {
    return null;
  }
  const strategy = isValidDocumentStrategy(value.strategy) ? value.strategy : "text";
  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : uuidv4(),
    name: typeof value.name === "string" && value.name.trim() ? value.name : "Документ",
    mimeType: typeof value.mimeType === "string" && value.mimeType.trim() ? value.mimeType : "application/octet-stream",
    size: typeof value.size === "number" && value.size >= 0 ? value.size : text.length,
    text,
    truncated: Boolean(value.truncated),
    rawTextLength: typeof value.rawTextLength === "number" && value.rawTextLength > 0 ? value.rawTextLength : text.length,
    strategy,
    uploadedAt:
      typeof value.uploadedAt === "string" && value.uploadedAt.trim()
        ? value.uploadedAt
        : new Date().toISOString(),
  };
}

function isValidDocumentStrategy(value: unknown): value is SessionDocument["strategy"] {
  return value === "text" || value === "pdf" || value === "docx" || value === "vision" || value === "llm-file";
}

export function ChatPageClient() {
  const searchParams = useSearchParams();
  const utmQuery = useMemo(() => {
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key.startsWith("utm_")) {
        params.set(key, value);
      }
    });
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [searchParams]);

  const [sessions, setSessions] = useState<LocalChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedRaw: LocalChatSession[] = JSON.parse(storedSessions);
        const parsed = parsedRaw.map<LocalChatSession>((session) => {
          const storedDocuments = Array.isArray((session as any).documents)
            ? ((session as any).documents as unknown[])
            : [];

          const normalizedDocuments = storedDocuments
            .map((document) => normalizeDocument(document))
            .filter((document): document is SessionDocument => Boolean(document));

          return {
            ...session,
            title: session.title?.trim() ? session.title : "Новый чат",
            messages: Array.isArray(session.messages) ? session.messages : [],
            documents: normalizedDocuments,
            createdAt: session.createdAt ?? new Date().toISOString(),
          };
        });
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setHasInitialized(true);
          return;
        }
      }
    } catch (error) {
      console.error("Не удалось загрузить чаты из хранилища:", error);
    }

    const initialSession = createEmptySession();
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
    setHasInitialized(true);
  }, []);

  useEffect(() => {
    if (!hasInitialized || typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Не удалось сохранить чаты:", error);
    }
  }, [sessions, hasInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((session) => session.id === activeSessionId);

  const handleNewChat = useCallback(() => {
    const newSession = createEmptySession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput("");
    setIsSidebarOpen(false);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setInput("");
    setIsSidebarOpen(false);
  }, []);

  const handleAttachButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processDocumentFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!activeSession || !fileList || fileList.length === 0) {
        return;
      }

      const sessionLocalId = activeSession.id;
      setIsUploadingDocument(true);

      const files = Array.from(fileList);
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/documents", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            const message =
              typeof errorPayload?.error === "string" && errorPayload.error.trim()
                ? errorPayload.error
                : "Не удалось обработать документ. Попробуйте другой файл.";
            throw new Error(message);
          }

          const data = await response.json();
          const normalized = normalizeDocument(data?.document);
          if (!normalized) {
            throw new Error("Ответ сервера не содержит текст документа.");
          }

          const contextMessage: ChatMessage = {
            role: "assistant",
            content: `Документ «${normalized.name}» добавлен в контекст. Я буду учитывать его при ответах.`,
          };

          setSessions((prev) =>
            prev.map((session) => {
              if (session.id !== sessionLocalId) {
                return session;
              }
              return {
                ...session,
                documents: [...session.documents, normalized],
                messages: [...session.messages, contextMessage],
              };
            }),
          );

          toast({
            title: "Документ добавлен",
            description: `Текст из «${normalized.name}» будет использоваться при ответах.`,
          });
        } catch (error) {
          console.error("Ошибка при обработке документа:", error);
          toast({
            variant: "destructive",
            title: "Не удалось обработать документ",
            description:
              error instanceof Error ? error.message : "Попробуйте другой файл или повторите попытку позже.",
          });
        }
      }

      setIsUploadingDocument(false);
    },
    [activeSession, setSessions, toast],
  );

  const handleDocumentInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await processDocumentFiles(event.target.files);
      if (event.target) {
        event.target.value = "";
      }
    },
    [processDocumentFiles],
  );

  const handleRemoveDocument = useCallback(
    (documentId: string) => {
      if (!activeSession) {
        return;
      }
      const sessionLocalId = activeSession.id;
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionLocalId) {
            return session;
          }
          const nextDocuments = session.documents.filter((document) => document.id !== documentId);
          if (nextDocuments.length === session.documents.length) {
            return session;
          }
          return {
            ...session,
            documents: nextDocuments,
          };
        }),
      );
      toast({
        title: "Документ удалён",
        description: "Этот документ больше не будет использоваться в ответах.",
      });
    },
    [activeSession, setSessions, toast],
  );

  const handleSendMessage = useCallback(async () => {
    if (!activeSession || isLoading) return;
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;

    const sessionLocalId = activeSession.id;
    const backendSessionId = activeSession.backendSessionId;
    const hasUserMessages = activeSession.messages.some((message) => message.role === "user");
    const isFirstUserMessage = !hasUserMessages;
    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };
    const messagesForRequest = [...activeSession.messages, userMessage];
    const documentsForRequest = activeSession.documents.map((document) => ({
      id: document.id,
      name: document.name,
      text: document.text,
    }));

    setInput("");
    setIsLoading(true);

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionLocalId) return session;
        return {
          ...session,
          messages: messagesForRequest,
          title: isFirstUserMessage ? generateTitle(trimmedMessage) : session.title,
        };
      }),
    );

    try {
      const response = await fetch(`/api/chat${utmQuery}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesForRequest,
          sessionId: backendSessionId,
          documents: documentsForRequest,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось отправить сообщение");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message,
      };

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionLocalId) return session;
          return {
            ...session,
            backendSessionId: data.sessionId ?? session.backendSessionId,
            messages: [...session.messages, assistantMessage],
          };
        }),
      );
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionLocalId) return session;
          return {
            ...session,
            messages: [
              ...session.messages,
              {
                role: "assistant",
                content: "Извините, произошла ошибка при обработке запроса. Попробуйте ещё раз.",
              },
            ],
          };
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, input, isLoading, utmQuery]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSendMessage();
    },
    [handleSendMessage],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r bg-muted/30 shadow-sm transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-semibold">AI-юрист</span>
            </div>
            <ThemeToggle />
          </div>
          <div className="p-4">
            <Button onClick={handleNewChat} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Новый чат
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-2 pb-6">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted",
                    session.id === activeSessionId ? "bg-muted" : "bg-transparent",
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate font-medium">{session.title || "Новый чат"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-0">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Открыть или скрыть список чатов</span>
            </Button>
            <h1 className="text-base font-semibold md:text-lg">{activeSession?.title ?? "Новый чат"}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
              {activeSession && activeSession.messages.length === 0 && !isLoading && (
                <div className="mt-10 text-center text-muted-foreground">
                  <h2 className="text-xl font-semibold text-foreground">С чего начнём?</h2>
                  <p className="mt-2 text-sm">
                    Опишите ситуацию, из-за которой вы обращаетесь. Я помогу разобраться со стратегией и рисками.
                  </p>
                </div>
              )}

              {activeSession?.messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "flex w-full",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex max-w-full items-start gap-3 md:max-w-[80%]",
                      message.role === "user" && "flex-row-reverse text-right",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <Card
                      className={cn(
                        "flex-1 border",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground",
                      )}
                    >
                      <CardContent className="whitespace-pre-wrap p-4 text-sm">
                        {message.content}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-full items-start gap-3 md:max-w-[80%]">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card className="flex-1 border bg-card text-card-foreground">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI обрабатывает запрос…</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="border-t bg-background p-4">
          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.rtf,image/*"
              onChange={handleDocumentInputChange}
            />

            {activeSession?.documents.length ? (
              <Card className="border-dashed">
                <CardContent className="space-y-3 p-4">
                  <div className="text-sm font-semibold">Документы в контексте</div>
                  <div className="space-y-2">
                    {activeSession.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-start justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm"
                      >
                        <div className="flex flex-1 items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-muted p-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium leading-tight">{document.name}</div>
                            <div className="text-xs text-muted-foreground leading-snug">
                              {formatBytes(document.size)} · {new Date(document.uploadedAt).toLocaleString()} ·{" "}
                              {formatStrategy(document.strategy)}
                              {document.truncated ? " · Текст усечён" : ""}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleRemoveDocument(document.id)}
                          disabled={isUploadingDocument}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Удалить документ</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Опишите ситуацию, вопрос или запрос к защитнику…"
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAttachButtonClick}
                    disabled={isUploadingDocument}
                  >
                    {isUploadingDocument ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="mr-2 h-4 w-4" />
                    )}
                    {isUploadingDocument ? "Обработка…" : "Прикрепить документ"}
                  </Button>
                  {isUploadingDocument && (
                    <span className="text-xs text-muted-foreground">Идёт обработка документа…</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Нажмите Enter, чтобы отправить · Shift + Enter — новая строка
                </span>
              </div>
              <Button type="submit" disabled={isLoading || isUploadingDocument || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Отправить
              </Button>
            </div>
          </form>
        </div>
      </div>

      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          aria-label="Закрыть список чатов"
        />
      )}
    </div>
  );
}

function formatBytes(size: number) {
  if (!size || size < 0) return "—";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatStrategy(strategy: SessionDocument["strategy"]) {
  switch (strategy) {
    case "pdf":
      return "PDF (прямое чтение)";
    case "docx":
      return "Word (прямое чтение)";
    case "vision":
      return "LLM/vision";
    case "llm-file":
      return "LLM/анализ файла";
    default:
      return "Текстовый файл";
  }
}

