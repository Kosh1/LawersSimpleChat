"use client";

import { useEffect, useState } from "react";
import { Brain, Clock } from "lucide-react";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  thinkingTime?: number; // Время размышления в секундах (показываем после завершения)
  modelName?: string;
}

export function ThinkingIndicator({ isThinking, thinkingTime, modelName }: ThinkingIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isThinking]);

  // Форматируем время
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}с`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  // Если показываем результат размышления (после завершения)
  if (thinkingTime && !isThinking) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Brain className="h-3.5 w-3.5" />
        <span>
          Я подумал {formatTime(thinkingTime)}
          {modelName && (
            <span className="ml-1 opacity-70">
              ({modelName})
            </span>
          )}
        </span>
      </div>
    );
  }

  // Показываем процесс размышления
  if (isThinking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Brain className="h-4 w-4 animate-pulse text-primary" />
        <span className="font-medium">Думаю</span>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    );
  }

  return null;
}

