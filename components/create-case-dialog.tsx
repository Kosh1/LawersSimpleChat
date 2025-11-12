"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string) => void;
  defaultName: string;
}

export function CreateCaseDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultName,
}: CreateCaseDialogProps) {
  const [name, setName] = useState(defaultName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onConfirm(trimmedName);
      onOpenChange(false);
      setName("");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Создать новое дело
          </DialogTitle>
          <DialogDescription>
            Введите название для нового юридического дела. Вы сможете добавить документы и создать чаты после
            создания.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="case-name">Название дела</Label>
              <Input
                id="case-name"
                placeholder="Например: Налоговая проверка ООО Рога и Копыта"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Создать дело
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

