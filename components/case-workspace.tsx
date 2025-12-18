"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { cn } from "@/lib/utils";
import type { ChatMessage, Project, SessionDocument, SelectedModel } from "@/lib/types";
import { getModelDisplayName } from "@/lib/model-config";
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
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  selectedModel: SelectedModel;
  onModelChange: (model: SelectedModel) => void;
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
  selectedModel,
  onModelChange,
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
    <div className="flex h-screen flex-col retro-workspace">
      {/* Header */}
      <header className="retro-workspace-header">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="retro-workspace-button-secondary hidden sm:flex" style={{ padding: '0.5rem', minWidth: 'auto' }}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Вернуться к списку дел</span>
            </button>
            <button
              onClick={onBack}
              className="retro-workspace-button-secondary sm:hidden"
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Назад</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="retro-workspace-button-secondary md:hidden"
              style={{ padding: '0.5rem', minWidth: 'auto' }}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Открыть меню</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg p-1.5 sm:block" style={{ background: '#f0f0eb' }}>
                <Bot className="h-4 w-4" style={{ color: '#982525' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight retro-workspace" style={{ fontFamily: "'Courier New', 'Monaco', monospace", textTransform: 'uppercase' }}>{project.name}</span>
                <span className="hidden text-xs sm:block" style={{ color: '#666', fontFamily: "'Courier New', 'Monaco', monospace" }}>
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
            {/* Model Selection Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="retro-workspace-button-secondary hidden sm:flex" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                  <span className="text-xs">
                    {getModelDisplayName(selectedModel)}
                  </span>
                  <ChevronDown className="ml-2 h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="retro-workspace-dialog">
                <DropdownMenuItem
                  onClick={() => onModelChange('openai')}
                  className={selectedModel === 'openai' ? 'bg-accent' : ''}
                >
                  {getModelDisplayName('openai')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onModelChange('anthropic')}
                  className={selectedModel === 'anthropic' ? 'bg-accent' : ''}
                >
                  {getModelDisplayName('anthropic')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onModelChange('gemini')}
                  className={selectedModel === 'gemini' ? 'bg-accent' : ''}
                >
                  {getModelDisplayName('gemini')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onModelChange('thinking')}
                  className={selectedModel === 'thinking' ? 'bg-accent' : ''}
                >
                  {getModelDisplayName('thinking')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Two Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chats & Documents with Toggle */}
        <aside
          className={cn(
            "retro-workspace-sidebar fixed inset-y-0 left-0 z-40 flex w-80 flex-col transition-transform duration-300 md:static md:translate-x-0",
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
          <div className="retro-workspace-tabs">
            <button
              onClick={() => setSidebarView('chats')}
              className={cn(
                "retro-workspace-tab",
                sidebarView === 'chats' ? 'active' : ''
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Чаты</span>
              <span style={{ marginLeft: '0.5rem', background: '#982525', color: '#fff', padding: '0.125rem 0.5rem', borderRadius: '0' }}>
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setSidebarView('documents')}
              className={cn(
                "retro-workspace-tab",
                sidebarView === 'documents' ? 'active' : ''
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Документы</span>
              <span style={{ marginLeft: '0.5rem', background: '#982525', color: '#fff', padding: '0.125rem 0.5rem', borderRadius: '0' }}>
                {project.documents.length}
              </span>
            </button>
          </div>

          {/* Chats View */}
          {sidebarView === 'chats' && (
            <>
              <div className="border-b p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Чаты проекта</h3>
                  {isLoadingChats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <button onClick={onNewChat} className="retro-workspace-button w-full gap-2 flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                  НОВЫЙ ЧАТ
                </button>
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
                            "retro-workspace-sidebar-item flex w-full flex-col items-start text-left",
                            session.id === activeSessionId ? "active" : "",
                          )}
                        >
                          <div className="flex w-full items-center gap-2">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" style={{ color: session.id === activeSessionId ? '#fff' : '#982525' }} />
                            <span className="flex-1 truncate text-sm font-medium" style={{ fontFamily: "'Courier New', 'Monaco', monospace", fontWeight: 'bold' }}>
                              {session.title || "Новый чат"}
                            </span>
                          </div>
                          <span className="ml-6 mt-1 text-xs" style={{ color: session.id === activeSessionId ? '#fff' : '#666' }}>
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
                <button
                  onClick={handleAttachButtonClick}
                  disabled={isUploadingDocument}
                  className="retro-workspace-button w-full gap-2 flex items-center justify-center"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  {isUploadingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  ЗАГРУЗИТЬ ДОКУМЕНТ
                </button>
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
                          className="retro-workspace-document group"
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
                        <div className="retro-workspace-message user">
                          <p className="whitespace-pre-wrap text-sm" style={{ fontFamily: "'Courier New', 'Monaco', monospace", color: '#000' }}>
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
                        <div className="retro-workspace-message assistant">
                          <div className="prose prose-sm dark:prose-invert max-w-none" style={{ fontFamily: "'Courier New', 'Monaco', monospace", color: '#000' }}>
                            <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                              h4: ({ children }) => <h4 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h4>,
                              h5: ({ children }) => <h5 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h5>,
                              h6: ({ children }) => <h6 className="text-sm font-semibold mb-2 mt-2 first:mt-0">{children}</h6>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-4">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-4">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-2">{children}</blockquote>,
                              code: ({ className, children, ...props }) => {
                                const isInline = !className;
                                if (isInline) {
                                  return (
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <code className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto my-2" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              a: ({ children, href }) => (
                                <a href={href} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                              hr: () => <hr className="my-4 border-border" />,
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-2">
                                  <table className="min-w-full border-collapse border border-border">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                              tbody: ({ children }) => <tbody>{children}</tbody>,
                              tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                              th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold text-sm">{children}</th>,
                              td: ({ children }) => <td className="border border-border px-2 py-1 text-sm">{children}</td>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                          </div>
                        </div>
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
          <div className="border-t p-4" style={{ background: '#fafaf5', borderTop: '3px solid #000' }}>
            <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,.md,.rtf,image/*"
                onChange={handleFileInputChange}
              />

              <textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Опишите ситуацию, вопрос или запрос к защитнику…"
                className="retro-workspace-input min-h-[100px] resize-none"
                disabled={isLoading || isLoadingChats}
                style={{ fontFamily: "'Courier New', 'Monaco', monospace" }}
              />
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAttachButtonClick}
                  disabled={isUploadingDocument}
                  className="retro-workspace-button-secondary gap-2 flex items-center"
                >
                  {isUploadingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  {isUploadingDocument ? "ОБРАБОТКА…" : "ПРИКРЕПИТЬ"}
                </button>
              <button 
                type="submit" 
                disabled={isLoading || isUploadingDocument || isLoadingChats || !input.trim()} 
                className="retro-workspace-button gap-2 flex items-center"
              >
                {isLoading || isLoadingChats ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoadingChats ? "ЗАГРУЗКА..." : "ОТПРАВИТЬ"}
              </button>
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

