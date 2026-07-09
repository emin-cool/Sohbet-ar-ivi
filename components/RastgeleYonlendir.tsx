"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Statik export uyumlu rastgele yönlendirme (client-side).
// Slug listesi build sırasında gömülür; mount olunca rastgele birine gider.
export default function RastgeleYonlendir({ sluglar }: { sluglar: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (sluglar.length === 0) {
      router.replace("/sohbetler");
      return;
    }
    const secim = sluglar[Math.floor(Math.random() * sluglar.length)];
    router.replace(`/sohbet/${secim}`);
  }, [sluglar, router]);

  return (
    <main className="mx-auto flex max-w-site items-center justify-center px-6 py-32 text-muted">
      Rastgele bir sohbete yönlendiriliyorsunuz…
    </main>
  );
}
