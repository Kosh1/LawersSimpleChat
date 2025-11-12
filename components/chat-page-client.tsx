"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { CaseSelectionScreen } from "@/components/case-selection-screen";
import { CaseWorkspace } from "@/components/case-workspace";
import type { ChatMessage, Project, SessionDocument } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useExportMessage } from "@/hooks/use-export-message";

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
  const [isInWorkspace, setIsInWorkspace] = useState<boolean>(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState<boolean>(false);
  const [sessions, setSessions] = useState<LocalChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const { toast } = useToast();
  const { exportMessage } = useExportMessage();

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


  const handleNewChat = useCallback(() => {
    if (!selectedProjectId) return;
    const newSession = createEmptySession(selectedProjectId);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput("");
  }, [selectedProjectId]);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setInput("");
  }, []);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setIsInWorkspace(true);
    },
    [],
  );

  const handleBackToSelection = useCallback(() => {
    setIsInWorkspace(false);
    setSelectedProjectId(null);
  }, []);

  const handleCreateProject = useCallback(async (name: string) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Не удалось определить пользователя",
        description: "Обновите страницу и попробуйте снова.",
      });
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, userId }),
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
        setIsInWorkspace(true);
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
  }, [setProjects, toast, userId]);

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

  const handleExportMessage = useCallback(
    async (messageIndex: number) => {
      if (!activeSession || !activeProject) return;

      const message = activeSession.messages[messageIndex];
      if (!message || message.role !== "assistant") {
        toast({
          variant: "destructive",
          title: "Ошибка экспорта",
          description: "Можно экспортировать только ответы помощника.",
        });
        return;
      }

      // Найдем предыдущий вопрос пользователя
      let userQuestion = "";
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (activeSession.messages[i].role === "user") {
          userQuestion = activeSession.messages[i].content;
          break;
        }
      }

      if (!userQuestion) {
        userQuestion = "Вопрос не найден";
      }

      const result = await exportMessage({
        projectName: activeProject.name,
        sessionTitle: activeSession.title,
        userQuestion,
        aiResponse: message.content,
        timestamp: new Date(),
      });

      if (result.success) {
        toast({
          title: "Документ создан",
          description: "Ответ успешно экспортирован в формате DOCX.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка экспорта",
          description: result.error || "Не удалось создать документ.",
        });
      }
    },
    [activeSession, activeProject, exportMessage, toast]
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
      
      // Логируем метаданные AI ответа
      if (data.metadata) {
        console.log('[AI Response]', {
          model: data.metadata.modelUsed,
          fallback: data.metadata.fallbackOccurred,
          chunks: data.metadata.chunksCount,
          tokens: data.metadata.totalTokens,
          time: `${data.metadata.responseTimeMs}ms`
        });
        
        // Показываем уведомление если было несколько chunks
        if (data.metadata.chunksCount > 1) {
          console.info(`✨ Ответ был сгенерирован в ${data.metadata.chunksCount} частей для обеспечения полноты`);
        }
        
        // Показываем уведомление если был fallback
        if (data.metadata.fallbackOccurred) {
          console.warn(`⚠️ Была использована резервная модель из-за: ${data.metadata.fallbackReason}`);
        }
      }
      
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

  // Render appropriate screen based on navigation state
  if (!isInWorkspace || !selectedProjectId) {
  return (
      <CaseSelectionScreen
        projects={projects}
        sessions={sessions}
        isLoading={isProjectsLoading}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
      />
    );
  }

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  if (!currentProject) {
    return null;
  }

  const currentProjectSessions = sessions.filter((s) => s.projectId === selectedProjectId);

  return (
    <CaseWorkspace
      project={currentProject}
      sessions={currentProjectSessions}
      activeSessionId={activeSessionId}
      input={input}
      isLoading={isLoading}
      isUploadingDocument={isUploadingDocument}
      isDocumentsLoading={isDocumentsLoading}
      onBack={handleBackToSelection}
      onSelectSession={handleSelectSession}
      onNewChat={handleNewChat}
      onInputChange={setInput}
      onSendMessage={handleSendMessage}
      onAttachDocument={processDocumentFiles}
      onRemoveDocument={handleRemoveDocument}
      onExportMessage={handleExportMessage}
    />
  );
}