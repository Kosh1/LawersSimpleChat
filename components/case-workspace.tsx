"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { cn } from "@/lib/utils";
import type { ChatMessage, Project, SessionDocument } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Bot,
  Download,
  FileText,
  Loader2,
  Menu,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type LocalChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  backendSessionId?: string;
  createdAt: string;
  documents: SessionDocument[];
  projectId: string;
};

type ProjectState = Project & {
  documents: SessionDocument[];
};

interface CaseWorkspaceProps {
  project: ProjectState;
  sessions: LocalChatSession[];
  activeSessionId: string | null;
  input: string;
  isLoading: boolean;
  isThinking: boolean;
  isUploadingDocument: boolean;
  isDocumentsLoading: boolean;
  isLoadingChats: boolean;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onAttachDocument: (files: FileList | null) => void;
  onRemoveDocument: (documentId: string) => void;
  onExportMessage?: (messageIndex: number) => void;
}

export function CaseWorkspace({
  project,
  sessions,
  activeSessionId,
  input,
  isLoading,
  isThinking,
  isUploadingDocument,
  isDocumentsLoading,
  isLoadingChats,
  onBack,
  onSelectSession,
  onNewChat,
  onInputChange,
  onSendMessage,
  onAttachDocument,
  onRemoveDocument,
  onExportMessage,
}: CaseWorkspaceProps) {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'chats' | 'documents'>('chats');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sessions],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSendMessage();
    },
    [onSendMessage],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSendMessage();
      }
    },
    [onSendMessage],
  );

  const handleAttachButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onAttachDocument(event.target.files);
      if (event.target) {
        event.target.value = "";
      }
    },
    [onAttachDocument],
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="hidden sm:flex">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Вернуться к списку дел</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="sm:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Назад</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Открыть меню</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg bg-muted p-1.5 sm:block">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">{project.name}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {isDocumentsLoading ? (
                    <>
                      <Loader2 className="inline h-3 w-3 animate-spin" /> документов
                    </>
                  ) : (
                    `${project.documents.length} документов`
                  )} · {isLoadingChats ? (
                    <>
                      <Loader2 className="inline h-3 w-3 animate-spin" /> чатов
                    </>
                  ) : (
                    `${sessions.length} чатов`
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chats & Documents with Toggle */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r bg-muted/30 transition-transform duration-300 md:static md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b p-4 md:hidden">
            <h2 className="text-sm font-semibold">
              {sidebarView === 'chats' ? 'Чаты' : 'Документы'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Закрыть панель</span>
            </Button>
          </div>

          {/* Tab Switcher */}
          <div className="border-b bg-background/50">
            <div className="flex">
              <button
                onClick={() => setSidebarView('chats')}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  sidebarView === 'chats'
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Чаты</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {sessions.length}
                </span>
              </button>
              <button
                onClick={() => setSidebarView('documents')}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  sidebarView === 'documents'
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Документы</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {project.documents.length}
                </span>
              </button>
            </div>
          </div>

          {/* Chats View */}
          {sidebarView === 'chats' && (
            <>
              <div className="border-b p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Чаты проекта</h3>
                  {isLoadingChats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button onClick={onNewChat} variant="secondary" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Новый чат
                </Button>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-1 pb-4">
                    {isLoadingChats ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Загрузка чатов...</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Получаем историю разговоров
                        </p>
                      </div>
                    ) : sortedSessions.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Нет чатов</p>
                        <p className="mt-1 text-xs text-muted-foreground">Создайте первый чат</p>
                      </div>
                    ) : (
                      sortedSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            onSelectSession(session.id);
                            setIsSidebarOpen(false);
                          }}
                          className={cn(
                            "flex w-full flex-col items-start rounded-lg px-3 py-3 text-left transition-all hover:bg-muted",
                            session.id === activeSessionId
                              ? "bg-muted shadow-sm"
                              : "bg-transparent",
                          )}
                        >
                          <div className="flex w-full items-center gap-2">
                            <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-sm font-medium">
                              {session.title || "Новый чат"}
                            </span>
                          </div>
                          <span className="ml-6 mt-1 text-xs text-muted-foreground">
                            {new Date(session.createdAt).toLocaleString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Documents View */}
          {sidebarView === 'documents' && (
            <>
              <div className="border-b p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Документы проекта</h3>
                  {isDocumentsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button
                  onClick={handleAttachButtonClick}
                  disabled={isUploadingDocument}
                  variant="outline"
                  className="w-full gap-2"
                  size="sm"
                >
                  {isUploadingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Загрузить документ
                </Button>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-2 pb-4">
                    {isDocumentsLoading ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Загрузка документов...</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Получаем прикрепленные файлы
                        </p>
                      </div>
                    ) : project.documents.length === 0 ? (
                      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Нет документов</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Загрузите документы для работы
                        </p>
                      </div>
                    ) : (
                      project.documents.map((document) => (
                        <div
                          key={document.id}
                          className="group rounded-lg border bg-card p-3 transition-all hover:shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-md bg-primary/10 p-2 text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 truncate text-sm font-medium leading-tight">
                                {document.name}
                              </div>
                              <div className="space-y-0.5 text-xs text-muted-foreground">
                                <div>{formatBytes(document.size)}</div>
                                <div>
                                  {new Date(document.uploadedAt).toLocaleDateString("ru-RU")}
                                </div>
                                <div className="text-xs">{formatStrategy(document.strategy)}</div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => onRemoveDocument(document.id)}
                              disabled={isUploadingDocument || isDocumentsLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Удалить</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </aside>

        {/* Center Column - Chat Messages (Expanded) */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
                {isLoadingChats && !activeSession ? (
                  <div className="mt-10 text-center text-muted-foreground">
                    <div className="mx-auto mb-4 rounded-full bg-muted p-6 w-fit">
                      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Загрузка чатов...</h2>
                    <p className="mt-2 text-sm">
                      Получаем вашу историю разговоров
                      <br />Подождите немного
                    </p>
                  </div>
                ) : activeSession && activeSession.messages.length === 0 && !isLoading && (
                  <div className="mt-10 text-center text-muted-foreground">
                    <div className="mx-auto mb-4 rounded-full bg-muted p-6 w-fit">
                      <Bot className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">С чего начнём?</h2>
                    <p className="mt-2 text-sm">
                      Опишите ситуацию, из-за которой вы обращаетесь.
                      <br />Я помогу разобраться со стратегией и рисками.
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
                    {message.role === "user" ? (
                      <div className="max-w-full md:max-w-[80%]">
                        <div className="rounded-2xl bg-muted px-4 py-3">
                          <p className="whitespace-pre-wrap text-sm text-foreground/90">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative max-w-full md:max-w-[80%]">
                        {message.metadata?.wasReasoning && message.metadata?.thinkingTimeSeconds && (
                          <div className="mb-2">
                            <ThinkingIndicator 
                              isThinking={false}
                              thinkingTime={message.metadata.thinkingTimeSeconds}
                              modelName={message.metadata.modelUsed}
                            />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm text-foreground/90">
                          {message.content}
                        </p>
                        {onExportMessage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-10 top-0 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => onExportMessage(index)}
                            title="Скачать ответ в формате DOCX"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Скачать ответ</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-full md:max-w-[80%]">
                      {isThinking ? (
                        <ThinkingIndicator isThinking={true} />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>AI обрабатывает запрос…</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Message Input */}
          <div className="border-t bg-background p-4">
            <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,image/*"
                onChange={handleFileInputChange}
              />

              <Textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Опишите ситуацию, вопрос или запрос к защитнику…"
                className="min-h-[100px] resize-none"
                disabled={isLoading || isLoadingChats}
              />
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAttachButtonClick}
                  disabled={isUploadingDocument}
                  className="gap-2"
                >
                  {isUploadingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  {isUploadingDocument ? "Обработка…" : "Прикрепить"}
                </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isUploadingDocument || isLoadingChats || !input.trim()} 
                variant="secondary"
                className="gap-2"
              >
                {isLoading || isLoadingChats ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoadingChats ? "Загрузка..." : "Отправить"}
              </Button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          aria-label="Закрыть панель"
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
      return "PDF";
    case "docx":
      return "Word";
    case "vision":
      return "LLM/vision";
    case "llm-file":
      return "LLM/файл";
    default:
      return "Текст";
  }
}

