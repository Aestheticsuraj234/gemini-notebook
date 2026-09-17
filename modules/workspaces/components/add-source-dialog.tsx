"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CloudUploadIcon,
  File01Icon,
  Globe02Icon,
  Link01Icon,
  Note01Icon,
  Pdf01Icon,
  Txt01Icon,
} from "@hugeicons/core-free-icons";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MAX_UPLOAD_BYTES, SUPPORTED_FILE_EXTENSIONS } from "@/lib/limit";
import { cn } from "@/lib/utils";

export type SourceTab = "text" | "files" | "website";

type SelectedFile = {
  id: string;
  file: File;
  error: string | null;
};

type AddSourceDialogProps = {
  open: boolean;
  saving: boolean;
  remainingSlots: number;
  defaultTab?: SourceTab;
  onOpenChange: (open: boolean) => void;
  onCreateText: (title: string, text: string) => Promise<boolean>;
  onCreateFiles: (files: File[]) => Promise<boolean>;
  onCreateWebsite: (url: string, title?: string) => Promise<boolean>;
};

const FILE_ACCEPT = SUPPORTED_FILE_EXTENSIONS.join(",");
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

export default function AddSourceDialog({
  open,
  saving,
  remainingSlots,
  defaultTab = "text",
  onOpenChange,
  onCreateText,
  onCreateFiles,
  onCreateWebsite,
}: AddSourceDialogProps) {
  const [tab, setTab] = useState<SourceTab>(defaultTab);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
    }
  }, [open, defaultTab]);

  function resetForms() {
    setTitle("");
    setText("");
    setSelectedFiles([]);
    setDragging(false);
    dragDepth.current = 0;
    setUrl("");
    setWebsiteTitle("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeDialog() {
    if (saving) {
      return;
    }
    resetForms();
    onOpenChange(false);
  }

  async function handleTextSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextText = text.trim();
    if (!nextTitle || !nextText) {
      return;
    }

    const created = await onCreateText(nextTitle, nextText);
    if (created) {
      closeDialog();
    }
  }

  async function handleFilesSubmit(event: React.FormEvent) {
    event.preventDefault();
    const files = selectedFiles.filter((item) => !item.error).map((item) => item.file);
    if (files.length === 0) {
      return;
    }

    const created = await onCreateFiles(files);
    if (created) {
      closeDialog();
    }
  }

  async function handleWebsiteSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextUrl = normalizeWebsiteUrl(url);
    if (!nextUrl) {
      return;
    }

    const created = await onCreateWebsite(nextUrl, websiteTitle.trim() || undefined);
    if (created) {
      closeDialog();
    }
  }

  function addFiles(incoming: File[]) {
    if (remainingSlots <= 0) {
      toast.error("This workspace is at the source limit");
      return;
    }

    const existingIds = new Set(selectedFiles.map((item) => item.id));
    let remaining = remainingSlots - selectedFiles.filter((item) => !item.error).length;
    const next = [...selectedFiles];
    let skipped = 0;

    for (const file of incoming) {
      const id = fileKey(file);
      if (existingIds.has(id)) {
        continue;
      }

      const error = validateFile(file);
      if (!error) {
        if (remaining <= 0) {
          skipped += 1;
          continue;
        }
        remaining -= 1;
      }

      existingIds.add(id);
      next.push({ id, file, error });
    }

    if (skipped > 0) {
      toast.error(`You can add ${remainingSlots} more source${remainingSlots === 1 ? "" : "s"}`);
    }

    setSelectedFiles(next);
  }

  const validFiles = selectedFiles.filter((item) => !item.error);
  const canSubmitFiles = validFiles.length > 0 && remainingSlots > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (saving) {
          return;
        }
        if (!nextOpen) {
          closeDialog();
          return;
        }
        onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add a source</DialogTitle>
          <DialogDescription>
            Paste notes, upload a file, or add a public webpage.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as SourceTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="text">
              <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
              Text
            </TabsTrigger>
            <TabsTrigger value="files">
              <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
              Files
            </TabsTrigger>
            <TabsTrigger value="website">
              <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
              Website
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="pt-4">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="source-title">Title</FieldLabel>
                  <Input
                    id="source-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Lecture notes"
                    disabled={saving}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="source-text">Text</FieldLabel>
                  <Textarea
                    id="source-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Paste the notes you want this notebook to learn from..."
                    className="min-h-40 field-sizing-fixed"
                    disabled={saving}
                    required
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !title.trim() || !text.trim()}>
                  {saving ? "Adding..." : "Add text source"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="files" className="pt-4">
            <form onSubmit={handleFilesSubmit} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                multiple
                className="sr-only"
                disabled={saving || remainingSlots <= 0}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />

              <FieldGroup>
                <Field>
                  <FieldLabel>Files</FieldLabel>
                  <button
                    type="button"
                    disabled={saving || remainingSlots <= 0}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      dragDepth.current += 1;
                      setDragging(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      dragDepth.current = Math.max(0, dragDepth.current - 1);
                      if (dragDepth.current === 0) {
                        setDragging(false);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      dragDepth.current = 0;
                      setDragging(false);
                      addFiles(Array.from(event.dataTransfer.files));
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 border border-dashed px-4 py-7 text-center transition-colors",
                      dragging
                        ? "border-foreground/40 bg-muted/50"
                        : "bg-muted/20 hover:bg-muted/40",
                      (saving || remainingSlots <= 0) && "pointer-events-none opacity-50",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center bg-muted text-muted-foreground">
                      <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">
                        {dragging ? "Drop to add files" : "Drop files here"}
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        or click to browse · up to {MAX_UPLOAD_MB.toFixed(0)} MB each
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {["PDF", "DOCX", "MD", "TXT"].map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </button>
                  <FieldDescription>
                    {remainingSlots <= 0
                      ? "This workspace is at the source limit."
                      : `${remainingSlots} source${remainingSlots === 1 ? "" : "s"} remaining in this notebook.`}
                  </FieldDescription>
                </Field>

                {selectedFiles.length > 0 ? (
                  <Field>
                    <div className="flex flex-col gap-1.5">
                      {selectedFiles.map((item) => (
                        <Attachment
                          key={item.id}
                          className="w-full max-w-none"
                          state={item.error ? "error" : "done"}
                        >
                          <AttachmentMedia>
                            <HugeiconsIcon
                              icon={fileIcon(item.file.name)}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle>{item.file.name}</AttachmentTitle>
                            <AttachmentDescription>
                              {item.error ?? formatBytes(item.file.size)}
                            </AttachmentDescription>
                          </AttachmentContent>
                          <AttachmentActions>
                            <AttachmentAction
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                setSelectedFiles((current) =>
                                  current.filter((file) => file.id !== item.id),
                                )
                              }
                            >
                              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                              <span className="sr-only">Remove {item.file.name}</span>
                            </AttachmentAction>
                          </AttachmentActions>
                        </Attachment>
                      ))}
                    </div>
                  </Field>
                ) : null}
              </FieldGroup>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !canSubmitFiles}>
                  {saving
                    ? "Uploading..."
                    : validFiles.length <= 1
                      ? "Upload file"
                      : `Upload ${validFiles.length} files`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="website" className="pt-4">
            <form onSubmit={handleWebsiteSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="source-url">URL</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5" />
                    </InputGroupAddon>
                    <InputGroupInput
                      id="source-url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="example.com/article"
                      inputMode="url"
                      autoComplete="url"
                      disabled={saving}
                      required
                    />
                  </InputGroup>
                  <FieldDescription>Public HTTPS pages only. Local and private URLs are blocked.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="website-title">Title</FieldLabel>
                  <Input
                    id="website-title"
                    value={websiteTitle}
                    onChange={(event) => setWebsiteTitle(event.target.value)}
                    placeholder="Optional · we’ll use the page title if empty"
                    disabled={saving}
                    maxLength={100}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || remainingSlots <= 0 || !url.trim()}>
                  {saving ? "Scraping..." : "Add website"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function validateFile(file: File) {
  const lower = file.name.toLowerCase();
  if (!SUPPORTED_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
    return "Use TXT, Markdown, PDF, or DOCX";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Exceeds ${MAX_UPLOAD_MB.toFixed(0)} MB`;
  }
  return null;
}

function fileIcon(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return Pdf01Icon;
  }
  if (lower.endsWith(".txt")) {
    return Txt01Icon;
  }
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    return Note01Icon;
  }
  return File01Icon;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
