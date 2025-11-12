import { useCallback } from "react";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import { generateResponseDocument, generateFileName } from "@/lib/docx-export";
import type { ExportMessageOptions } from "@/lib/docx-export";

/**
 * Хук для экспорта сообщений AI в формате DOCX
 */
export function useExportMessage() {
  const exportMessage = useCallback(async (options: ExportMessageOptions) => {
    try {
      // Генерируем документ
      const doc = generateResponseDocument(options);

      // Конвертируем в blob
      const blob = await Packer.toBlob(doc);

      // Генерируем имя файла
      const fileName = generateFileName(
        options.sessionTitle || "Ответ помощника",
        options.timestamp
      );

      // Скачиваем файл
      saveAs(blob, fileName);

      return { success: true };
    } catch (error) {
      console.error("Ошибка при экспорте сообщения:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }, []);

  return { exportMessage };
}

