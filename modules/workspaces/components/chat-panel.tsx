import { HugeiconsIcon } from "@hugeicons/react";
import { MessageSquareIcon, SentIcon } from "@hugeicons/core-free-icons";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

type ChatPanelProps = {
  workspaceTitle: string;
};

export default function ChatPanel({ workspaceTitle }: ChatPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-2 px-3">
        <HugeiconsIcon
          icon={MessageSquareIcon}
          strokeWidth={2}
          className="size-3.5 text-muted-foreground"
        />
        <span className="truncate text-xs font-medium">{workspaceTitle}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex size-10 items-center justify-center bg-muted text-muted-foreground">
          <HugeiconsIcon icon={MessageSquareIcon} strokeWidth={2} className="size-4" />
        </div>
        <p className="text-sm font-medium tracking-tight">Ask this notebook</p>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Add sources first. Then you can chat about the material in this workspace.
        </p>
      </div>

      <div className="shrink-0 p-3">
        <InputGroup className="h-auto bg-muted/30">
          <InputGroupTextarea
            disabled
            placeholder="Ask a question after you add sources..."
            rows={2}
          />
          <InputGroupAddon align="block-end" className="justify-between">
            <span className="text-[11px] text-muted-foreground">
              Press <Kbd>Enter</Kbd> to send
            </span>
            <InputGroupButton size="icon-xs" variant="default" disabled>
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}
