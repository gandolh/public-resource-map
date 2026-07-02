import { useState } from "react";
import { Link, useNavigate, type MetaFunction } from "react-router";
import { Input } from "@base-ui/react/input";
import { Button } from "~/components/ui/Button";
import { useAuthStore } from "~/stores/authStore";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "Log in — CivicMap" },
  { name: "description", content: "Sign in to your CivicMap account" },
];

const fieldClass =
  "w-full h-11 px-3 rounded-lg bg-cm-surface border border-cm-outline-variant text-sm text-cm-on-surface placeholder:text-cm-outline outline-none focus:border-cm-primary";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      navigate("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen pt-16 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-cm-outline-variant bg-cm-surface p-6 shadow-sm">
        <h1 className="text-xl font-bold text-cm-on-surface mb-1">Welcome back</h1>
        <p className="text-sm text-cm-on-surface-variant mb-6">
          Sign in to see your favourites and reminders.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-cm-on-surface-variant">
            Email
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(fieldClass)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-cm-on-surface-variant">
            Password
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(fieldClass)}
            />
          </label>

          {error && <p className="text-sm text-cm-error">{error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-cm-on-surface-variant text-center">
          No account?{" "}
          <Link to="/register" className="text-cm-primary font-medium">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
