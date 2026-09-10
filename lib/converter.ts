import mammoth from 'mammoth';
import TurndownService from 'turndown';
const pdfParseModule = require('pdf-parse');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default || pdfParseModule;
export interface ConversionResult {
  markdown: string;       // Full converted markdown
  meta: {
    baslik: string;       // Title (from filename or content)
    konu: string;
    ozet: string;
    kavramlarRaw: string; // Raw comma-separated kavram list
    vurgular: string[];   // Highlights
    ayetlerNotu: string;  // Raw ayet text
  };
  sections: string[];     // List of ## heading texts
  warnings: string[];     // Any issues encountered
}

/**
 * Dosya adından başlık çıkarır.
 */
function extractMetaFromFilename(filename: string): { baslik: string } {
  let baslik = filename;
  
  // Uzantıyı kaldır
  const extMatch = filename.match(/(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  if (extMatch) {
    baslik = extMatch[1].trim();
  }
  
  // Baştaki tarih formatlarını temizle: "2024 04 22 ", "[2025 06 23] ", "2023-01-01 - " vs.
  baslik = baslik.replace(/^\[?\d{4}[ \-_\.]\d{1,2}[ \-_\.]\d{1,2}\]?\s*(?:-\s*)?/, '');
  
  // Sondaki " · MD" veya benzerlerini temizle
  baslik = baslik.replace(/\s*·\s*(?:MD|md)?\s*$/i, '');
  
  // İlk harfi büyük yap
  if (baslik.length > 0) {
    baslik = baslik.charAt(0).toLocaleUpperCase('tr-TR') + baslik.slice(1);
  }
  
  return { baslik: baslik.trim() };
}

/**
 * Mevcut markdown içeriğinden meta bloğunu (Etiket bloğu) ayrıştırır.
 * @param content Markdown içeriği
 * @returns Ayrıştırılmış meta verileri
 */
export function parseMetaBlock(content: string): ConversionResult['meta'] {
  const meta: ConversionResult['meta'] = {
    baslik: '',
    konu: '',
    ozet: '',
    kavramlarRaw: '',
    vurgular: [],
    ayetlerNotu: ''
  };

  // Etiket bloğunun başlangıcını ve bitişini bul
  // Bitiş: İlk "## " başlığı veya "---" ayırıcı
  let blockContent = '';
  
  const blockEndMatch = content.match(/^(?:## |---)/m);
  if (blockEndMatch && blockEndMatch.index !== undefined) {
    blockContent = content.substring(0, blockEndMatch.index);
  } else {
    blockContent = content; // Ayraç yoksa tamamını kontrol et
  }

  // Değerleri bulmak için regex örüntüleri
  const extractField = (field: string): string => {
    // "**Alan:**" veya "*Alan:*" kısmından başlayıp bir sonraki "**Alan:**" / "*Alan:*" kısmına veya metin sonuna kadar al
    const regex = new RegExp(`(?:\\*\\*|\\*)${field}:?(?:\\*\\*|\\*)([\\s\\S]*?)(?=(?:\\*\\*|\\*)[^:\n]+:(?:\\*\\*|\\*)|$)`);
    const match = blockContent.match(regex);
    return match ? match[1].trim() : '';
  };

  meta.konu = extractField('Konu');
  meta.ozet = extractField('Kısa Özet');
  meta.kavramlarRaw = extractField('Kavramlar');
  meta.ayetlerNotu = extractField('Geçen Ayetler');

  // Vurguları ayrıştır (liste elemanları)
  const vurgularRaw = extractField('Öne Çıkan Vurgular');
  if (vurgularRaw) {
    meta.vurgular = vurgularRaw
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  return meta;
}

/**
 * Dosya uzantısına göre dosya formatını algılar.
 * @param filename Dosya adı
 * @returns Format ('pdf' | 'docx' | 'odt') veya null
 */
export function detectFormat(filename: string): 'pdf' | 'docx' | 'odt' | 'txt' | 'md' | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'odt') return 'odt';
  if (ext === 'txt') return 'txt';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return null;
}

/**
 * Metindeki "## " başlıklarını bulur.
 * @param markdown Dönüştürülmüş markdown metni
 * @returns Başlık listesi
 */
function extractSections(markdown: string): string[] {
  const sections: string[] = [];
  const regex = /^##\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

/**
 * Metin temizliği yapar (Türkçe karakter düzeltmeleri, boşlukların normalizasyonu).
 * @param text Ham metin
 * @returns Temizlenmiş metin
 */
function cleanUpText(text: string): string {
  let cleaned = text
    .replace(/\u0000/g, '') // Prisma'da "String contains null byte" hatasını önlemek için
    .replace(/\u0D88/g, 'i') // PDF'den DOCX'e dönüştürüldüğünde "i" harfinin yerine gelen hatalı karakteri (ඈ) düzelt
    .replace(/\r\n/g, '\n');

  // Pseudo-başlıkları (sadece * veya ** ile sarılı tek satırlar) h2'ye (##) dönüştür
  cleaned = cleaned.replace(/^(?:\*\*|\*)([^\n\*]{3,150})(?:\*\*|\*)\s*$/gm, (match, p1) => {
    const trimmed = p1.trim();
    // Meta alanlarını (Kısa Özet:, Konu: vb.) başlığa dönüştürme
    if (trimmed.endsWith(':') || (trimmed.includes(':') && trimmed.length < 30)) {
      return match;
    }
    return `\n## ${trimmed}\n`;
  });

  return cleaned
    .replace(/\n{3,}/g, '\n\n') // Fazla satır sonlarını maksimum iki satır sonuna indir
    .trim();
}

/**
 * PDF dosyasını markdown'a dönüştürür.
 * @param buffer PDF dosya verisi
 * @returns Ham markdown metni
 */
async function convertPdfToMarkdown(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  let text = data.text;
  
  // CID karakter referanslarını temizle ve madde işaretlerini düzelt
  text = text.replace(/\(cid:\d+\)/g, '');
  text = text.replace(/[•●▪]/g, '-');
  
  const lines = text.split('\n');
  let markdown = '';
  let previousLineEmpty = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length === 0) {
      markdown += '\n';
      previousLineEmpty = true;
      continue;
    }

    // Başlık tespiti heuristiği:
    // - 90 karakterden kısa
    // - Öncesinde boş satır var
    if (previousLineEmpty && line.length > 0 && line.length < 90) {
      // Eğer kelime tümüyle büyük harf değilse ve sonu nokta ile bitmiyorsa büyük ihtimalle başlıktır
      markdown += `\n## ${line}\n\n`;
    } else {
      // Paragraf birleşimi
      if (!previousLineEmpty && !markdown.endsWith('\n\n')) {
        markdown += ' ' + line;
      } else {
        markdown += line;
      }
    }
    previousLineEmpty = false;
  }
  
  return markdown;
}

/**
 * DOCX dosyasını markdown'a dönüştürür.
 * @param buffer DOCX dosya verisi
 * @returns Ham markdown metni
 */
async function convertDocxToMarkdown(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
  });
  
  let markdown = turndownService.turndown(html);
  
  // H1 (#) başlıkları H2 (##) başlıklarına dönüştür
  markdown = markdown.replace(/^#\s/gm, '## '); 
  
  return markdown;
}

/**
 * Düz metin (TXT) dosyasını markdown'a dönüştürür.
 * Paragrafları korur, başlık heuristiği uygular.
 * @param buffer TXT dosya verisi
 * @returns Markdown metni
 */
function convertTxtToMarkdown(buffer: Buffer): string {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n');
  let markdown = '';
  let previousLineEmpty = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    
    if (line.trim().length === 0) {
      markdown += '\n';
      previousLineEmpty = true;
      continue;
    }

    // Etiket bloğu satırlarını olduğu gibi bırak
    if (/^\*\*[^:]+:\*\*/.test(line.trim())) {
      markdown += line + '\n';
      previousLineEmpty = false;
      continue;
    }

    // Başlık tespiti: kısa satır, öncesinde boş satır, sonu nokta ile bitmiyor
    if (
      previousLineEmpty &&
      line.trim().length > 3 &&
      line.trim().length < 100 &&
      !line.trim().endsWith('.') &&
      !line.trim().startsWith('-') &&
      !line.trim().startsWith('*')
    ) {
      markdown += `\n## ${line.trim()}\n\n`;
    } else {
      markdown += line + '\n';
    }
    previousLineEmpty = false;
  }
  
  return markdown;
}

/**
 * Belgeyi Markdown formatına dönüştürür. DOCX ve PDF destekler.
 * @param buffer Dosya içeriği (Buffer)
 * @param format Dosya formatı ('pdf' | 'docx' | 'odt')
 * @param filename Dosya adı
 * @returns Dönüştürme sonucu ve ayrıştırılmış meta verileri
 */
export async function convertToMarkdown(
  buffer: Buffer, 
  format: 'pdf' | 'docx' | 'odt' | 'txt' | 'md',
  filename: string
): Promise<ConversionResult> {
  const warnings: string[] = [];
  let rawMarkdown = '';

  if (format === 'odt') {
    throw new Error("ODT desteği henüz bulunmamaktadır. Lütfen dosyayı önce DOCX formatına dönüştürün.");
  } else if (format === 'pdf') {
    rawMarkdown = await convertPdfToMarkdown(buffer);
  } else if (format === 'docx') {
    rawMarkdown = await convertDocxToMarkdown(buffer);
  } else if (format === 'txt') {
    rawMarkdown = convertTxtToMarkdown(buffer);
  } else if (format === 'md') {
    rawMarkdown = buffer.toString('utf-8');
  } else {
    throw new Error(`Desteklenmeyen format: ${format}`);
  }

  // Ortak işlem sonrası (post-processing) adımları
  const cleanedMarkdown = cleanUpText(rawMarkdown);
  
  // Başlıkları bul
  const sections = extractSections(cleanedMarkdown);
  
  // Meta bloğunu ayrıştır
  const meta = parseMetaBlock(cleanedMarkdown);
  
  // Dosya adından başlık ve tarih bilgilerini al
  const fileMeta = extractMetaFromFilename(filename);
  
  if (!meta.baslik) {
    meta.baslik = fileMeta.baslik;
  }

  return {
    markdown: cleanedMarkdown,
    meta,
    sections,
    warnings
  };
}
