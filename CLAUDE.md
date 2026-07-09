# Sohbet Arşivi — Proje Spesifikasyonu

Türkçe İslami sohbet kayıtları için okuma + dinleme arşiv sitesi. 200+ sohbet içerir.
Tasarım Google Stitch ile yapıldı; ekran görüntüleri `design/` klasöründedir. Kod bu
tasarımlara birebir sadık kalmalıdır.

## Teknoloji

- Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- İçerik: Markdown dosyaları (YAML frontmatter) — veritabanı YOK
- Tüm sayfalar Static Generation (SSG) ile build sırasında üretilir
- Arama: Pagefind (build sonrası indeksleme, client-side)
- Ses dosyaları: dış URL (Cloudflare R2 / Archive.org) — koda sadece URL gelir
- Deploy: Vercel

## Tasarım Sistemi (Stitch ekranlarından)

- Arka plan: krem/kırık beyaz (#FAF7F2), kartlarda hafif daha açık krem tonu
- Metin: koyu mürekkep (#1F2937 civarı)
- Vurgu rengi: koyu deniz mavisi-yeşili / teal (#0F766E) — linkler, aktif durumlar,
  play butonları, "Öne Çıkan Vurgular" sol çizgisi
- Başlıklar: zarif serif (Lora veya Playfair Display), gövde: Inter
- Bol beyaz alan, 8-12px yuvarlak köşeler, çok hafif gölgeler, ince ayraç çizgileri
- Uzun okuma için: gövde ~18px, satır yüksekliği 1.8, içerik genişliği ~680px
- Tema: Açık (varsayılan), Sepya, Koyu — okuma ayarlarından değiştirilir

### Tutarlılık düzeltmesi (ÖNEMLİ)
Stitch ekranlarında navbar tutarsız ("Sohbet Arşivi" / "Archive" / "Digital Archive",
menüde "Kütüphane", "Browse/Series/Scholars" gibi kalıntılar var). TÜM sayfalarda
standart:
- Logo/isim: **Sohbet Arşivi**
- Menü: **Sohbetler · Kavramlar · Ayetler · Hakkında** + arama ikonu
- Tüm arayüz metinleri Türkçe

## Site Haritası

```
/                    Ana sayfa
/sohbetler           Arşiv listesi + filtreler
/sohbet/[slug]       Sohbet detay
/kavramlar           Kavram listesi
/kavram/[slug]       Tek kavram sayfası
/ayetler             Ayet indeksi (sure bazlı, akordeon)
/rastgele            Rastgele bir sohbete redirect
/hakkinda            Statik bilgi sayfası
```

## İçerik Modeli

> NOT: Kaynak dosyalar YAML frontmatter DEĞİL, `**Etiket:**` bloğu kullanır (aşağı
> bak). Ses/süre/timestamp gibi opsiyonel alanlar ayrı `content/audio.json`'da
> tutulur ve build sırasında birleştirilir. Ayrıştırıcı: `lib/content.ts`.

Her sohbet: `content/sohbetler/YYYY-MM-DD - Başlık.md`

- **slug, tarih, başlık dosya adından türetilir** (en güvenilir kaynak). Dosya adı
  öneki ISO tarih (`2025-07-07`), " - " ayracından sonrası başlıktır; slug bundan
  `lib/slugify.ts` (Türkçe-uyumlu) ile üretilir.
- Dosya başında **etiket bloğu** (ilk `## ` başlığına kadar), ardından `## ` bölüm
  başlıklarıyla markdown gövde:

```markdown
**Konu:** Tevhid bilinci ve "Allah bana yeter" (Hasbiyallah) idrakının gerçek anlamı
**Kısa Özet:** Bu sohbette tevhidin özünün bütün referansları Allah'a dayandırmak...
**Kavramlar:** Tevhid, fıtrat, nefis, sahte benlik (ego), Hasbiyallah, sabır, şükür
**Öne Çıkan Vurgular:**
- "Allah bana yeter" sözü insanlara meydan okuma değil, varlığın merkezinin...
- Beden bir araçtır; onu merkeze koymak insanı kırılgan kılar.
**Tarih:** 7 Temmuz 2025
**Geçen Ayetler:** Serbest metin. Sure/ayet numaraları çoğunlukla editör notu/tahmin
olarak parantez içinde verilir; yapılandırılmış değildir.

---

## Tevhid: Bütün Referanslarımızın Kaynağı Allah Olmalı
(gövde...)
```

Alan notları:
- **Kavramlar** virgülle ayrılmış SERBEST metindir (kontrollü sözlük değil).
  `content/kavramlar.json` küratörlü eşleme ile ham etiketleri ana kavramlara bağlar
  (bak. aşağı). Eşlenmeyen ham etiketler ayrıştırıcıda durur ama sitede gösterilmez.
- **Geçen Ayetler** yapılandırılmamış prose'tur. `lib/content.ts` en iyi çaba ile
  `Sure NN:AA` kalıplarını çıkarır; sonuçlar kesin değildir, UI'da "tahmini/editör
  notu" olarak sunulmalıdır.
- **audio, süre, bölüm timestamp'leri kaynak md'de YOKTUR** →
  `content/audio.json`'dan gelir (opsiyonel).

### `content/audio.json`

```json
{
  "tevhid-ve-hasbiyallah-bilinci": {
    "audio": "https://.../tevhid.mp3",
    "sure_dk": 52,
    "bolumler": [
      { "baslik": "Tevhid: Bütün Referanslarımızın Kaynağı Allah Olmalı", "ts": 0 },
      { "baslik": "\"Allah Bana Yeter\" Ne Demektir?", "ts": 330 }
    ]
  }
}
```

- `bolumler[].baslik`, md'deki `## ` başlığıyla **birebir aynı** olmalı (İçindekiler
  timestamp eşleşmesi için). Bölüm listesi her zaman md'den gelir; `ts` buradan
  başlık eşleşmesiyle iliştirilir.
- Bir slug bu dosyada **yoksa**: sticky player render EDİLMEZ, süre rozeti gizlenir,
  İçindekiler yalnızca metin-scroll yapar (ses atlaması olmaz).

### `content/kavramlar.json` (küratörlü kavram sözlüğü)

```json
{
  "sahte-benlik": { "ad": "Sahte Benlik", "aliases": ["sahte benlik (ego)", "cahil benlik", "..."] },
  "tevhid":       { "ad": "Tevhid", "aliases": ["tevhid"] }
}
```

Ham kavram etiketi (normalize edilmiş: küçük harf, boşluk sadeleştirilmiş) bir
`aliases` girdisiyle eşleşirse o ana kavrama bağlanır. Eşleşmeyen etiketler
gösterilmez. Sohbete özgü metaforlar ("güneş tutulması metaforu", "gemi metaforu"
vb.) kavram sayılmaz, eşleme dışıdır.

Kavram sayfaları, ilgili kavramlar, ayet indeksi, benzer sohbetler — hepsi build
sırasında md + audio.json + kavramlar.json'dan hesaplanır. Veritabanı yoktur.

## Sayfa Sayfa Gereksinimler

### Ana sayfa `/` (design/home.png)
- Hero: serif büyük başlık "Dijital Sığınağa Hoş Geldiniz"
- Ortada arama çubuğu, placeholder: "Sohbetlerde ara: kavram, ayet, konu..."
- Altında outline buton: "🎲 Rastgele Sohbet" → /rastgele
- "KALDIĞIN YERDEN DEVAM ET" bölümü: localStorage'da yarım dinleme varsa göster —
  başlık, "23:40 / 52:00" formatında ilerleme, ince teal progress çizgisi, yuvarlak
  teal play butonu. Kayıt yoksa bölüm hiç render edilmez.
- "Son Eklenen Sohbetler" + sağda "Tümünü Gör" linki: 3 sütunlu grid (mobilde tek
  sütun), kart = tarih, süre rozeti ("52 dk"), serif başlık, 2-3 satır özet
  (line-clamp), kavram etiketleri

### Arşiv `/sohbetler` (design/archive.png)
- Başlık "Tüm Sohbetler" + alt satır "216 sohbet" (dinamik sayı)
- Sol sidebar (mobilde "Filtrele" butonuyla açılan drawer):
  - KAVRAMLAR: checkbox + adet — "tevhid (34)"
  - TARİH: yıl checkboxları (akordeon)
  - SURELER: üstte mini arama inputu + checkbox listesi — "Yusuf Suresi (12)"
  - "Filtreleri Temizle" butonu
- Aktif filtreler liste üstünde kaldırılabilir chip: "tevhid ×" "2026 ×"
- Sağ üst: "Sırala: Yeniden eskiye ▾" dropdown
- Kartlar: serif başlık + sağda tarih rozeti, altında kavram chipleri, 2 satır özet,
  kulaklık ikonu + süre; kart altında ince teal dinleme-ilerleme çizgisi (varsa)
- Filtre durumu URL query'de tutulur: `/sohbetler?kavram=tevhid&yil=2026`
- Filtreleme client-side yapılır (tüm sohbet meta'sı build'de JSON olarak gömülür)

### Sohbet detay `/sohbet/[slug]` (design/detail.png)
- Breadcrumb: Sohbetler › {başlık}
- Büyük serif başlık; meta satırı: tarih · ⏱ süre · kavram chipleri (tıklanabilir)
- Aksiyon satırı: "Paylaş" (WhatsApp linki + linki kopyala) ve "Okuma Ayarları"
  (popover: yazı boyutu A− / A+, tema Açık/Sepya/Koyu — localStorage'a yazılır)
- "Kısa Özet" kartı (krem kutu, ikon + başlık)
- "Öne Çıkan Vurgular": sol tarafı teal çizgili açık yeşilimsi blok, madde listesi
- İki sütun (desktop): solda transkript, sağda sticky sidebar:
  - İÇİNDEKİLER: bölüm başlıkları + timestamp ("00:00", "15:30"); tıklayınca hem
    metinde bölüme scroll hem player o saniyeye atlar; scroll'a göre aktif bölüm
    vurgulanır
  - "Benzer Sohbetler" kartı: ortak kavram sayısına göre en yakın 3 sohbet
    (başlık + tarih + süre)
- Transkript sonrası: "Geçen Ayetler" kartı — sure/ayet + not, /ayetler sayfasına link
- **Sticky audio player** (viewport altı, her zaman görünür):
  - Sol: küçük kapak karesi (teal, kulaklık/ev ikonu) + başlık (truncate) + tarih
  - Orta: −15s · büyük yuvarlak teal play/pause · +15s; progress bar + "23:40 / 52:00"
  - Sağ: hız seçici 1x / 1.25x / 1.5x / 2x + ses ikonu
  - Mobil: kompakt tek satır, tıklayınca genişler
  - İlerleme 5 sn'de bir localStorage'a yazılır: { slug, saniye, toplam, guncelleme }
  - HTML5 `<audio>` elementi, kütüphane gerekmez

### Kavram `/kavram/[slug]` (design/concept.png)
- Üstte küçük harflerle "KAVRAM" etiketi, büyük serif başlık, "41 sohbette geçiyor"
- "İlgili Kavramlar": birlikte geçme sıklığına göre ilk 3-5 kavram chip'i
- "Sohbetler" listesi (sağda "Kronolojik" ibaresi): satır = solda tarih + süre,
  ortada etiketler + serif başlık + kısa özet, sağda yuvarlak play butonu
  (tıklayınca detay sayfasına gider)

### Ayet İndeksi `/ayetler` (design/ayetler.png)
- Başlık "Ayet İndeksi", alt yazı: "Sohbetlerde geçen sure ve ayetler. Kur'an-ı
  Kerim sırasına göre düzenlenmiştir."
- Akordeon liste, Kur'an sırasına göre: solda sure numarası, serif sure adı,
  "18 sohbet" rozeti, sağda aç/kapa oku
- Açılınca: her ayet için "Fatiha Suresi 1:1" başlığı, italik kısa meal (varsa),
  altında kulaklık ikonuyla o ayetin geçtiği sohbet linkleri

### Rastgele `/rastgele`
- Server-side redirect: rastgele bir sohbet slug'ına 302

## Ortak Bileşenler

- `Navbar` (tüm sayfalarda aynı), `Footer` (yıl linkleri: 2024 · 2025 · 2026)
- `SohbetKarti` (grid ve liste varyantı), `KavramChip`, `SureRozeti`
- `AudioPlayer` (global, context ile: sayfalar arası geçişte çalmaya devam etmesi
  v1'de ŞART DEĞİL — detay sayfasında çalışması yeterli)
- `OkumaAyarlari` popover

## Yol Haritası

**v1 (önce bunu bitir):**
1. Proje iskeleti + tasarım sistemi (renk/font token'ları Tailwind config'de)
2. İçerik katmanı: md okuma, tip tanımları, 4 örnek sohbet (content/ içinde hazır)
3. Ana sayfa → Arşiv → Detay + player → Kavram sayfaları → Ayet indeksi
4. Pagefind entegrasyonu
5. localStorage: dinleme ilerlemesi + "kaldığın yerden devam et"

**v2 (v1 bitmeden başlama):**
- OG paylaşım görselleri (ImageResponse)
- Paragraf düzeyinde ses senkronu (aktif paragraf vurgusu)
- Sayfalar arası kesintisiz çalma

## Kurallar

- Türkçe karakterler ve slug'lar doğru işlenmeli (İ/i, ş, ğ...) — slugify buna uygun
- Erişilebilirlik: player butonlarında aria-label, klavye ile kullanılabilir akordeon
- Lighthouse hedefi: statik sayfalarda 95+
- Tüm tarih formatları Türkçe: "7 Temmuz 2025"
- Component ve dosya adları İngilizce, arayüz metinleri Türkçe olabilir; tutarlı ol
