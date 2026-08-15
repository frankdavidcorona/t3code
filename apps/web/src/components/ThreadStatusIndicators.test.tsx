import { ThreadId } from "@t3tools/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";

import type { ThreadStatusPill } from "./Sidebar.logic";
import { ThreadStatusBadge, ThreadWorktreeIndicator } from "./ThreadStatusIndicators";

describe("ThreadStatusBadge", () => {
  const legacyStatuses: ReadonlyArray<ThreadStatusPill> = [
    {
      label: "Pending Approval",
      colorClass: "text-amber-600 dark:text-amber-300/90",
      dotClass: "bg-amber-500 dark:bg-amber-300/90",
      pulse: false,
    },
    {
      label: "Awaiting Input",
      colorClass: "text-indigo-600 dark:text-indigo-300/90",
      dotClass: "bg-indigo-500 dark:bg-indigo-300/90",
      pulse: false,
    },
    {
      label: "Working",
      colorClass: "text-sky-600 dark:text-sky-300/80",
      dotClass: "bg-sky-500 dark:bg-sky-300/80",
      pulse: true,
    },
    {
      label: "Connecting",
      colorClass: "text-sky-600 dark:text-sky-300/80",
      dotClass: "bg-sky-500 dark:bg-sky-300/80",
      pulse: true,
    },
    {
      label: "Plan Ready",
      colorClass: "text-violet-600 dark:text-violet-300/90",
      dotClass: "bg-violet-500 dark:bg-violet-300/90",
      pulse: false,
    },
    {
      label: "Monitoring",
      colorClass: "text-sky-600 dark:text-sky-300/80",
      dotClass: "bg-sky-500 dark:bg-sky-300/80",
      pulse: false,
    },
    {
      label: "Completed",
      colorClass: "text-emerald-600 dark:text-emerald-300/90",
      dotClass: "bg-emerald-500 dark:bg-emerald-300/90",
      pulse: false,
    },
  ];

  it.each(legacyStatuses)("renders the legacy $label treatment", (status) => {
    const markup = renderToStaticMarkup(<ThreadStatusBadge role="status" status={status} />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("text-[10px]");
    expect(markup).toContain(status.colorClass);
    expect(markup).toContain(status.dotClass);
    expect(markup).toContain('class="hidden md:inline"');
    expect(markup).toContain(status.label);
    if (status.pulse) {
      expect(markup).toContain("animate-status-pulse");
    } else {
      expect(markup).not.toContain("animate-status-pulse");
    }
  });

  it("allows a surface to override the legacy text size", () => {
    const markup = renderToStaticMarkup(
      <ThreadStatusBadge status={legacyStatuses[2]!} className="text-xs" />,
    );

    expect(markup).toContain("text-xs");
    expect(markup).not.toContain("text-[10px]");
  });
});

describe("ThreadWorktreeIndicator", () => {
  it("renders the worktree folder and branch in an accessible label", () => {
    const markup = renderToStaticMarkup(
      <ThreadWorktreeIndicator
        thread={{
          id: ThreadId.make("thread-1"),
          branch: "feature/sidebar-indicator",
          worktreePath: "/tmp/worktrees/sidebar-indicator",
        }}
      />,
    );

    expect(markup).toContain('role="img"');
    expect(markup).toContain(
      'aria-label="Worktree: sidebar-indicator (feature/sidebar-indicator)"',
    );
    expect(markup).toContain('data-testid="thread-worktree-thread-1"');
  });

  it.each([null, "", "   "])("renders nothing for an absent worktree path", (worktreePath) => {
    const markup = renderToStaticMarkup(
      <ThreadWorktreeIndicator
        thread={{
          id: ThreadId.make("thread-1"),
          branch: "main",
          worktreePath,
        }}
      />,
    );

    expect(markup).toBe("");
  });
});
