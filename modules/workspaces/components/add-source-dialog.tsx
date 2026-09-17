"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Globe02Icon,
  Note01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type AddSourceDialogProps = {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateText: (title: string, text: string) => Promise<boolean>;
};

export default function AddSourceDialog({
  open,
  saving,
  onOpenChange,
  onCreateText,
}: AddSourceDialogProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  function closeDialog() {
    setTitle("");
    setText("");
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent) {
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
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
            Paste notes for now. Files and websites are coming next.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text">
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
            <ComingSoon
              title="File uploads"
              description="PDF, Markdown, and text files will land here. Text paste is available today."
            />
          </TabsContent>

          <TabsContent value="website" className="pt-4">
            <ComingSoon
              title="Website sources"
              description="Drop a URL later. For now, copy the page text into the Text tab."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed bg-muted/20 px-4 py-8 text-center">
      <p className="text-xs font-medium">{title}</p>
      <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <p className="text-[11px] text-muted-foreground">Coming soon</p>
    </div>
  );
}
