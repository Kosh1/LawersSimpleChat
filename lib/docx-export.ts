import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

export interface ExportMessageOptions {
  projectName: string;
  aiResponse: string;
  timestamp: Date;
  sessionTitle?: string;
}

/**
 * Token types for markdown parsing
 */
type TokenType = 'text' | 'bold' | 'italic' | 'boldItalic' | 'code';

interface Token {
  type: TokenType;
  content: string;
}

/**
 * Parses inline markdown formatting (bold, italic, code) and returns tokens
 */
function parseInlineMarkdown(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let currentText = '';

  while (i < text.length) {
    // Check for code (backticks) - highest priority
    if (text[i] === '`') {
      if (currentText) {
        tokens.push({ type: 'text', content: currentText });
        currentText = '';
      }
      const codeEnd = text.indexOf('`', i + 1);
      if (codeEnd !== -1) {
        tokens.push({ type: 'code', content: text.substring(i + 1, codeEnd) });
        i = codeEnd + 1;
        continue;
      }
    }

    // Check for bold+italic (***text*** or ___text___)
    if (i + 2 < text.length && 
        ((text[i] === '*' && text[i + 1] === '*' && text[i + 2] === '*') ||
         (text[i] === '_' && text[i + 1] === '_' && text[i + 2] === '_'))) {
      if (currentText) {
        tokens.push({ type: 'text', content: currentText });
        currentText = '';
      }
      const marker = text.substring(i, i + 3);
      const endIndex = text.indexOf(marker, i + 3);
      if (endIndex !== -1) {
        tokens.push({ type: 'boldItalic', content: text.substring(i + 3, endIndex) });
        i = endIndex + 3;
        continue;
      }
    }

    // Check for bold (**text** or __text__)
    if (i + 1 < text.length && 
        ((text[i] === '*' && text[i + 1] === '*') ||
         (text[i] === '_' && text[i + 1] === '_'))) {
      if (currentText) {
        tokens.push({ type: 'text', content: currentText });
        currentText = '';
      }
      const marker = text.substring(i, i + 2);
      const endIndex = text.indexOf(marker, i + 2);
      if (endIndex !== -1) {
        tokens.push({ type: 'bold', content: text.substring(i + 2, endIndex) });
        i = endIndex + 2;
        continue;
      }
    }

    // Check for italic (*text* or _text_) - but not if it's part of bold
    if (text[i] === '*' || text[i] === '_') {
      // Make sure it's not part of a longer marker
      if (i + 1 >= text.length || 
          (text[i + 1] !== '*' && text[i + 1] !== '_')) {
        if (currentText) {
          tokens.push({ type: 'text', content: currentText });
          currentText = '';
        }
        const marker = text[i];
        const endIndex = text.indexOf(marker, i + 1);
        if (endIndex !== -1) {
          tokens.push({ type: 'italic', content: text.substring(i + 1, endIndex) });
          i = endIndex + 1;
          continue;
        }
      }
    }

    currentText += text[i];
    i++;
  }

  if (currentText) {
    tokens.push({ type: 'text', content: currentText });
  }

  return tokens;
}

/**
 * Converts markdown tokens to Word TextRun elements
 */
function tokensToTextRuns(tokens: Token[]): TextRun[] {
  return tokens.map(token => {
    switch (token.type) {
      case 'bold':
        return new TextRun({
          text: token.content,
          bold: true,
        });
      case 'italic':
        return new TextRun({
          text: token.content,
          italics: true,
        });
      case 'boldItalic':
        return new TextRun({
          text: token.content,
          bold: true,
          italics: true,
        });
      case 'code':
        return new TextRun({
          text: token.content,
          font: 'Courier New',
          size: 20, // Slightly smaller for code
        });
      default:
        return new TextRun({
          text: token.content,
        });
    }
  });
}

/**
 * Parses markdown content and converts it to Word Paragraph elements
 */
function parseMarkdownToParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Split by double newlines to get paragraphs
  const blocks = content.split(/\n\n+/);
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Check for headers
    const headerMatch = trimmedBlock.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const tokens = parseInlineMarkdown(text);
      const textRuns = tokensToTextRuns(tokens);
      
      let headingLevel;
      switch (level) {
        case 1: headingLevel = HeadingLevel.HEADING_1; break;
        case 2: headingLevel = HeadingLevel.HEADING_2; break;
        case 3: headingLevel = HeadingLevel.HEADING_3; break;
        case 4: headingLevel = HeadingLevel.HEADING_4; break;
        case 5: headingLevel = HeadingLevel.HEADING_5; break;
        case 6: headingLevel = HeadingLevel.HEADING_6; break;
        default: headingLevel = HeadingLevel.HEADING_1;
      }
      
      paragraphs.push(new Paragraph({
        children: textRuns,
        heading: headingLevel,
        spacing: { after: 200 },
      }));
      continue;
    }

    // Check for unordered list items
    if (trimmedBlock.startsWith('- ') || trimmedBlock.startsWith('* ')) {
      const lines = trimmedBlock.split('\n');
      for (const line of lines) {
        const listMatch = line.match(/^[-*]\s+(.+)$/);
        if (listMatch) {
          const text = listMatch[1];
          const tokens = parseInlineMarkdown(text);
          const textRuns = tokensToTextRuns(tokens);
          
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              ...textRuns,
            ],
            spacing: { after: 100 },
            indent: { left: 400 },
          }));
        }
      }
      continue;
    }

    // Check for ordered list items
    const orderedListMatch = trimmedBlock.match(/^\d+\.\s+/);
    if (orderedListMatch) {
      const lines = trimmedBlock.split('\n');
      let counter = 1;
      for (const line of lines) {
        const listMatch = line.match(/^\d+\.\s+(.+)$/);
        if (listMatch) {
          const text = listMatch[1];
          const tokens = parseInlineMarkdown(text);
          const textRuns = tokensToTextRuns(tokens);
          
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({ text: `${counter}. `, bold: true }),
              ...textRuns,
            ],
            spacing: { after: 100 },
            indent: { left: 400 },
          }));
          counter++;
        }
      }
      continue;
    }

    // Check for code block (triple backticks)
    if (trimmedBlock.startsWith('```')) {
      const codeBlockMatch = trimmedBlock.match(/^```(?:\w+)?\n([\s\S]*?)```$/);
      if (codeBlockMatch) {
        const code = codeBlockMatch[1];
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: code,
              font: 'Courier New',
              size: 20,
            }),
          ],
          spacing: { after: 200 },
          shading: { fill: 'F5F5F5' },
        }));
        continue;
      }
    }

    // Check for blockquote
    if (trimmedBlock.startsWith('> ')) {
      const lines = trimmedBlock.split('\n');
      const quoteText = lines
        .map(line => line.replace(/^>\s*/, ''))
        .join(' ');
      const tokens = parseInlineMarkdown(quoteText);
      const textRuns = tokensToTextRuns(tokens);
      
      paragraphs.push(new Paragraph({
        children: textRuns,
        spacing: { after: 200 },
        indent: { left: 400 },
        border: { left: { size: 4, color: 'CCCCCC', style: 'single' } },
      }));
      continue;
    }

    // Regular paragraph - split by single newlines and process each line
    const lines = trimmedBlock.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const tokens = parseInlineMarkdown(line);
      const textRuns = tokensToTextRuns(tokens);
      
      paragraphs.push(new Paragraph({
        children: textRuns,
        spacing: { after: i === lines.length - 1 ? 200 : 100 },
      }));
    }
  }

  return paragraphs;
}

/**
 * Создает DOCX документ с ответом AI
 */
export function generateResponseDocument(options: ExportMessageOptions): Document {
  const { projectName, aiResponse, timestamp, sessionTitle } = options;

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
              after: 300,
            },
          }),

          // Текст ответа (парсим markdown и конвертируем в форматированные параграфы)
          ...parseMarkdownToParagraphs(aiResponse),

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

