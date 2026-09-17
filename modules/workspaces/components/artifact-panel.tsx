import { HugeiconsIcon } from "@hugeicons/react";
import {
  AudioBook01Icon,
  ChartHistogramIcon,
  Note01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const studioItems = [
  {
    title: "Audio overview",
    description: "A short briefing of your sources.",
    icon: AudioBook01Icon,
  },
  {
    title: "Study guide",
    description: "Notes, questions, and key terms.",
    icon: Note01Icon,
  },
];

export default function ArtifactPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={SparklesIcon}
            strokeWidth={2}
            className="size-3.5 text-muted-foreground"
          />
          <span className="text-xs font-medium">Artifacts</span>
        </div>
        <Badge variant="secondary">Studio</Badge>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-2 p-3 pt-0">
            {studioItems.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 bg-muted/30 p-3 opacity-60"
              >
                <div className="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Button size="xs" variant="outline" disabled>
                    Generate
                  </Button>
                </div>
              </div>
            ))}

            <div
              aria-disabled="true"
              className="pointer-events-none space-y-3 bg-muted/30 p-3 opacity-50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={ChartHistogramIcon}
                    strokeWidth={2}
                    className="size-3.5 text-muted-foreground"
                  />
                  <p className="text-xs font-medium">Chart</p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Charts unlock after you add sources.
              </p>
              <div className="flex h-20 items-end gap-1">
                {[28, 52, 36, 76, 44, 22, 60].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-foreground/10"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <Button size="xs" variant="outline" disabled>
                Create chart
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
