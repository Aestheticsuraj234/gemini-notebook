import mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { MAX_UPLOAD_BYTES, SUPPORTED_FILE_EXTENSIONS, type SupportedFileExtension } from "@/lib/limit"

export class SourceExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceExtractionError";
  }
}

function getFileExtension(filename: string): SupportedFileExtension | null {
  const lower = filename.toLowerCase();
  for (const extension of SUPPORTED_FILE_EXTENSIONS) {
    if (lower.endsWith(extension)) {
      return extension;
    }
  }
  return null;
}

function normalizeExtractedText(text: string) {
  const trimmed = text.replace(/\u0000/g, "").trim();
  if (!trimmed) {
    throw new SourceExtractionError("No selectable text found");
  }
  return trimmed;
}

function titleFromFilename(filename: string) {
  const extension = getFileExtension(filename);
  if (!extension) {
    return filename;
  }
  return filename.slice(0, -extension.length) || filename;
}

async function extractPdfText(buffer: Buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const parts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    parts.push(`--- Page ${pageNumber} ---\n${pageText}`);
  }

  return parts.join("\n\n");
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractFileSource(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new SourceExtractionError(
      `File exceeds ${(MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0)} MB. Upload a smaller file.`,
    );
  }

  const extension = getFileExtension(file.name);
  if (!extension) {
    throw new SourceExtractionError("Unsupported file type. Use TXT, Markdown, PDF, or DOCX.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  switch (extension) {
    case ".txt":
    case ".md":
    case ".markdown":
      extractedText = buffer.toString("utf8");
      break;
    case ".pdf":
      extractedText = await extractPdfText(buffer);
      break;
    case ".docx":
      extractedText = await extractDocxText(buffer);
      break;
  }

  return {
    title: titleFromFilename(file.name),
    extractedText: normalizeExtractedText(extractedText),
  };
}
