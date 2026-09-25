import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        className="pr-12"
      />
      <button
        type="button"
        className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center text-muted"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeConfirmCode(): string {
  let out = "";
  for (let i = 0; i < 5; i++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return out;
}
