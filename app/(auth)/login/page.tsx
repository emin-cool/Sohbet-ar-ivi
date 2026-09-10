"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-line bg-surface p-8 shadow-card">
        <div>
          <h2 className="mt-6 text-center font-serif text-3xl font-bold tracking-tight text-ink">
            Giriş Yap
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Sohbetleri kaydetmek ve okuma ilerlemenizi takip etmek için giriş yapın.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                className="block w-full appearance-none rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                placeholder="Kullanıcı adınız"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-ink/80">
                  Şifre
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
                  Şifremi Unuttum?
                </Link>
              </div>
              <input
                type="password"
                required
                className="block w-full appearance-none rounded-lg border border-line px-3 py-2 text-ink placeholder-muted focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg border border-transparent bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
