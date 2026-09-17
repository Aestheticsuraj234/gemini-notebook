import { requireAuth, signOut } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default async function Home() {
  const session = await requireAuth();

  return (
    <div>
      <ModeToggle />
      <h1>Hello {session.user.name}</h1>
      <form action={signOut}>
        <Button type="submit">Sign out</Button>
      </form>
    </div>
  );
}
