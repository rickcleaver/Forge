import { useRef, useState } from "react";
import {
  decryptBackup,
  downloadEncrypted,
  encryptBackup,
  getSyncStatus,
  packForSync,
  setSyncEnabled,
} from "@/lib/forge-sync";
import { useGym } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ForgeSyncCard() {
  const sessions = useGym((s) => s.sessions);
  const settings = useGym((s) => s.settings);
  const weighIns = useGym((s) => s.weighIns);
  const stepLogs = useGym((s) => s.stepLogs);
  const progressPhotos = useGym((s) => s.progressPhotos);
  const programs = useGym((s) => s.programs);
  const importBackup = useGym((s) => s.importBackup);
  const markBackedUp = useGym((s) => s.markBackedUp);
  const [status, setStatus] = useState(() => getSyncStatus());
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col gap-2">
      <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Forge Sync</p>
      <p className="text-sm text-muted">
        Local-first stays the default. Sync MVP = encrypted backup you control (passphrase never leaves this phone).
        Full multi-device session sync lands after auth migrations — Spotter already covers coach cloud.
      </p>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Enable Forge Sync tools</span>
        <input
          type="checkbox"
          checked={status.enabled}
          onChange={(e) => setStatus(setSyncEnabled(e.target.checked))}
          className="size-5 accent-[var(--color-accent)]"
        />
      </label>
      {status.enabled ? (
        <>
          <Input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Passphrase for encrypted export"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                if (pass.length < 6) {
                  setMsg("Use at least 6 characters.");
                  return;
                }
                try {
                  const backup = packForSync({
                    sessions,
                    settings,
                    weighIns,
                    stepLogs,
                    progressPhotos,
                    programs,
                  });
                  const text = await encryptBackup(backup, pass);
                  downloadEncrypted(text);
                  markBackedUp();
                  setStatus(getSyncStatus());
                  setMsg("Encrypted sync file downloaded.");
                } catch {
                  setMsg("Could not encrypt backup.");
                }
              }}
            >
              Export encrypted
            </Button>
            <Button type="button" variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
              Import encrypted
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (pass.length < 6) {
                setMsg("Enter the passphrase first.");
                return;
              }
              try {
                const raw = await file.text();
                const backup = await decryptBackup(raw, pass);
                const { added } = importBackup(backup);
                markBackedUp();
                setMsg(added ? `Imported ${added} session${added === 1 ? "" : "s"}.` : "Nothing new to import.");
              } catch {
                setMsg("Could not decrypt that file. Check the passphrase.");
              }
            }}
          />
        </>
      ) : null}
      <p className="text-xs text-muted">{status.label}{status.lastExportAt ? ` · last export ${new Date(status.lastExportAt).toLocaleDateString()}` : ""}</p>
      {msg ? <p className="text-xs text-accent">{msg}</p> : null}
    </section>
  );
}
