"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-xl font-bold">AI-юрист</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Мои дела</h2>
              <p className="mt-2 text-muted-foreground">
                Выберите дело для работы или создайте новое
              </p>
            </div>
            <Button onClick={handleOpenDialog} size="lg" variant="secondary" className="gap-2">
              <FolderPlus className="h-5 w-5" />
              Создать новое дело
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-6">
                  <FolderPlus className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">Нет дел</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Создайте первое дело, чтобы начать загружать документы и общаться с AI-помощником
                </p>
                <Button onClick={handleOpenDialog} variant="secondary" className="mt-6 gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Создать первое дело
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => {
                  const stats = getProjectStats(project.id);
                  const lastUpdate = new Date(project.updated_at ?? project.created_at);

                  return (
                    <Card
                      key={project.id}
                      className={cn(
                        "group cursor-pointer transition-all hover:border-foreground/20 hover:shadow-md",
                      )}
                      onClick={() => onSelectProject(project.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-4 flex items-center justify-between gap-2">
                              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                <Bot className="h-5 w-5" />
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
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
                            <h3 className="mb-2 text-lg font-semibold leading-tight">
                              {project.name}
                            </h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
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
                                <MessageSquare className="h-4 w-4" />
                                <span>
                                  {stats.chatCount}{" "}
                                  {stats.chatCount === 1
                                    ? "чат"
                                    : stats.chatCount < 5
                                    ? "чата"
                                    : "чатов"}
                                </span>
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <span className="text-xs">
                                  Обновлено: {lastUpdate.toLocaleDateString("ru-RU")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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

