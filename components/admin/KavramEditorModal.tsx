"use client";

import { useState, useEffect } from "react";

interface KavramEditorModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function KavramEditorModal({
  onClose,
  onSaveSuccess,
}: KavramEditorModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/kavramlar`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setContent(JSON.stringify(data, null, 2));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        throw new Error("Geçersiz JSON formatı. Lütfen kontrol edin.");
      }

      const res = await fetch(`/api/admin/kavramlar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kaydedilemedi");
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Düzenle: Kavramlar (JSON)</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-red-500"
            title="Kapat"
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted">
              Yükleniyor...
            </div>
          ) : error && !content ? (
            <div className="text-red-500">Hata: {error}</div>
          ) : (
            <div className="flex h-full flex-col gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <textarea
                className="h-full w-full resize-none rounded-lg border border-line bg-surface p-4 text-sm font-mono text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
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
