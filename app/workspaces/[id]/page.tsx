import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getOwnedWorkspace } from "@/modules/workspaces/actions";
import WorkspaceView from "@/modules/workspaces/components/workspace-view";
import { auth } from "@/lib/auth";

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;
  const workspace = await getOwnedWorkspace(id, session.user.id);
  if (!workspace) {
    notFound();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <WorkspaceView
        workspaceId={workspace.id}
        workspaceTitle={workspace.title}
      />
    </div>
  );
}
