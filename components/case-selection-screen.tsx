"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateCaseDialog } from "@/components/create-case-dialog";
import { RenameProjectDialog } from "@/components/rename-project-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bot, FileText, FolderPlus, Loader2, MessageSquare, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, SessionDocument } from "@/lib/types";

type ProjectState = Project & {
  documents: SessionDocument[];
};

type LocalChatSession = {
  id: string;
  title: string;
  projectId: string;
  createdAt: string;
};

interface CaseSelectionScreenProps {
  projects: ProjectState[];
  sessions: LocalChatSession[];
  isLoading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function CaseSelectionScreen({
  projects,
  sessions,
  isLoading,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: CaseSelectionScreenProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectState | null>(null);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCreateProject = (name: string) => {
    onCreateProject(name);
  };

  const handleOpenRenameDialog = (project: ProjectState, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsRenameDialogOpen(true);
  };

  const handleOpenDeleteAlert = (project: ProjectState, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsDeleteAlertOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (selectedProject) {
      onRenameProject(selectedProject.id, newName);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
      onDeleteProject(selectedProject.id);
      setIsDeleteAlertOpen(false);
      setSelectedProject(null);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectSessions = sessions.filter((s) => s.projectId === projectId);
    const project = projects.find((p) => p.id === projectId);
    const documentCount = project?.documents.length ?? 0;
    const chatCount = projectSessions.length;

    return { documentCount, chatCount };
  };

  return (
    <div className="flex min-h-screen flex-col retro-workspace">
      <header className="retro-workspace-header">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6" style={{ color: '#982525' }} />
            <h1 className="retro-workspace h1">ДЖИХЕЛПЕР</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="retro-workspace h2">МОИ ДЕЛА</h2>
              <p className="mt-2" style={{ color: '#666', fontFamily: "'Courier New', 'Monaco', monospace" }}>
                Выберите дело для работы или создайте новое
              </p>
            </div>
            <button onClick={handleOpenDialog} className="retro-workspace-button gap-2 shrink-0 flex items-center">
              <FolderPlus className="h-5 w-5" />
              СОЗДАТЬ НОВОЕ ДЕЛО
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="retro-workspace-card border-dashed">
              <div className="retro-workspace-empty">
                <div className="rounded-full p-6" style={{ background: '#f0f0eb', display: 'inline-block' }}>
                  <FolderPlus className="h-12 w-12" style={{ color: '#982525' }} />
                </div>
                <h3 className="retro-workspace h3">НЕТ ДЕЛ</h3>
                <p>
                  Создайте первое дело, чтобы начать загружать документы и общаться с AI-помощником
                </p>
                <button onClick={handleOpenDialog} className="retro-workspace-button mt-6 gap-2 flex items-center">
                  <FolderPlus className="h-4 w-4" />
                  СОЗДАТЬ ПЕРВОЕ ДЕЛО
                </button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                {projects.map((project) => {
                  const stats = getProjectStats(project.id);
                  const lastUpdate = new Date(project.updated_at ?? project.created_at);

                  return (
                    <div
                      key={project.id}
                      className="retro-workspace-card group flex flex-col"
                      onClick={() => onSelectProject(project.id)}
                      style={{ minHeight: '200px' }}
                    >
                      <div className="p-6 flex flex-col flex-1" style={{ minHeight: 0 }}>
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="rounded-lg p-2 shrink-0" style={{ background: '#f0f0eb' }}>
                            <Bot className="h-5 w-5" style={{ color: '#982525' }} />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Открыть меню</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => handleOpenRenameDialog(project, e)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Переименовать
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleOpenDeleteAlert(project, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="retro-workspace h3 mb-3 leading-tight" style={{ fontFamily: "'Courier New', 'Monaco', monospace", fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', color: '#000' }}>
                          {project.name.toUpperCase()}
                        </h3>
                        <div className="flex flex-col flex-1 space-y-2" style={{ color: '#666', fontFamily: "'Courier New', 'Monaco', monospace", fontSize: '0.85rem' }}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0" style={{ color: '#982525' }} />
                            <span>
                              {stats.documentCount}{" "}
                              {stats.documentCount === 1
                                ? "документ"
                                : stats.documentCount < 5
                                ? "документа"
                                : "документов"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 shrink-0" style={{ color: '#982525' }} />
                            <span>
                              {stats.chatCount}{" "}
                              {stats.chatCount === 1
                                ? "чат"
                                : stats.chatCount < 5
                                ? "чата"
                                : "чатов"}
                            </span>
                          </div>
                          <div className="mt-auto pt-3 border-t" style={{ borderTop: '1px solid #000', marginTop: 'auto' }}>
                            <span className="text-xs" style={{ fontFamily: "'Courier New', 'Monaco', monospace" }}>
                              Обновлено: {lastUpdate.toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </main>

      <CreateCaseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleCreateProject}
        defaultName={`Новое дело ${projects.length + 1}`}
      />

      <RenameProjectDialog
        open={isRenameDialogOpen}
        currentName={selectedProject?.name ?? ""}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={handleRenameConfirm}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект &quot;{selectedProject?.name}&quot; и все его
              документы и чаты будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

