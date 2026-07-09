# -*- coding: utf-8 -*-
"""
pdfler/ klasöründeki sohbet PDF'lerini içe aktarır.

- pdfplumber ile metin çıkarır (pdftotext'e göre cid eşlemesi daha temiz/deterministik).
- Karakter düzeltmesi: bozuk küçük "i" -> (cid:3464)/(cid:2591) -> "i"; madde işareti (U+F0B7) -> "•".
- Font/boşluk analiziyle gövde bölüm başlıklarını (## ) ve paragrafları çıkarır.
- Başlık bloğunu (Konu/Kısa Özet/Kavramlar/Öne Çıkan Vurgular/Tarih/Geçen Ayetler)
  mevcut 10 sohbetle AYNI **Etiket:** formatında yeniden üretir.
- content/sohbetler/ altına "YYYY-MM-DD - Başlık.md" olarak yazar.
- Kavramları content/kavramlar.json alias listesine göre eşler; eşleşmeyenleri raporlar
  (otomatik yeni kavram EKLEMEZ).

Çalıştır:  python scripts/ic-aktar.py
"""
import sys, io, os, re, glob, json, collections, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
import pdfplumber

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(KOK, "pdfler")
OUT_DIR = os.path.join(KOK, "content", "sohbetler")
KAVRAM_JSON = os.path.join(KOK, "content", "kavramlar.json")

# --- Karakter düzeltmesi ---
def temizle(t):
    t = t.replace("(cid:3464)", "i").replace("(cid:2591)", "i")
    t = t.replace("", "•")
    return t

# --- Türkçe slugify (lib/slugify.ts ile aynı mantık) ---
TR_MAP = {"ç":"c","Ç":"c","ğ":"g","Ğ":"g","ı":"i","I":"i","İ":"i","i":"i",
          "ö":"o","Ö":"o","ş":"s","Ş":"s","ü":"u","Ü":"u"}
def slugify(s):
    s = "".join(TR_MAP.get(ch, ch) for ch in s).lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"['’\"]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    s = re.sub(r"-{2,}", "-", s)
    return s

# --- Kavram normalize (lib/content.ts normalizeTrLabel ile aynı) ---
def norm_label(s):
    s = s.replace("İ", "i").replace("I", "ı").lower()
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\.$", "", s)
    return s

# --- Başlık temizleme (dosya adından) ---
KUCUK = {"ve", "ile", "veya", "ya", "da", "de"}
def tr_cap(w):
    if not w: return w
    f = w[0]
    f = "İ" if f == "i" else ("I" if f == "ı" else f.upper())
    return f + w[1:]
def tr_title(s):
    kelimeler = s.split()
    out = []
    for i, w in enumerate(kelimeler):
        if i > 0 and w.lower() in KUCUK:
            out.append(w.lower())
        else:
            out.append(tr_cap(w))
    return " ".join(out)
# Dosya adından türeyen başlıkta harf kaybı olan dosyalar için elle düzeltme
# (doğru yazımlar Konu alanından/kullanıcıdan). Tarihe göre anahtarlanır.
BASLIK_DUZELTME = {
    "2026-01-19": "Allah'ın Boyası (Sıbğatullah)",
    "2026-01-26": "Kendine Şahitlik",
    "2026-02-02": "Kendine Şahitlik ve Zikrin Yüceltilmesi",
    "2026-02-09": "Araf Suresi 22. Ayet ve Âdem'in Kıssası",
}

def dosya_basligi(name):
    name = unicodedata.normalize("NFC", name)
    name = re.sub(r"\.pdf$", "", name, flags=re.I)
    name = re.sub(r"^\d{4}[ _-]\d{2}[ _-]\d{2}\s*", "", name)   # tarih öneki
    name = re.sub(r"\s*·?\s*MD\s*$", "", name)                   # · MD kalıntısı
    name = name.replace("·", " ")
    name = name.replace("i̇", "İ")   # i + combining dot -> İ
    name = name.replace("_", "'")     # Hüseyin_in -> Hüseyin'in
    name = re.sub(r"\s+", " ", name).strip("'_ ").strip()
    t = tr_title(name)
    t = re.sub(r"\bİ\b", "-i", t)      # izafet: "Hakikat İ Muhammediye" -> "Hakikat-i ..."
    t = t.replace(" -i ", "-i ")
    return t

# --- Satır çıkarımı (font + dikey boşluk) ---
def satirlari_cikar(pdf):
    """Tüm sayfalardan (top-sıralı) satırlar: {text, font, gap, page}."""
    tum = []
    for pi, pg in enumerate(pdf.pages):
        gruplar = {}
        for ch in pg.chars:
            gruplar.setdefault(round(ch["top"]), []).append(ch)
        onceki_top = None
        for top in sorted(gruplar):
            chs = sorted(gruplar[top], key=lambda c: c["x0"])  # soldan sağa sırala
            txt = temizle("".join(c["text"] for c in chs)).rstrip()
            if not txt.strip():
                onceki_top = top
                continue
            font = collections.Counter(c["fontname"] for c in chs).most_common(1)[0][0]
            gap = None if onceki_top is None else round(top - onceki_top)
            tum.append({"text": txt.strip(), "font": font, "gap": gap, "page": pi})
            onceki_top = top
    return tum

ETIKETLER = ["Konu", "Kısa Özet", "Kavramlar", "Öne Çıkan Vurgular", "Tarih", "Geçen Ayetler"]

def tam_metin(pdf):
    """extract_text birleşimi (madde işaretleri doğru sırada — başlık bloğu için)."""
    return temizle("\n".join((pg.extract_text() or "") for pg in pdf.pages))

def govde_basligini_bul(lines, body_font):
    """char-level: Başlık bloğu etiketlerinden (Konu, Özet vb.) olmayan ilk bold+boşluklu satır = gövde başlangıcı."""
    # Olası etiket kelimeleri (bölünmüş olsalar bile)
    etiket_kelimeleri = {"Konu", "Kısa", "Özet", "Kavramlar", "Öne", "Çıkan", "Vurgular", "Tarih", "Geçen", "Ayetler"}
    
    for idx, l in enumerate(lines):
        if l["font"] != body_font and (l["gap"] is None or l["gap"] >= 18) and len(l["text"]) <= 90:
            # Bu bir başlık adayı. Eğer etiket kelimelerinden biriyle başlamıyorsa, gövde başlığıdır.
            ilk_kelime = l["text"].split()[0].replace(":", "") if l["text"].split() else ""
            if ilk_kelime not in etiket_kelimeleri and not l["text"].lower().startswith("not"):
                # Güvenlik için, ilk birkaç satırdaki (idx < 5) şeyleri atla (örneğin bazen en üstte bir ana başlık olabilir)
                if idx > 15:
                    return idx, l["text"]
    return None, None

def header_alan(header_text, label):
    nxt = "|".join(re.escape(e) for e in ETIKETLER)
    m = re.search(rf"{re.escape(label)}\s*:\s*(.*?)(?=\n(?:{nxt})\s*:|\Z)", header_text, re.S)
    return m.group(1).strip() if m else ""

def ayristir(pdf, lines):
    """{alanlar, bolumler, hata}. Başlık bloğu extract_text'ten, gövde char-level'dan."""
    body_font = collections.Counter(l["font"] for l in lines).most_common(1)[0][0]
    body_start, heading_text = govde_basligini_bul(lines, body_font)
    if body_start is None:
        return {"alanlar": {}, "bolumler": [], "hata": "gövde başlangıcı bulunamadı"}

    # Başlık bloğu = tam metnin, gövde başlığına kadarki kısmı
    ft = tam_metin(pdf)
    # başlık metninin ilk ~20 karakterine göre böl
    anahtar = heading_text.strip()[:20]
    pos = ft.find(anahtar)
    header_text = ft[:pos] if pos > 0 else ft
    alanlar = {e: header_alan(header_text, e) for e in ETIKETLER}

    # --- Gövde: bold = başlık, gap>=22 = paragraf kırılımı (char-level) ---
    bolumler = []
    cur = None
    para = []
    def para_bitir():
        nonlocal para
        if para and cur is not None:
            cur["paragraflar"].append(" ".join(para).strip())
        para = []
    prev = None
    for l in lines[body_start:]:
        heading = (l["font"] != body_font and (l["gap"] is None or l["gap"] >= 20)
                   and len(l["text"]) <= 90)
        if heading:
            para_bitir()
            cur = {"baslik": l["text"].rstrip(":"), "paragraflar": []}
            bolumler.append(cur)
        else:
            if cur is None:
                cur = {"baslik": "", "paragraflar": []}
                bolumler.append(cur)
            kir = False
            if l["gap"] is not None and l["gap"] >= 22:
                kir = True
            elif prev is not None and l["page"] != prev["page"] and re.search(r"[.!?…]$", prev["text"]):
                kir = True
            if kir:
                para_bitir()
            para.append(l["text"])
        prev = l
    para_bitir()
    return {"alanlar": alanlar, "bolumler": bolumler, "hata": None}

def alan_metin(s):
    return re.sub(r"\s+", " ", (s or "")).strip()

def vurgular_ayikla(s):
    """Öne Çıkan Vurgular: • ile ayrılmış maddeler."""
    parts = [re.sub(r"\s+", " ", p).strip(" •").strip() for p in (s or "").split("•")]
    return [p for p in parts if p]

def gecen_ayetler_metin(s):
    return re.sub(r"\s+", " ", (s or "").replace("•", " ")).strip()

AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
def iso_tr(iso):
    y, m, d = iso.split("-")
    return f"{int(d)} {AYLAR[int(m)-1]} {y}"

def md_uret(baslik, tarih_iso, alanlar, bolumler):
    konu = alan_metin(alanlar.get("Konu"))
    ozet = alan_metin(alanlar.get("Kısa Özet"))
    kavr = alan_metin(alanlar.get("Kavramlar"))
    vurg = vurgular_ayikla(alanlar.get("Öne Çıkan Vurgular"))
    tarih = alan_metin(alanlar.get("Tarih")) or iso_tr(tarih_iso)
    ayet = gecen_ayetler_metin(alanlar.get("Geçen Ayetler"))

    o = []
    o.append(f"**Konu:** {konu}\n")
    o.append(f"**Kısa Özet:** {ozet}\n")
    o.append(f"**Kavramlar:** {kavr}\n")
    o.append("**Öne Çıkan Vurgular:**")
    for v in vurg:
        o.append(f"- {v}")
    o.append("")
    o.append(f"**Tarih:** {tarih}\n")
    o.append(f"**Geçen Ayetler:** {ayet}\n")
    o.append("---\n")
    for b in bolumler:
        if b["baslik"]:
            o.append(f"## {b['baslik']}\n")
        for p in b["paragraflar"]:
            o.append(p + "\n")
    return "\n".join(o).rstrip() + "\n", {"konu":konu,"ozet":ozet,"kavr":kavr,"vurg":vurg,"tarih":tarih,"ayet":ayet}

# --- Kavram alias indeksi ---
def alias_index():
    data = json.load(open(KAVRAM_JSON, encoding="utf-8"))
    idx = {}
    for slug, t in data.items():
        for a in t.get("aliases", []):
            idx[norm_label(a)] = slug
    return idx, data

def main():
    idx, kavramlar_json = alias_index()
    pdfs = sorted(glob.glob(os.path.join(PDF_DIR, "*.pdf")))
    mevcut_sluglar = set()
    for f in glob.glob(os.path.join(OUT_DIR, "*.md")):
        m = re.match(r"^\d{4}-\d{2}-\d{2}\s*-\s*(.+)\.md$", os.path.basename(f))
        if m: mevcut_sluglar.add(slugify(m.group(1)))

    basarili, hatalar, eslesmeyen = [], [], collections.Counter()
    yeni_sluglar = {}
    ornekler = []

    for p in pdfs:
        fn = os.path.basename(p)
        dm = re.match(r"(\d{4})[ _-](\d{2})[ _-](\d{2})", fn)
        if not dm:
            hatalar.append((fn, "tarih önekli değil")); continue
        tarih_iso = "%s-%s-%s" % dm.groups()
        baslik = BASLIK_DUZELTME.get(tarih_iso) or dosya_basligi(fn)
        slug = slugify(baslik)

        try:
            with pdfplumber.open(p) as pdf:
                lines = satirlari_cikar(pdf)
                # Bozuk kodlama: U+F0B7 (•) her karakter arasına serpiştirilmişse
                # (liste değil ayraç) — metin kullanılamaz, yeniden export gerekir.
                bullet_say = sum(l["text"].count("•") for l in lines)
                if bullet_say > 50:
                    hatalar.append((fn, "bozuk karakter kodlaması (\\uF0B7 ayracı, %d) — yeniden export gerekli" % bullet_say))
                    continue
                sonuc = ayristir(pdf, lines)
        except Exception as e:
            hatalar.append((fn, "ayrıştırma hatası: %r" % e)); continue

        if sonuc["hata"]:
            hatalar.append((fn, sonuc["hata"])); continue

        # eksik alan kontrolü
        eksik = [e for e in ["Konu","Kısa Özet","Kavramlar","Tarih"] if not alan_metin(sonuc["alanlar"].get(e))]
        md, dd = md_uret(baslik, tarih_iso, sonuc["alanlar"], sonuc["bolumler"])

        # kavram eşleşmesi
        for tok in dd["kavr"].split(","):
            tok = tok.strip()
            if not tok: continue
            if norm_label(tok) not in idx:
                eslesmeyen[tok] += 1

        # slug çakışması
        cakisma = ""
        if slug in mevcut_sluglar or slug in yeni_sluglar:
            cakisma = " ⚠ SLUG ÇAKIŞMASI"
        yeni_sluglar[slug] = fn

        hedef = os.path.join(OUT_DIR, f"{tarih_iso} - {baslik}.md")
        with open(hedef, "w", encoding="utf-8") as fp:
            fp.write(md)

        basarili.append({
            "fn": fn, "tarih": tarih_iso, "baslik": baslik, "slug": slug,
            "bolum": len(sonuc["bolumler"]), "vurgu": len(dd["vurg"]),
            "eksik": eksik, "cakisma": bool(cakisma), "hedef": os.path.basename(hedef),
        })
        if len(ornekler) < 3:
            ornekler.append((os.path.basename(hedef), md))

    # --- RAPOR ---
    print("=" * 70)
    print(f"İÇE AKTARMA RAPORU — {len(pdfs)} PDF")
    print("=" * 70)
    print(f"\n✅ Başarılı: {len(basarili)}   ❌ Hatalı/belirsiz: {len(hatalar)}\n")
    for b in basarili:
        uyari = ""
        if b["eksik"]: uyari += " ⚠ eksik alan: " + ",".join(b["eksik"])
        if b["cakisma"]: uyari += " ⚠ SLUG ÇAKIŞMASI"
        print(f"  {b['tarih']}  bölüm:{b['bolum']:>2} vurgu:{b['vurgu']}  {b['baslik']}{uyari}")
    if hatalar:
        print("\n--- HATALAR ---")
        for fn, h in hatalar:
            print(f"  {fn}: {h}")

    print(f"\n--- EŞLEŞMEYEN HAM KAVRAMLAR ({len(eslesmeyen)} benzersiz) — karar senin ---")
    for k, n in eslesmeyen.most_common():
        print(f"  ({n})  {k}")

    print("\n" + "=" * 70)
    print("ÖRNEK ÇIKTILAR (ilk 3)")
    print("=" * 70)
    for ad, md in ornekler:
        print(f"\n########## {ad} ##########")
        print(md[:1400])
        print("...(kısaltıldı)")

if __name__ == "__main__":
    main()
