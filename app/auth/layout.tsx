import { requireUnauth } from "@/modules/auth/actions";

export default async function AuthLayout({ children }: LayoutProps<"/auth">) {
  await requireUnauth();

  return children;
}
