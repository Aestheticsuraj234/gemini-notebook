"use client";

import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  children: string;
  className?: string;
  isAnimating?: boolean;
};

export default function MarkdownContent({
  children,
  className,
  isAnimating = false,
}: MarkdownContentProps) {
  return (
    <Streamdown
      className={cn(
        "text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded-none [&_li]:my-1 [&_ol]:my-2 [&_p]:my-2 [&_pre]:my-3 [&_ul]:my-2",
        className,
      )}
      plugins={{ code }}
      shikiTheme={["github-light", "github-dark"]}
      animated={isAnimating}
      isAnimating={isAnimating}
      caret={isAnimating ? "block" : undefined}
      lineNumbers
    >
      {children}
    </Streamdown>
  );
}
