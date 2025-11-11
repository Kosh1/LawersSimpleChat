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
import type { ChatMessage } from "@/lib/types";
import { Bot, Loader2, Menu, MessageSquare, Plus, Send, User } from "lucide-react";

type LocalChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  backendSessionId?: string;
  createdAt: string;
};

const LOCAL_STORAGE_KEY = "legal-assistant-chat-sessions";

function createEmptySession(): LocalChatSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: "New Chat",
    messages: [],
    createdAt: now,
  };
}

function generateTitle(message: string) {
  if (!message) return "New Chat";
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 40) {
    return trimmed;
  }
  return `${trimmed.slice(0, 40)}…`;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedRaw: LocalChatSession[] = JSON.parse(storedSessions);
        const parsed = parsedRaw.map<LocalChatSession>((session) => ({
          ...session,
          title: session.title?.trim() ? session.title : "New Chat",
          messages: Array.isArray(session.messages) ? session.messages : [],
          createdAt: session.createdAt ?? new Date().toISOString(),
        }));
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          setHasInitialized(true);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to load chat sessions from storage:", error);
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
      console.error("Failed to persist chat sessions:", error);
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

  const handleSendMessage = useCallback(async () => {
    if (!activeSession || isLoading) return;
    const trimmedMessage = input.trim();
    if (!trimmedMessage) return;

    const sessionLocalId = activeSession.id;
    const backendSessionId = activeSession.backendSessionId;
    const isFirstMessage = activeSession.messages.length === 0;
    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };
    const messagesForRequest = [...activeSession.messages, userMessage];

    setInput("");
    setIsLoading(true);

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionLocalId) return session;
        return {
          ...session,
          messages: messagesForRequest,
          title: isFirstMessage ? generateTitle(trimmedMessage) : session.title,
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
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
      console.error("Error sending message:", error);
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== sessionLocalId) return session;
          return {
            ...session,
            messages: [
              ...session.messages,
              {
                role: "assistant",
                content: "Sorry, there was an error processing your request. Please try again.",
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
              <span className="text-sm font-semibold">AI Legal Assistant</span>
            </div>
            <ThemeToggle />
          </div>
          <div className="p-4">
            <Button onClick={handleNewChat} className="w-full" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Chat
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
                    <span className="flex-1 truncate font-medium">{session.title || "New Chat"}</span>
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
              <span className="sr-only">Toggle chat history</span>
            </Button>
            <h1 className="text-base font-semibold md:text-lg">{activeSession?.title ?? "New Chat"}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
              {activeSession && activeSession.messages.length === 0 && !isLoading && (
                <div className="mt-10 text-center text-muted-foreground">
                  <h2 className="text-xl font-semibold text-foreground">How can I help you today?</h2>
                  <p className="mt-2 text-sm">
                    Ask any question about UK legal matters, documents, or procedures. I&apos;m here to help.
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
                          <span>AI is thinking…</span>
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
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Describe your legal situation or ask a question…"
              className="min-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs text-muted-foreground">
                Press Enter to send · Shift + Enter for a new line
              </span>
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send
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
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}

