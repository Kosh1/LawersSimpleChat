declare module 'pdf-parse' {
  export interface PdfParseOptions {
    max?: number;
    pagerender?: (pageData: unknown) => Promise<string> | string;
    version?: string;
  }

  export interface PdfParseResult {
    pdfInfo?: Record<string, unknown>;
    info?: Record<string, unknown>;
    metadata?: unknown;
    text: string;
    numpages: number;
    numrender: number;
    version?: string;
  }

  export default function pdfParse(
    data: Buffer | ArrayBuffer | Uint8Array,
    options?: PdfParseOptions
  ): Promise<PdfParseResult>;
}

