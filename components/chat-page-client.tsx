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
import type { ChatMessage, Project, SessionDocument } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Bot, FileText, Folder, FolderPlus, Loader2, Menu, MessageSquare, Paperclip, Plus, Send, Trash2, User } from "lucide-react";

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

const LOCAL_STORAGE_KEY = "legal-assistant-chat-sessions-v2";
const LEGACY_LOCAL_STORAGE_KEY = "legal-assistant-chat-sessions";
const USER_STORAGE_KEY = "legal-assistant-user-id";
const ACTIVE_PROJECT_STORAGE_KEY = "legal-assistant-active-project-id";
const DEFAULT_PROJECT_NAME = "Мои дела";

function createEmptySession(projectId: string): LocalChatSession {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: "Новый чат",
    messages: [],
    documents: [],
    createdAt: now,
    projectId,
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

  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState<boolean>(false);
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
      let storedUserId = localStorage.getItem(USER_STORAGE_KEY);
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem(USER_STORAGE_KEY, storedUserId);
      }
      setUserId(storedUserId);
    } catch (error) {
      console.error("Не удалось получить идентификатор пользователя:", error);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    const loadProjects = async () => {
      setIsProjectsLoading(true);
      try {
        const response = await fetch(`/api/projects?userId=${encodeURIComponent(userId)}`);
        let projectsPayload: Project[] = [];

        if (response.ok) {
          const data = await response.json();
          projectsPayload = Array.isArray(data?.projects) ? data.projects : [];
        }

        if (!projectsPayload.length) {
          const createResponse = await fetch(`/api/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: DEFAULT_PROJECT_NAME, userId }),
          });

          if (createResponse.ok) {
            const created = await createResponse.json();
            if (created?.project) {
              projectsPayload = [created.project as Project];
            }
          }
        }

        if (!isCancelled) {
          const enriched = projectsPayload
            .map<ProjectState>((project) => ({
              ...project,
              documents: [],
            }))
            .sort(
              (a, b) =>
                new Date(b.updated_at ?? b.created_at).getTime() -
                new Date(a.updated_at ?? a.created_at).getTime(),
            );
          setProjects(enriched);

          if (enriched.length > 0) {
            const storedActiveProject = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY) : null;
            const initialProject = storedActiveProject && enriched.some((project) => project.id === storedActiveProject)
              ? storedActiveProject
              : enriched[0].id;
            setSelectedProjectId(initialProject);
          }
        }
      } catch (error) {
        console.error("Не удалось загрузить проекты:", error);
        if (!isCancelled) {
          toast({
            variant: "destructive",
            title: "Ошибка загрузки проектов",
            description: "Попробуйте обновить страницу или повторить попытку позже.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isCancelled = true;
    };
  }, [toast, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storedSessions) {
        storedSessions = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
      }
      if (storedSessions) {
        const parsedRaw: LocalChatSession[] = JSON.parse(storedSessions);
        const parsed = parsedRaw.map<LocalChatSession>((session) => {
          const storedDocuments = Array.isArray((session as any).documents)
            ? ((session as any).documents as unknown[])
            : [];

          const normalizedDocuments = storedDocuments
            .map((document: any) => normalizeDocument(document))
            .filter((document: any): document is SessionDocument => Boolean(document));

          return {
            ...session,
            title: session.title?.trim() ? session.title : "Новый чат",
            messages: Array.isArray(session.messages) ? session.messages : [],
            documents: normalizedDocuments,
            createdAt: session.createdAt ?? new Date().toISOString(),
            projectId: session.projectId ?? "",
          };
        });
        setSessions(parsed);
        setHasInitialized(true);
        return;
      }
    } catch (error) {
      console.error("Не удалось загрузить чаты из хранилища:", error);
    }

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
    if (typeof window === "undefined") return;
    if (selectedProjectId) {
      try {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, selectedProjectId);
      } catch (error) {
        console.error("Не удалось сохранить активный проект:", error);
      }
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!hasInitialized) return;
    if (!projects.length) return;

    const fallbackProjectId = selectedProjectId ?? projects[0]?.id;
    if (!fallbackProjectId) return;

    setSessions((prev) => {
      let hasChanges = false;
      const next = prev.map((session) => {
        if (!session.projectId) {
          hasChanges = true;
          return { ...session, projectId: fallbackProjectId };
        }
        return session;
      });
      return hasChanges ? next : prev;
    });
  }, [hasInitialized, projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    let newSessionId: string | null = null;

    setSessions((prev) => {
      if (prev.some((session) => session.projectId === selectedProjectId)) {
        return prev;
      }
      const session = createEmptySession(selectedProjectId);
      newSessionId = session.id;
      return [session, ...prev];
    });

    if (newSessionId) {
      setActiveSessionId(newSessionId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const sessionsForProject = sessions.filter((session) => session.projectId === selectedProjectId);
    if (!sessionsForProject.length) {
      setActiveSessionId(null);
      return;
    }

    if (!activeSessionId || !sessionsForProject.some((session) => session.id === activeSessionId)) {
      setActiveSessionId(sessionsForProject[0].id);
    }
  }, [activeSessionId, selectedProjectId, sessions]);

  useEffect(() => {
    if (!selectedProjectId) return;
    let isCancelled = false;

    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== selectedProjectId) {
          return project;
        }
        return {
          ...project,
          documents: [],
        };
      }),
    );

    const loadDocuments = async () => {
      setIsDocumentsLoading(true);
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/documents`);
        if (response.ok) {
          const data = await response.json();
          const docs: SessionDocument[] = Array.isArray(data?.documents)
            ? (data.documents
                .map((doc: any) => normalizeDocument(doc))
                .filter((doc: any): doc is SessionDocument => Boolean(doc)) as SessionDocument[])
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            : [];

          if (!isCancelled) {
            setProjects((prev) =>
              prev.map((project) => {
                if (project.id !== selectedProjectId) {
                  return project;
                }
                return {
                  ...project,
                  documents: docs,
                };
              }),
            );
          }
        } else {
          console.error("Не удалось получить документы проекта:", await response.text());
        }
      } catch (error) {
        console.error("Ошибка при загрузке документов проекта:", error);
      } finally {
        if (!isCancelled) {
          setIsDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const projectDocuments = useMemo(
    () => activeProject?.documents ?? [],
    [activeProject],
  );
  const sessionsForActiveProject = useMemo(
    () =>
      sessions
        .filter((session) => !selectedProjectId || session.projectId === selectedProjectId)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [selectedProjectId, sessions],
  );
  const activeSession = useMemo(
    () =>
      sessions.find(
        (session) =>
          session.id === activeSessionId && (!selectedProjectId || session.projectId === selectedProjectId),
      ) ?? null,
    [activeSessionId, selectedProjectId, sessions],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId]);

  const handleNewChat = useCallback(() => {
    if (!selectedProjectId) return;
    const newSession = createEmptySession(selectedProjectId);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput("");
    setIsSidebarOpen(false);
  }, [selectedProjectId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const session = sessions.find((item) => item.id === sessionId);
    if (session?.projectId && session.projectId !== selectedProjectId) {
      setSelectedProjectId(session.projectId);
    }
    setActiveSessionId(sessionId);
    setInput("");
    setIsSidebarOpen(false);
  }, [selectedProjectId, sessions]);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      if (projectId === selectedProjectId) {
        setIsSidebarOpen(false);
        return;
      }
      setSelectedProjectId(projectId);
      setIsSidebarOpen(false);
    },
    [selectedProjectId],
  );

  const handleCreateProject = useCallback(async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Не удалось определить пользователя",
        description: "Обновите страницу и попробуйте снова.",
      });
      return;
    }

    const defaultName = `Новое дело ${projects.length + 1}`;
    const name = window.prompt("Введите название проекта", defaultName)?.trim();
    if (!name) {
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, userId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload?.error === "string" && payload.error.trim()
            ? payload.error
            : "Не удалось создать проект. Попробуйте снова.";
        throw new Error(message);
      }

      const data = await response.json();
      if (data?.project) {
        const project: ProjectState = {
          ...(data.project as Project),
          documents: [],
        };
        setProjects((prev) =>
          [project, ...prev].sort(
            (a, b) =>
              new Date(b.updated_at ?? b.created_at).getTime() -
              new Date(a.updated_at ?? a.created_at).getTime(),
          ),
        );
        setSelectedProjectId(project.id);
        toast({
          title: "Проект создан",
          description: `Папка «${project.name}» готова. Добавляйте документы и создавайте чаты.`,
        });
      }
    } catch (error) {
      console.error("Не удалось создать проект:", error);
      toast({
        variant: "destructive",
        title: "Не удалось создать проект",
        description: error instanceof Error ? error.message : "Попробуйте снова чуть позже.",
      });
    }
  }, [projects.length, toast, userId]);

  const handleAttachButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processDocumentFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!selectedProjectId || !activeSession || !fileList || fileList.length === 0) {
        return;
      }
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Не удалось определить пользователя",
          description: "Обновите страницу и попробуйте снова.",
        });
        return;
      }

      const sessionLocalId = activeSession.id;
      setIsUploadingDocument(true);

      const files = Array.from(fileList);
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", userId);

          const response = await fetch(`/api/projects/${selectedProjectId}/documents`, {
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
            content: `Документ «${normalized.name}» добавлен в контекст этого проекта.`,
          };

          setSessions((prev) =>
            prev.map((session) => {
              if (session.id !== sessionLocalId) {
                return session;
              }
              return {
                ...session,
                messages: [...session.messages, contextMessage],
              };
            }),
          );

          setProjects((prev) => {
            const next = prev.map((project) => {
              if (project.id !== selectedProjectId) {
                return project;
              }
              const existing = project.documents.some((doc) => doc.id === normalized.id);
              const updatedDocuments = existing
                ? project.documents.map((doc) => (doc.id === normalized.id ? normalized : doc))
                : [...project.documents, normalized];
              const sortedDocuments = updatedDocuments
                .slice()
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
              return {
                ...project,
                documents: sortedDocuments,
                updated_at: new Date().toISOString(),
              };
            });

            return next.sort(
              (a, b) =>
                new Date(b.updated_at ?? b.created_at).getTime() -
                new Date(a.updated_at ?? a.created_at).getTime(),
            );
          });

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
    [activeSession, selectedProjectId, setSessions, setProjects, toast, userId],
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
    async (documentId: string) => {
      if (!selectedProjectId) {
        return;
      }
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Не удалось определить пользователя",
          description: "Обновите страницу и попробуйте снова.",
        });
        return;
      }

      const removedDocument = projectDocuments.find((doc) => doc.id === documentId);

      setProjects((prev) => {
        const next = prev.map((project) => {
          if (project.id !== selectedProjectId) {
            return project;
          }
          return {
            ...project,
            documents: project.documents.filter((document) => document.id !== documentId),
            updated_at: new Date().toISOString(),
          };
        });

        return next.sort(
          (a, b) =>
            new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime(),
        );
      });

      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/documents/${documentId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message =
            typeof payload?.error === "string" && payload.error.trim()
              ? payload.error
              : "Не удалось удалить документ. Попробуйте снова.";
          throw new Error(message);
        }

        toast({
          title: "Документ удалён",
          description: "Этот документ больше не будет использоваться в ответах.",
        });
      } catch (error) {
        console.error("Ошибка при удалении документа:", error);
        if (removedDocument) {
          setProjects((prev) => {
            const next = prev.map((project) => {
              if (project.id !== selectedProjectId) {
                return project;
              }
              const restored = [...project.documents, removedDocument].sort(
                (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
              );
              return {
                ...project,
                documents: restored,
                updated_at: new Date().toISOString(),
              };
            });

            return next.sort(
              (a, b) =>
                new Date(b.updated_at ?? b.created_at).getTime() -
                new Date(a.updated_at ?? a.created_at).getTime(),
            );
          });
        }
        toast({
          variant: "destructive",
          title: "Не удалось удалить документ",
          description:
            error instanceof Error ? error.message : "Попробуйте другой файл или повторите попытку позже.",
        });
      }
    },
    [projectDocuments, selectedProjectId, setProjects, toast, userId],
  );

  const handleSendMessage = useCallback(async () => {
    if (!activeSession || isLoading) return;
    if (!selectedProjectId) {
      toast({
        variant: "destructive",
        title: "Проект не выбран",
        description: "Выберите проект или создайте новый, прежде чем отправлять сообщения.",
      });
      return;
    }
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Не удалось определить пользователя",
        description: "Обновите страницу и попробуйте снова.",
      });
      return;
    }
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
          projectId: selectedProjectId,
          userId,
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
            projectId: data.projectId ?? session.projectId ?? selectedProjectId,
          };
        }),
      );

      setProjects((prev) =>
        prev
          .map((project) =>
            project.id === (data.projectId ?? selectedProjectId)
              ? { ...project, updated_at: new Date().toISOString() }
              : project,
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at ?? b.created_at).getTime() -
              new Date(a.updated_at ?? a.created_at).getTime(),
          ),
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
  }, [activeSession, input, isLoading, selectedProjectId, toast, userId, utmQuery]);

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
          <div className="space-y-3 p-4">
            <Button onClick={handleCreateProject} className="w-full" variant="secondary">
              <FolderPlus className="mr-2 h-4 w-4" />
              Новый проект
            </Button>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground">
                <span>Проекты</span>
                {isProjectsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted",
                      project.id === selectedProjectId ? "bg-muted" : "bg-transparent",
                    )}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 truncate">
                      <div className="font-medium leading-tight">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(project.updated_at ?? project.created_at).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
                {!projects.length && !isProjectsLoading && (
                  <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                    Нет проектов. Создайте первый, чтобы начать.
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleNewChat} className="w-full" variant="outline" disabled={!selectedProjectId}>
              <Plus className="mr-2 h-4 w-4" />
              Новый чат
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-2 pb-6">
              {sessionsForActiveProject.map((session) => (
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
              {!sessionsForActiveProject.length && (
                <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                  В этом проекте пока нет чатов.
                </div>
              )}
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
            <div className="flex flex-col">
              <h1 className="text-base font-semibold md:text-lg">{activeSession?.title ?? "Новый чат"}</h1>
              {activeProject ? (
                <span className="text-xs text-muted-foreground md:text-sm">{activeProject.name}</span>
              ) : null}
            </div>
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

            {projectDocuments.length ? (
              <Card className="border-dashed">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Документы проекта</span>
                    {isDocumentsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="space-y-2">
                    {projectDocuments.map((document) => (
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
                          disabled={isUploadingDocument || isDocumentsLoading}
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
                    disabled={isUploadingDocument || !selectedProjectId || !userId}
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

