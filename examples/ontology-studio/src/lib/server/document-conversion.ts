import { createRequire } from "node:module";
import { basename, dirname, extname, join } from "node:path";
import type { TextItem } from "pdfjs-dist/types/src/display/api.js";

const _require = createRequire(import.meta.url);
const pdfJsRoot = dirname(_require.resolve("pdfjs-dist/package.json"));
const standardFontDataUrl = join(pdfJsRoot, "standard_fonts") + "/";

export const supportedDocumentExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".pdf"]);
export const supportedDocumentMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "text/html",
  "application/pdf",
  "application/octet-stream",
]);

export class DocumentConversionError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "DocumentConversionError";
    this.statusCode = statusCode;
  }
}

export async function convertDocumentToMarkdown(id: string, content: Buffer): Promise<string> {
  const extension = extname(id).toLocaleLowerCase("en");
  const text = extension === ".pdf"
    ? await convertPdfToMarkdown(id, content)
    : decodeUtf8Document(id, content);
  if (text.trim().length === 0) {
    throw new DocumentConversionError(400, `Document is empty: ${basename(id)}`);
  }
  return text;
}

function decodeUtf8Document(id: string, content: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(content);
  } catch {
    throw new DocumentConversionError(400, `Document is not valid UTF-8: ${basename(id)}`);
  }
}

async function convertPdfToMarkdown(id: string, content: Buffer): Promise<string> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = getDocument({ data: new Uint8Array(content), disableFontFace: true, standardFontDataUrl });
  try {
    const pdf = await loadingTask.promise;
    const sections = [`# ${basename(id)} converted from PDF`];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const contentItems = await page.getTextContent();
      const pageText = textItemsToMarkdown(
        contentItems.items.filter((item): item is TextItem => "str" in item)
      );
      if (pageText.length > 0) {
        sections.push(`## Page ${pageNumber}\n\n${pageText}`);
      }
      page.cleanup();
    }
    return sections.join("\n\n");
  } catch (error) {
    if (error instanceof DocumentConversionError) throw error;
    throw new DocumentConversionError(400, `Could not read PDF document: ${basename(id)}`);
  } finally {
    await loadingTask.destroy();
  }
}

function textItemsToMarkdown(items: TextItem[]): string {
  const lines: string[] = [];
  let line = "";
  for (const item of items) {
    const value = item.str.trim();
    if (value.length > 0) {
      line = line.length === 0 ? value : `${line} ${value}`;
    }
    if (item.hasEOL && line.length > 0) {
      lines.push(line);
      line = "";
    }
  }
  if (line.length > 0) lines.push(line);
  return lines.join("\n\n");
}
