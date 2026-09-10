import { prisma } from './prisma';
import type { AyetRef, Bolum, Kavram, Sohbet, SohbetMeta } from './types';

// In-memory cache variable for development reloads or production module caching
let cachedSohbetler: Sohbet[] | null = null;

/**
 * Normalizes a Turkish label for matching aliases and finding canonical Kavram names.
 */
export function normalizeTrLabel(s: string): string {
    return s
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\.$/, '');
}

/**
 * Extracts AyetRef references from text (e.g. ayetlerNotu).
 * Preserved from original implementation as requested.
 */
export function ayetleriAyikla(notu: string): AyetRef[] {
    const refler: AyetRef[] = [];
    const gorulen = new Set<string>();
    const re = /([A-ZÂÎÛÇĞİÖŞÜ][\wÂÎÛçğıöşüâîû\u2018\u2019.-]*(?:\s+[A-Za-zÂÎÛÇĞİÖŞÜçğıöşüâîû\u2018\u2019.-]+){0,2}?)\s*(?:Suresi\s*)?(\d{1,3}):(\d{1,3})/g;
    
    let match;
    while ((match = re.exec(notu)) !== null) {
        const sure = match[1].trim();
        const sureNo = parseInt(match[2], 10);
        const ayet = match[3];
        const key = `${sureNo}:${ayet}`;
        
        if (!gorulen.has(key)) {
            gorulen.add(key);
            refler.push({ sure, sureNo, ayet });
        }
    }
    return refler;
}

/**
 * Internal function to fetch and cache data from Prisma.
 */
async function getAllData(): Promise<{ sohbetler: Sohbet[] }> {
    if (cachedSohbetler) {
        return { sohbetler: cachedSohbetler };
    }

    const [dbSohbetler, dbKavramlar] = await Promise.all([
        prisma.sohbetRecord.findMany({
            orderBy: { createdAt: 'desc' }
        }),
        prisma.kavramRecord.findMany()
    ]);

    // Build alias index from Kavram records
    const aliasIndex = new Map<string, Kavram>();
    
    for (const k of dbKavramlar) {
        const kavramObj: Kavram = { 
            slug: k.slug, 
            ad: k.ad, 
            kisaAd: k.kisaAd || k.ad 
        };
        
        aliasIndex.set(normalizeTrLabel(k.ad), kavramObj);
        if (k.kisaAd) {
            aliasIndex.set(normalizeTrLabel(k.kisaAd), kavramObj);
        }
        
        if (k.aliases) {
            let aliasesArr: string[] = [];
            try {
                aliasesArr = JSON.parse(k.aliases);
            } catch (e) {
                // Ignore parse errors for aliases
            }
            
            for (const alias of aliasesArr) {
                aliasIndex.set(normalizeTrLabel(alias), kavramObj);
            }
        }
    }

    // Process sohbet records and map to application types
    const sohbetler: Sohbet[] = dbSohbetler.map(row => {
        let vurgular: string[] = [];
        try { vurgular = JSON.parse(row.vurgularJson || '[]'); } catch(e) {}
        
        let ayetler: AyetRef[] = [];
        try { ayetler = JSON.parse(row.ayetlerJson || '[]'); } catch(e) {}
        
        if (ayetler.length === 0 && row.ayetlerNotu) {
            ayetler = ayetleriAyikla(row.ayetlerNotu);
        }
        
        let bolumler: Bolum[] = [];
        try { bolumler = JSON.parse(row.bolumlerJson || '[]'); } catch(e) {}

        const rowKavramlarRaw = row.kavramlarRaw 
            ? row.kavramlarRaw.split(',').map((s: string) => s.trim()).filter(Boolean) 
            : [];
            
        const resolvedKavramlar: Kavram[] = [];
        const eslesmeyenKavramlar: string[] = [];
        
        for (const k of rowKavramlarRaw) {
            const norm = normalizeTrLabel(k);
            const match = aliasIndex.get(norm);
            if (match) {
                if (!resolvedKavramlar.some(rk => rk.slug === match.slug)) {
                    resolvedKavramlar.push(match);
                }
            } else {
                eslesmeyenKavramlar.push(k);
            }
        }

        const sureNolari = Array.from(new Set(
            ayetler.map(a => a.sureNo).filter((n): n is number => n !== undefined)
        ));

        return {
            slug: row.slug,
            dosya: row.dosyaAdi,
            baslik: row.baslik,
            konu: row.konu || '',
            ozet: row.ozet || '',
            kavramlar: resolvedKavramlar,
            kavramSluglari: resolvedKavramlar.map(k => k.slug),
            sureNolari: sureNolari,
            eslesmeyenKavramlar,
            vurgular,
            ayetlerNotu: row.ayetlerNotu || '',
            ayetler,
            bolumler,
            govde: row.govde || ''
        };
    });

    cachedSohbetler = sohbetler;
    return { sohbetler };
}

// ----------------------------------------------------------------------
// PUBLIC API FUNCTIONS
// ----------------------------------------------------------------------

export async function getTumSohbetler(): Promise<Sohbet[]> {
    const { sohbetler } = await getAllData();
    return sohbetler;
}

export async function getSohbetMetalar(): Promise<SohbetMeta[]> {
    const sohbetler = await getTumSohbetler();
    return sohbetler.map(s => ({
        slug: s.slug,
        dosya: s.dosya,
        baslik: s.baslik,
        konu: s.konu,
        ozet: s.ozet,
        kavramlar: s.kavramlar,
        kavramSluglari: s.kavramSluglari,
        sureNolari: s.sureNolari
    }));
}

export async function getSohbet(slug: string): Promise<Sohbet | undefined> {
    const sohbetler = await getTumSohbetler();
    return sohbetler.find(s => s.slug === slug);
}

export async function getSohbetSluglari(): Promise<string[]> {
    const sohbetler = await getTumSohbetler();
    return sohbetler.map(s => s.slug);
}

export async function getKavramlar(): Promise<Array<Kavram & { adet: number }>> {
    const sohbetler = await getTumSohbetler();
    const map = new Map<string, Kavram & { adet: number }>();
    
    for (const sohbet of sohbetler) {
        for (const k of sohbet.kavramlar) {
            const mevcut = map.get(k.slug);
            if (mevcut) {
                mevcut.adet++;
            } else {
                map.set(k.slug, { ...k, adet: 1 });
            }
        }
    }
    
    return Array.from(map.values()).sort((a, b) => {
        if (b.adet !== a.adet) return b.adet - a.adet;
        return a.ad.localeCompare(b.ad, 'tr');
    });
}

export async function getKavram(slug: string): Promise<(Kavram & { adet: number, ilgili: Array<Kavram & { adet: number }>, sohbetler: SohbetMeta[] }) | undefined> {
    const sohbetler = await getTumSohbetler();
    
    let kavram: Kavram | undefined = undefined;
    const kavramSohbetler: SohbetMeta[] = [];
    
    for (const s of sohbetler) {
        const found = s.kavramlar.find(k => k.slug === slug);
        if (found) {
            if (!kavram) kavram = found;
            kavramSohbetler.push({
                slug: s.slug,
                dosya: s.dosya,
                baslik: s.baslik,
                konu: s.konu,
                ozet: s.ozet,
                kavramlar: s.kavramlar,
                kavramSluglari: s.kavramSluglari,
                sureNolari: s.sureNolari
            });
        }
    }
    
    if (!kavram) return undefined;
    
    // Ilgili kavramlar (co-occurrence in the same sohbetler)
    const coMap = new Map<string, Kavram & { adet: number }>();
    for (const s of kavramSohbetler) {
        for (const k of s.kavramlar) {
            if (k.slug === slug) continue;
            const mevcut = coMap.get(k.slug);
            if (mevcut) {
                mevcut.adet++;
            } else {
                coMap.set(k.slug, { ...k, adet: 1 });
            }
        }
    }
    
    const ilgili = Array.from(coMap.values())
        .sort((a, b) => b.adet - a.adet)
        .slice(0, 5);
        
    return {
        ...kavram,
        adet: kavramSohbetler.length,
        ilgili,
        sohbetler: kavramSohbetler
    };
}

export async function getBenzerSohbetler(slug: string, n: number = 3): Promise<SohbetMeta[]> {
    const sohbetler = await getTumSohbetler();
    const hedef = sohbetler.find(s => s.slug === slug);
    if (!hedef) return [];
    
    const hedefKavramlar = new Set(hedef.kavramSluglari);
    
    const skorlar = sohbetler
        .filter(s => s.slug !== slug)
        .map(s => {
            const ortak = s.kavramSluglari.filter(k => hedefKavramlar.has(k)).length;
            return { sohbet: s, ortak };
        })
        .filter(x => x.ortak > 0)
        .sort((a, b) => b.ortak - a.ortak);
        
    return skorlar.slice(0, n).map(x => {
        const s = x.sohbet;
        return {
            slug: s.slug,
            dosya: s.dosya,
            baslik: s.baslik,
            konu: s.konu,
            ozet: s.ozet,
            kavramlar: s.kavramlar,
            kavramSluglari: s.kavramSluglari,
            sureNolari: s.sureNolari
        };
    });
}

export async function getYilFacet(): Promise<Array<{ yil: number, adet: number }>> {
    return [];
}

export async function getSureFacet(): Promise<Array<{ sureNo: number, sure: string, adet: number }>> {
    const sohbetler = await getTumSohbetler();
    const map = new Map<number, { sureNo: number, sure: string, adet: number }>();
    
    for (const s of sohbetler) {
        const gorulen = new Set<number>();
        for (const a of s.ayetler) {
            if (a.sureNo && a.sure) {
                if (!gorulen.has(a.sureNo)) {
                    gorulen.add(a.sureNo);
                    const mevcut = map.get(a.sureNo);
                    if (mevcut) {
                        mevcut.adet++;
                    } else {
                        map.set(a.sureNo, { sureNo: a.sureNo, sure: a.sure, adet: 1 });
                    }
                }
            }
        }
    }
    
    return Array.from(map.values()).sort((a, b) => b.adet - a.adet);
}

export async function getAyetIndeksi(): Promise<Array<{
  sure: string;
  sureNo: number;
  ayetler: Array<AyetRef & { sohbetler: Array<{ slug: string; baslik: string }> }>;
  sohbetSayisi: number;
}>> {
    const sohbetler = await getTumSohbetler();

    const gruplar = new Map<
      number,
      {
        sure: string;
        ayetler: Map<string, AyetRef & { sohbetler: Array<{ slug: string; baslik: string }> }>;
        sohbetlerSet: Set<string>;
      }
    >();

    for (const s of sohbetler) {
      for (const ref of s.ayetler) {
        if (ref.sureNo == null) continue;
        let grup = gruplar.get(ref.sureNo);
        if (!grup) {
          grup = { sure: ref.sure ?? String(ref.sureNo), ayetler: new Map(), sohbetlerSet: new Set() };
          gruplar.set(ref.sureNo, grup);
        }
        grup.sohbetlerSet.add(s.slug);
        const key = `${ref.sureNo}:${ref.ayet}`;
        let ayet = grup.ayetler.get(key);
        if (!ayet) {
          ayet = { ...ref, sohbetler: [] };
          grup.ayetler.set(key, ayet);
        }
        ayet.sohbetler.push({ slug: s.slug, baslik: s.baslik });
      }
    }

    return [...gruplar]
      .sort((a, b) => a[0] - b[0])
      .map(([sureNo, grup]) => ({
        sure: grup.sure,
        sureNo,
        ayetler: [...grup.ayetler.values()].sort((a, b) =>
          Number(a.ayet) - Number(b.ayet),
        ),
        sohbetSayisi: grup.sohbetlerSet.size,
      }));
}
