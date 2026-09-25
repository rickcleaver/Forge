import { createFileRoute, Link } from "@tanstack/react-router";
import { SpotterSignIn } from "@/components/spotter-signin";
import { ForgeCharacter } from "@/components/forge-character";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="relative grid min-h-[80dvh] place-items-center overflow-hidden px-5">
      <span className="forge-blob forge-blob--a opacity-40" />
      <span className="forge-blob forge-blob--b opacity-35" />
      <div className="relative z-[1] w-full max-w-sm">
        <div className="mb-4 flex items-center gap-3">
          <ForgeCharacter kind="mascot" size="sm" motion="wiggle" />
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Forge · hop in</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Join the crew</h1>
            <p className="mt-1 text-sm text-muted">Same log. Your login. Neon on.</p>
          </div>
        </div>
        <SpotterSignIn />
        <Link to="/" className="mt-6 block text-center text-sm text-muted">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
