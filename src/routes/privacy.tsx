import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

export function PrivacyPage() {
  return (
    <main className="px-5 pt-6 pb-8">
      <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">Forge</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Last updated August 30, 2026</p>

      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-muted">
        <p>
          Forge is a personal training log. It is made to stay on your phone. This page is the
          privacy policy for the web app and any Play Store listing of Forge.
        </p>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">What Forge stores</h2>
          <p className="mt-2">
            Workouts, sets, reps, rest times, body weight, height, step totals you type, progress
            photos, paper-log photos, and settings. All of that is saved in this browser or app
            profile (IndexedDB / device storage). It is not uploaded to a Forge server.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">What we do not collect</h2>
          <p className="mt-2">
            Forge does not create an account, does not require an email, and does not run ads or
            third-party analytics. There is no cloud login. The developer cannot see your lifts,
            photos, or body stats.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Photos and camera</h2>
          <p className="mt-2">
            If you grant camera or photo access, images you attach stay on the device inside Forge.
            They are not sent to us. Uninstalling the app or clearing site data deletes them unless
            you exported a backup.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Motion and steps</h2>
          <p className="mt-2">
            The optional live step counter uses the device motion sensor only while Forge is open
            on screen. If you later grant Health Connect access in a native Play build, Forge
            reads today’s step total on the phone — including steps Garmin Connect writes there —
            and stores it locally. Forge does not log into Garmin and does not upload steps.
            You can revoke access in Android Settings or Garmin Connect.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">MyFitnessPal</h2>
          <p className="mt-2">
            Forge can copy an estimated calorie number and open MyFitnessPal in the browser. That
            is a handoff you start. We do not log into MyFitnessPal or send them data in the
            background.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Backups and share cards</h2>
          <p className="mt-2">
            Export backup writes a JSON file you choose where to keep. Session recap cards are
            images you save or share through the phone’s share sheet. Once you share, that app’s
            rules apply.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Spotter packs</h2>
          <p className="mt-2">
            A Spotter week is a summary you publish to a linked coach: session names, set counts,
            recent loads, and an optional note. Photos stay on the phone. Chat and plans go to
            Forge’s signed-in desk for that coach–client pair only.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Hosting</h2>
          <p className="mt-2">
            The app files may be served from grok.me or another host you configure. Hosting
            providers may see normal web logs (IP, browser) like any website. Workout contents are
            not in those logs.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Children</h2>
          <p className="mt-2">Forge is not directed at children under 13.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Your choices</h2>
          <p className="mt-2">
            Export a backup anytime in Settings. Delete data by clearing the site/app storage or
            uninstalling. There is no remote copy to delete on a server.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-fg">Contact</h2>
          <p className="mt-2">
            Questions about this policy: use the contact email on the Play Store listing, or the
            developer who published this copy of Forge.
          </p>
        </section>
      </div>

      <Link to="/" className="mt-8 inline-block text-sm text-accent">
        Back to Today
      </Link>
    </main>
  );
}
