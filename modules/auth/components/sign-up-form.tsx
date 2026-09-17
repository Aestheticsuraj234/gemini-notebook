import Link from "next/link";
import { signUp } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  async function handleSignUp(formData: FormData) {
    "use server";

    await signUp(
      String(formData.get("name")),
      String(formData.get("email")),
      String(formData.get("password")),
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Sign up with your name, email, and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSignUp}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" name="name" type="text" placeholder="Ada Lovelace" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" name="password" type="password" required />
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </Field>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
