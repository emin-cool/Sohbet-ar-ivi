import Link from "next/link";
import type { Metadata } from "next";
import { getKavramlar, getSohbetMetalar } from "@/lib/content";

export const metadata: Metadata = {
  title: "Hakkında",
  description:
    "Sohbet Arşivi hakkında: içerik, kavram ve ayet indeksinin nasıl oluşturulduğu.",
};

export default function HakkindaSayfasi() {
  const sohbetSayisi = getSohbetMetalar().length;
  const kavramSayisi = getKavramlar().length;

  return (
    <main className="mx-auto max-w-reading px-6 py-14">
      <h1 className="font-serif text-4xl font-bold text-ink sm:text-5xl">
        Hakkında
      </h1>

      <div className="mt-8 space-y-5 leading-[1.8] text-ink/90">
        <p>
          <strong>Sohbet Arşivi</strong>, Türkçe İslami sohbet kayıtlarını okuma
          ve dinleme için bir araya getiren bir arşivdir. Amaç, sohbetleri
          konuya, kavrama ve geçen ayetlere göre kolayca keşfedilebilir kılmak;
          hem okunabilir bir transkript hem de eşlik eden ses kaydını aynı yerde
          sunmaktır.
        </p>
        <p>
          Arşivde şu an <strong>{sohbetSayisi} sohbet</strong> ve{" "}
          <strong>{kavramSayisi} ana kavram</strong> bulunuyor. Her sohbet;
          kısa özet, öne çıkan vurgular, bölüm başlıklarıyla düzenlenmiş
          transkript ve (mevcutsa) zaman damgalı bir ses kaydı içerir.
        </p>

        <h2 className="pt-4 font-serif text-2xl font-semibold text-ink">
          Nasıl Gezinebilirsiniz?
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <Link href="/sohbetler" className="text-accent hover:underline">
              Sohbetler
            </Link>{" "}
            sayfasından kavram, tarih ve sureye göre filtreleyebilirsiniz.
          </li>
          <li>
            <Link href="/kavramlar" className="text-accent hover:underline">
              Kavramlar
            </Link>{" "}
            sayfası, sohbetlerde işlenen ana temaları ve birbirleriyle
            ilişkilerini gösterir.
          </li>
          <li>
            <Link href="/ayetler" className="text-accent hover:underline">
              Ayet İndeksi
            </Link>{" "}
            sohbetlerde geçen sure ve ayetleri Kur'an sırasına göre listeler.
          </li>
          <li>
            <Link href="/rastgele" className="text-accent hover:underline">
              Rastgele Sohbet
            </Link>{" "}
            ile keşfe rastgele bir noktadan başlayabilirsiniz.
          </li>
        </ul>

        <h2 className="pt-4 font-serif text-2xl font-semibold text-ink">
          Kaynak ve Doğruluk Notu
        </h2>
        <p>
          Kavram etiketleri, sohbet içeriklerinden derlenip küratörlü bir sözlük
          üzerinden ana kavramlara eşlenmiştir. Ayet referansları ise çoğunlukla
          konuşmacının parafrazından çıkarıldığı için{" "}
          <em>tahmini</em> niteliktedir; kesin sure/ayet numarası her zaman
          doğrulanmış olmayabilir. Bu tür referanslar arayüzde “tahmini” olarak
          işaretlenir.
        </p>
      </div>
    </main>
  );
}
