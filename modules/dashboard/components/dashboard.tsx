"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Loading03Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Workspace = {
  id: string;
  title: string;
  createdAt: string;
};

type DashboardProps = {
  userName: string;
};

export default function Dashboard({ userName }: DashboardProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadWorkspaces() {
    const response = await fetch("/api/workspaces");
    if (response.status === 401) {
        router.push("/auth/sign-in");
      return;
    }
    if (!response.ok) {
      toast.error("Could not load workspaces");
      return;
    }
    setWorkspaces(await response.json());
  }

  useEffect(() => {
    loadWorkspaces().finally(() => setLoading(false));
  }, []);

  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      return;
    }

    setSaving(true);
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error ?? "Could not create workspace");
      return;
    }

    setNewTitle("");
    toast.success("Workspace created");
    await loadWorkspaces();
  }

  async function saveRename(id: string) {
    const title = editTitle.trim();
    if (!title) {
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      toast.error(data.error ?? "Could not rename workspace");
      return;
    }

    setEditingId(null);
    toast.success("Workspace renamed");
    await loadWorkspaces();
  }

  async function deleteWorkspace(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) {
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not delete workspace");
      return;
    }

    toast.success("Workspace deleted");
    await loadWorkspaces();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          strokeWidth={2}
          className="h-8 w-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {userName}.
          </p>
        </div>
        <Badge variant="secondary">
          {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create workspace</CardTitle>
          <CardDescription>
            Start a new notebook for a course, topic, or project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={createWorkspace}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="workspace-title">Title</Label>
              <Input
                id="workspace-title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Machine Learning — Week 3"
                disabled={saving}
              />
            </div>
            <Button type="submit" disabled={saving || !newTitle.trim()}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {workspaces.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No workspaces yet</EmptyTitle>
            <EmptyDescription>
              Create your first workspace to add sources and start studying.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() =>
                document.getElementById("workspace-title")?.focus()
              }
            >
              Create workspace
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All workspaces</CardTitle>
            <CardDescription>
              Open, rename, or delete your notebooks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <TableCell className="font-medium">
                      {editingId === workspace.id ? (
                        <div className="flex max-w-md gap-2">
                          <Input
                            value={editTitle}
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            disabled={saving}
                          />
                          <Button
                            size="sm"
                            onClick={() => saveRename(workspace.id)}
                            disabled={saving || !editTitle.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        workspace.title
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(workspace.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/workspaces/${workspace.id}` as Route)
                          }
                        >
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button size="sm" variant="outline" />}
                          >
                            <HugeiconsIcon
                              icon={MoreHorizontalIcon}
                              strokeWidth={2}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(workspace.id);
                                setEditTitle(workspace.title);
                              }}
                            >
                              <HugeiconsIcon
                                icon={PencilEdit01Icon}
                                strokeWidth={2}
                              />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                deleteWorkspace(workspace.id, workspace.title)
                              }
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                strokeWidth={2}
                              />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
