# PazartesiSohbetleri.com — Canlıya Alma ve Altyapı Yol Haritası

Bu doküman, **Sohbet Arşivi** projesinin `pazartesisohbetleri.com` alan adı altında 5 yıllık bir vizyonla canlıya alınması, teknik altyapısı, maliyet analizi ve uygulama adımlarını sunum amacıyla özetlemektedir.

---

## 1. Yönetici Özeti

* **Proje Amacı:** İsmail Acarkan Pazartesi Sohbetleri ses, transkript, kavram ve ayet arşivinin web üzerinden modern, hızlı ve kesintisiz şekilde erişime açılması.
* **Seçilen Alan Adı:** `pazartesisohbetleri.com`
* **Planlanan Tescil Süresi:** 5 Yıl (Döviz kuru ve enflasyon artışlarına karşı fiyat sabitleme amacıyla).
* **Seçilen Mimari:** Cloudflare Registrar (Domain) + Vercel (Frontend & Edge CDN) + Neon PostgreSQL (Serverless Bulut Veritabanı).
* **Maliyet:** 5 yıl boyunca **sadece alan adı (domain) ücreti** ödenecektir. Hosting ve veritabanı için **0 TL** (ücretsiz tier) maliyet hedeflenmiştir.

---

## 2. 5 Yıllık Maliyet ve Altyapı Karşılaştırması

| Kalem | Tercih Edilen Çözüm | 5 Yıllık Tahmini Maliyet | Neden Tercih Edildi? |
| :--- | :--- | :--- | :--- |
| **Domain (Alan Adı)** | **Cloudflare Registrar** | ~50 - 55 $ *(5 yıllık toplam)* | Toptan maliyetine satış (kâr marjı yok), ömür boyu **ücretsiz WHOIS gizliliği** (kişisel bilgilerin gizlenmesi). |
| **Web Hosting** | **Vercel** | **0 TL** *(Hobby Plan)* | Next.js'in resmi sunucusu; dünya genelinde Edge CDN, otomatik ücretsiz SSL (HTTPS), GitHub'a kod atıldığında otomatik güncelleme. |
| **Veritabanı** | **Neon.tech** | **0 TL** *(Kredi Kartsız Free Tier)* | 500 MB depolama kapasitesi sunar. Arşivimiz şu an ~49 MB olup kotanın yalnızca %10'unu kaplamaktadır. |
| **TOPLAM BÜTÇE** | — | **Sadece Domain Ücreti (~50-55 $)** | **Sunucu, SSL veya veritabanı için aylık/yıllık ek hiçbir masraf yoktur.** |

> 💡 **Kredi Kartı / Beklenmeyen Ücret Güvencesi:** Neon.tech ve Vercel'in ücretsiz paketlerinde kredi kartı tanımlama zorunluluğu yoktur. Bu nedenle sisteme kayıt olunurken veya çalışırken sürpriz bir fatura çıkması teknik olarak imkansızdır.

---

## 3. Sistem Mimarisi ve Teknik Detaylar

```
[ Ziyaretçi ]
      │
      ▼ (HTTPS / SSL - Güvenli Bağlantı)
[ Cloudflare DNS ] (pazartesisohbetleri.com)
      │
      ▼
[ Vercel Edge Network ] (Next.js 14 Frontend & API)
      │
      ▼ (Güvenli TLS Bağlantısı)
[ Neon Serverless PostgreSQL ] (Sohbetler, Kavramlar, Kullanıcılar, Okuma Geçmişi)
```

1. **Frontend & Arayüz (Next.js 14 + Tailwind CSS):**
   * Mobil uyumlu, modern tipografi (Inter + Serif fontlar), sepya/koyu okuma modları.
   * Pagefind ile anlık arama (kavram, ayet ve metin içi hızlı arama).
   * Dinleme ve okuma takip sistemi (Kaldığın Yerden Devam Et).

2. **Veritabanı ve İçerik Deposu (Neon PostgreSQL):**
   * Bilgisayardaki mevcut yerel SQLite (`dev.db`) arşivi, tek seferlik güvenli bir veri aktarım scripti ile Neon PostgreSQL'e taşınacaktır.
   * Mevcut 200+ sohbet, kavram sözlükleri ve admin kullanıcıları eksiksiz korunacaktır.

3. **Yönetim Paneli (Admin):**
   * Yetkili kullanıcılar yeni sohbetleri (.md, .docx veya .zip olarak) doğrudan web paneli üzerinden yüklemeye devam edebilecektir.

---

## 4. Adım Adım Canlıya Geçiş Takvimi (Yol Haritası)

### 1. Aşama: Domain Tescili (10 Dakika)
1. `dash.cloudflare.com` adresinde ücretsiz hesap açılır.
2. `pazartesisohbetleri.com` alan adı 5 yıllık olarak tescil edilir.
3. WHOIS gizliliği otomatik olarak aktifleşir.

### 2. Aşama: Bulut Veritabanının Hazırlanması (5 Dakika)
1. `neon.tech` üzerinden GitHub ile ücretsiz hesap açılır.
2. `pazartesisohbetleri` veritabanı projesi oluşturulur.
3. Verilen `DATABASE_URL` bağlantı adresi alınır.

### 3. Aşama: Veri Göçü (Data Migration) (15 Dakika)
1. Projedeki Prisma şeması PostgreSQL uyumlu hale getirilir.
2. Bilgisayardaki `dev.db` içinde yer alan tüm geçmiş veriler Neon bulut veritabanına otomatik aktarılır.
3. Kodlar GitHub deposuna push edilir.

### 4. Aşama: Vercel Dağıtımı (Deploy) (10 Dakika)
1. `vercel.com` üzerinden GitHub deposu içe aktarılır (Import).
2. Ortam değişkenleri (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) tanımlanır.
3. "Deploy" butonuna basılır ve site ilk olarak `xxx.vercel.app` üzerinden çalıştırılır.

### 5. Aşama: Domain Bağlantısı & Açılış (5 Dakika)
1. Vercel'in vereceği DNS kayıtları Cloudflare DNS paneline girilir.
2. Otomatik SSL sertifikası üretilir.
3. `https://pazartesisohbetleri.com` dünya çapında yayına başlar.

---

## 5. Sunum İçin Öne Çıkan Başlıklar (Konuşma Notları)

* **Yüksek Güvenilirlik:** Dünyanın en büyük altyapı sağlayıcıları (Cloudflare & Vercel) kullanıldığı için sunucu çökmesi, elektrik kesintisi veya bakım masrafı yoktur (%99.99 uptime).
* **Maksimum Hız:** Next.js ve Edge CDN sayesinde site Türkiye'den ve dünyadan saliseler içinde açılır.
* **Finansal Öngörülebilirlik:** 5 yıllık tescil sayesinde gelecekteki kur şoklarından etkilenilmez; hosting maliyeti ise sıfırdır.
* **Geliştirilebilir Altyapı:** İleride mobil uygulama (PWA), ses dosyası entegrasyonları veya yeni özellikler bu altyapıya rahatça eklenebilir.
