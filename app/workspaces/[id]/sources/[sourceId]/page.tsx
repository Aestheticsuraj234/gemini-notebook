import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getOwnedSource } from "@/modules/workspaces/actions";
import SourcePreview from "@/modules/workspaces/components/source-preview";
import { auth } from "@/lib/auth";

type SourcePageProps = {
  params: Promise<{ id: string; sourceId: string }>;
  searchParams: Promise<{ excerpt?: string }>;
};

export default async function SourcePage({ params, searchParams }: SourcePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id, sourceId } = await params;
  const { excerpt } = await searchParams;
  const data = await getOwnedSource(id, sourceId, session.user.id);
  if (!data) {
    notFound();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <SourcePreview
        workspaceId={data.workspace.id}
        workspaceTitle={data.workspace.title}
        source={data.source}
        excerpt={excerpt ?? null}
      />
    </div>
  );
}
