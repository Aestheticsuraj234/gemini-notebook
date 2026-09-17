export const MAX_SOURCES_PER_WORKSPACE = 5;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const SUPPORTED_FILE_EXTENSIONS = [".txt", ".md", ".markdown", ".pdf", ".docx"] as const;

export type SupportedFileExtension = (typeof SUPPORTED_FILE_EXTENSIONS)[number];
