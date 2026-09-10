"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ProgressTracker({ slug }: { slug: string }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Sadece kullanıcı durduğunda (debounce) api isteği atalım
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        // İlerlemeyi hesapla
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        let progress = 0;
        if (documentHeight - windowHeight > 0) {
          progress = Math.round((scrollPosition / (documentHeight - windowHeight)) * 100);
        }

        let sectionId, sectionTitle;
        try {
          const bookmarkStr = localStorage.getItem("bookmark");
          if (bookmarkStr) {
            const bookmark = JSON.parse(bookmarkStr);
            if (bookmark.slug === slug) {
              sectionId = bookmark.sectionId;
              sectionTitle = bookmark.baslik;
            }
          }
        } catch (e) {}

        // Api'ye kaydet
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, progress, sectionId, sectionTitle }),
        }).catch(console.error);

      }, 2000); // Kaydırma bittikten 2 saniye sonra kaydet
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [session, slug]);

  return null;
}
