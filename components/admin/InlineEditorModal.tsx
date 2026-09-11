"use client";

import { useState, useEffect } from "react";

interface InlineEditorModalProps {
  slug: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

import RichTextEditor from "./RichTextEditor";

const SURE_LISTESI = [
  'Fatiha', 'Bakara', 'Ali İmran', 'Nisa', 'Maide', 'Enam', 'Araf', 'Enfal', 'Tevbe', 'Yunus', 
  'Hud', 'Yusuf', 'Rad', 'İbrahim', 'Hicr', 'Nahl', 'İsra', 'Kehf', 'Meryem', 'Taha', 
  'Enbiya', 'Hac', 'Muminun', 'Nur', 'Furkan', 'Şuara', 'Neml', 'Kasas', 'Ankebut', 'Rum', 
  'Lokman', 'Secde', 'Ahzab', 'Sebe', 'Fatır', 'Yasin', 'Saffat', 'Sad', 'Zumer', 'Mumin (Gafir)', 
  'Fussilet', 'Şura', 'Zuhruf', 'Duhan', 'Casiye', 'Ahkaf', 'Muhammed', 'Fetih', 'Hucurat', 'Kaf', 
  'Zariyat', 'Tur', 'Necm', 'Kamer', 'Rahman', 'Vakıa', 'Hadid', 'Mücadele', 'Haşr', 'Mümtehine', 
  'Saff', 'Cuma', 'Münafikun', 'Tegabun', 'Talak', 'Tahrim', 'Mülk', 'Kalem', 'Hakka', 'Mearic', 
  'Nuh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyamet', 'İnsan', 'Mürselat', 'Nebe', 'Naziat', 'Abese', 
  'Tekvir', 'İnfitar', 'Mutaffifin', 'İnşikak', 'Buruc', 'Tarık', 'A\'la', 'Gaşiye', 'Fecr', 'Beled', 
  'Şems', 'Leyl', 'Duha', 'İnşirah', 'Tin', 'Alak', 'Kadir', 'Beyyine', 'Zilzal', 'Adiyat', 
  'Karia', 'Tekasür', 'Asr', 'Hümeze', 'Fil', 'Kureyş', 'Maun', 'Kevser', 'Kafirun', 'Nasr', 
  'Tebbet', 'İhlas', 'Felak', 'Nas'
];

export default function InlineEditorModal({
  slug,
  onClose,
  onSaveSuccess,
}: InlineEditorModalProps) {
  const [content, setContent] = useState("");
  const [baslik, setBaslik] = useState("");
  const [ayetler, setAyetler] = useState<{sure: string, sureNo: number, ayet: string}[]>([]);
  const [selectedSure, setSelectedSure] = useState("");
  const [ayetNo, setAyetNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/sohbetler/detay?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setContent(data.content || "");
          setBaslik(data.baslik || "");
          let parsedAyetler = [];
          try { parsedAyetler = JSON.parse(data.ayetlerJson || "[]"); } catch(e){}
          setAyetler(parsedAyetler);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Sohbet verisi yüklenemedi");
        setLoading(false);
      });
  }, [slug]);

  const handleAddAyet = () => {
    if (!selectedSure) return;
    const sureNo = SURE_LISTESI.indexOf(selectedSure) + 1;
    setAyetler([...ayetler, { sure: selectedSure, sureNo, ayet: ayetNo.trim() }]);
    setSelectedSure("");
    setAyetNo("");
  };

  const handleRemoveAyet = (index: number) => {
    setAyetler(ayetler.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const ayetlerNotu = ayetler.map(a => `${a.sure} Suresi ${a.sureNo}:${a.ayet || '1'}`).join(", ");
    try {
      const res = await fetch(`/api/admin/sohbetler/detay?slug=${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, baslik, ayetlerNotu }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kaydedilemedi");
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Kaydetme sırasında bir hata oluştu");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Düzenle: {baslik || slug}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-red-500"
            title="Kapat"
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center">
              <span>Hata: {error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-800 text-xs font-bold ml-2">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex h-full items-center justify-center text-muted">
              Yükleniyor...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Başlık</label>
                  <input
                    type="text"
                    value={baslik}
                    onChange={(e) => setBaslik(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent bg-surface"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Geçen Ayetler</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={selectedSure}
                      onChange={(e) => setSelectedSure(e.target.value)}
                      className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent bg-surface"
                    >
                      <option value="">Sure Seçiniz</option>
                      {SURE_LISTESI.map(sure => (
                        <option key={sure} value={sure}>{sure}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={ayetNo}
                      onChange={(e) => setAyetNo(e.target.value)}
                      placeholder="Ayet (opsiyonel)"
                      className="w-24 rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent bg-surface"
                    />
                    <button
                      onClick={handleAddAyet}
                      disabled={!selectedSure}
                      className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-strong disabled:opacity-50 transition-colors"
                    >
                      Ekle
                    </button>
                  </div>
                  {ayetler.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ayetler.map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-chip px-2.5 py-1 rounded-full text-xs text-chip-fg">
                          <span>{a.sure} {a.ayet ? `(${a.ayet})` : ''}</span>
                          <button onClick={() => handleRemoveAyet(i)} className="text-muted hover:text-red-500 transition-colors p-0.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <label className="block text-sm font-medium text-ink mb-1">İçerik</label>
              <div className="flex-1 min-h-[400px]">
                <RichTextEditor initialValue={content} onChange={setContent} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-line bg-surface-alt px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-line hover:text-ink transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
