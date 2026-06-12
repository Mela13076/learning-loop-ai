import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <SignUp />
    </main>
  );
}
