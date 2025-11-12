import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

export interface ExportMessageOptions {
  projectName: string;
  userQuestion: string;
  aiResponse: string;
  timestamp: Date;
  sessionTitle?: string;
}

/**
 * Создает DOCX документ с ответом AI
 */
export function generateResponseDocument(options: ExportMessageOptions): Document {
  const { projectName, userQuestion, aiResponse, timestamp, sessionTitle } = options;

  // Форматируем дату и время
  const formattedDate = timestamp.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = timestamp.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Заголовок документа - название проекта
          new Paragraph({
            text: projectName,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
          }),

          // Название чата (если есть)
          ...(sessionTitle
            ? [
                new Paragraph({
                  text: sessionTitle,
                  heading: HeadingLevel.HEADING_2,
                  alignment: AlignmentType.CENTER,
                  spacing: {
                    after: 200,
                  },
                }),
              ]
            : []),

          // Дата и время
          new Paragraph({
            children: [
              new TextRun({
                text: `Дата: ${formattedDate} в ${formattedTime}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: {
              after: 300,
            },
          }),

          // Разделительная линия
          new Paragraph({
            text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            spacing: {
              after: 200,
            },
          }),

          // Заголовок "Вопрос"
          new Paragraph({
            text: "Вопрос:",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),

          // Текст вопроса
          new Paragraph({
            text: userQuestion,
            spacing: {
              after: 300,
            },
          }),

          // Заголовок "Ответ"
          new Paragraph({
            text: "Ответ юридического помощника:",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),

          // Текст ответа (разбиваем на параграфы по переносам строк)
          ...aiResponse.split("\n\n").map(
            (paragraph) =>
              new Paragraph({
                text: paragraph.trim(),
                spacing: {
                  after: 200,
                },
              })
          ),

          // Подвал документа
          new Paragraph({
            text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            spacing: {
              before: 300,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Внимание: ",
                bold: true,
                size: 20,
              }),
              new TextRun({
                text: "Этот документ создан с помощью AI-помощника и носит информационный характер. Рекомендуется проконсультироваться с квалифицированным юристом.",
                italics: true,
                size: 20,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),
        ],
      },
    ],
  });

  return doc;
}

/**
 * Генерирует имя файла для экспорта
 */
export function generateFileName(sessionTitle: string, timestamp: Date): string {
  const dateStr = timestamp.toLocaleDateString("ru-RU").replace(/\./g, "-");
  const timeStr = timestamp.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/:/g, "-");
  
  // Очищаем название от недопустимых символов
  const cleanTitle = sessionTitle
    .replace(/[<>:"/\\|?*]/g, "")
    .trim()
    .slice(0, 30);
  
  return `${cleanTitle}_${dateStr}_${timeStr}.docx`;
}

