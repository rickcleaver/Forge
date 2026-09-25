import { createFileRoute, Link } from "@tanstack/react-router";
import { SpotterSignIn } from "@/components/spotter-signin";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-[80dvh] place-items-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
        <SpotterSignIn />
        <Link to="/" className="mt-6 block text-center text-sm text-muted">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
