import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/password-field";
import { checkEmailConfirm, startEmailConfirm } from "@/lib/spotter-api";

export function SpotterSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("up");
  const [step, setStep] = useState<"form" | "code">("form");
  const [typed, setTyped] = useState("");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    const sent = await startEmailConfirm({ data: email.trim() });
    setPreviewCode(sent.mailed ? null : sent.code);
    setStep("code");
    setTyped("");
  }

  async function createAccount() {
    setErr(null);
    if (password !== password2) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErr("Password needs 8+ characters.");
      return;
    }
    setBusy(true);
    try {
      if (!authEnabled) throw new Error("Sign-in is still starting. Wait a second and retry.");
      await sendCode();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAndSignUp() {
    setErr(null);
    setBusy(true);
    try {
      await checkEmailConfirm({ data: { email: email.trim(), code: typed } });
      const res = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim() || email.split("@")[0] || "Forge",
        callbackURL: "/spotter",
      });
      if (res.error) throw new Error(res.error.message || "Could not create account.");
      window.location.assign("/spotter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Confirm failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signInEmail() {
    setErr(null);
    setBusy(true);
    try {
      if (!authEnabled) throw new Error("Sign-in is still starting. Wait a second and retry.");
      const res = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/spotter",
      });
      if (res.error) throw new Error(res.error.message || "Could not sign in.");
      window.location.assign("/spotter");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hero-glow forge-neon-frame forge-card-play relative mt-3 overflow-hidden rounded-[1.75rem] bg-surface p-5 shadow-[var(--shadow-lift)]">
      <span className="forge-blob forge-blob--a opacity-50" />
      <span className="forge-blob forge-blob--b opacity-40" />
      <div className="relative z-[1]">
      <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Forge · Account</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{mode === "up" ? "Create account" : "Sign in"}</h2>
      <p className="mt-1 text-sm text-muted">Coach and client each need their own login. Neon on.</p>
      <div className="mt-4 flex flex-col gap-2">
        {typeof window !== "undefined" && window.location.hostname.endsWith("grok-sandbox.com")
          ? null
          : GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="secondary"
                className="w-full"
                onClick={() =>
                  void signIn(p.providerId, { callbackURL: "/spotter" }).catch((e) => {
                    setErr(e instanceof Error ? e.message : "Sign-in failed.");
                  })
                }
              >
                Continue with {p.label}
              </Button>
            ))}
        {typeof window !== "undefined" && window.location.hostname.endsWith("grok-sandbox.com") ? (
          <p className="text-sm text-muted">Google and X work on the installed app. Use email here.</p>
        ) : (
          <p className="mt-2 text-center font-mono text-[10px] tracking-wider text-muted uppercase">or email</p>
        )}

        {step === "code" && mode === "up" ? (
          <>
            <p className="text-sm text-muted">
              Enter the 5-character code sent to <span className="text-fg">{email.trim()}</span>.
            </p>
            {previewCode ? (
              <p className="rounded-lg bg-well px-3 py-3 text-center font-mono text-lg tracking-[0.35em]">
                {previewCode}
                <span className="mt-1 block font-sans text-[11px] tracking-normal text-muted">
                  Preview cannot send email yet. This is the code that will go to the inbox.
                </span>
              </p>
            ) : null}
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              placeholder="5-character code"
              autoComplete="one-time-code"
            />
            <Button className="w-full" disabled={busy || typed.length < 5} onClick={() => void confirmAndSignUp()}>
              Confirm email
            </Button>
            <button
              type="button"
              className="py-2 text-sm text-muted"
              onClick={() => void sendCode().catch((e) => setErr(e instanceof Error ? e.message : "Resend failed."))}
            >
              Send a new code
            </button>
            <button type="button" className="py-1 text-sm text-muted" onClick={() => setStep("form")}>
              Back
            </button>
          </>
        ) : (
          <>
            {mode === "up" ? (
              <label className="text-sm text-muted">
                Name
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
              </label>
            ) : null}
            <label className="text-sm text-muted">
              Email
              <Input
                className="mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="text-sm text-muted">
              Password
              <div className="mt-1">
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="Password (8+ characters)"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
              </div>
            </label>
            {mode === "up" ? (
              <label className="text-sm text-muted">
                Confirm password
                <div className="mt-1">
                  <PasswordField
                    value={password2}
                    onChange={setPassword2}
                    placeholder="Type the password again"
                    autoComplete="new-password"
                  />
                </div>
              </label>
            ) : null}
            <Button
              className="w-full"
              disabled={busy || !email.trim() || password.length < 8 || (mode === "up" && password2.length < 8)}
              onClick={() => void (mode === "up" ? createAccount() : signInEmail())}
            >
              {mode === "up" ? "Send confirm code" : "Sign in with email"}
            </Button>
          </>
        )}
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setStep("form");
            setErr(null);
          }}
        >
          {mode === "up" ? "Already have an account" : "Create an account"}
        </Button>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
      </div>
      </div>
    </section>
  );
}
