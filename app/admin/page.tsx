"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Tab = "upload" | "sohbetler" | "kavramlar";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === "development");
  }, []);

  if (!isDev && typeof window !== "undefined") {
    return (
      <div className="mx-auto max-w-site px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Erişim Engellendi</h1>
        <p className="text-lg text-ink/70">
          Admin paneli yalnızca yerel geliştirme ortamında (npm run dev) kullanılabilir.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-serif text-3xl font-bold text-ink">
          Lokal Yönetim Paneli
        </h1>
        <Link href="/" className="text-sm text-accent hover:underline">
          Siteye Dön &rarr;
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line">
        <TabButton active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>Sohbet Ekle</TabButton>
        <TabButton active={activeTab === "sohbetler"} onClick={() => setActiveTab("sohbetler")}>Sohbetler</TabButton>
        <TabButton active={activeTab === "kavramlar"} onClick={() => setActiveTab("kavramlar")}>Kavram Sözlüğü</TabButton>
      </div>

      {/* Tab Content */}
      <div className="rounded-card border border-line bg-surface p-6 shadow-sm min-h-[400px]">
        {activeTab === "upload" && <UploadTab />}
        {activeTab === "sohbetler" && <SohbetlerTab />}
        {activeTab === "kavramlar" && <KavramlarTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink hover:border-line"
      }`}
    >
      {children}
    </button>
  );
}

// ==========================================
// UPLOAD TAB
// ==========================================
function UploadTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logs, setLogs] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      if (selected.length > 10) {
        setMessage({ type: "error", text: "En fazla 10 dosya seçebilirsiniz." });
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setFiles(selected);
        setMessage(null);
      }
      setLogs("");
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setMessage(null);
    setLogs("");

    const formData = new FormData();
    files.forEach(file => formData.append("pdf", file));

    try {
      const response = await fetch("/api/admin/upload-pdf", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yükleme hatası.");
      
      setMessage({ type: "success", text: data.message });
      setLogs(data.logs || "");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-ink">Toplu PDF Yükleme</h2>
      <p className="mb-6 text-sm text-muted">
        En fazla 10 PDF seçebilirsiniz. Dosyalar <code className="bg-chip px-1 rounded">pdfler/</code> klasörüne atılıp otomatik Markdown'a çevrilecektir.
      </p>
      <div className="flex flex-col gap-4 max-w-md">
        <input
          type="file" accept=".pdf" multiple
          onChange={handleFileChange} ref={fileInputRef} disabled={isUploading}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-strong"
        />
        <button
          onClick={handleUpload} disabled={files.length === 0 || isUploading}
          className="self-start rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:bg-line"
        >
          {isUploading ? "Yükleniyor..." : "Yükle ve Çevir"}
        </button>
      </div>
      {message && <div className={`mt-4 p-3 rounded text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{message.text}</div>}
      {logs && <pre className="mt-4 max-h-60 overflow-y-auto rounded bg-ink p-4 text-xs text-surface whitespace-pre-wrap">{logs}</pre>}
    </div>
  );
}

// ==========================================
// SOHBETLER TAB
// ==========================================
function SohbetlerTab() {
  const [files, setFiles] = useState<{filename: string, size: number, mtime: string}[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const fetchFiles = async () => {
    const res = await fetch("/api/admin/sohbetler");
    if (res.ok) setFiles(await res.json());
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async (filename: string) => {
    if (!confirm(`"${filename}" kalıcı olarak silinecek. Emin misiniz?`)) return;
    await fetch(`/api/admin/sohbetler/${filename}`, { method: "DELETE" });
    fetchFiles();
  };

  if (editingFile) {
    return <EditorModal filename={editingFile} onClose={() => { setEditingFile(null); fetchFiles(); }} />;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-ink">Sohbetler ({files.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 px-3">Dosya Adı</th>
              <th className="py-2 px-3">Boyut</th>
              <th className="py-2 px-3">Tarih</th>
              <th className="py-2 px-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.filename} className="border-b border-line/50 hover:bg-surface-alt">
                <td className="py-2 px-3 text-ink font-medium">{f.filename}</td>
                <td className="py-2 px-3 text-muted">{(f.size / 1024).toFixed(1)} KB</td>
                <td className="py-2 px-3 text-muted">{new Date(f.mtime).toLocaleString("tr-TR")}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => setEditingFile(f.filename)} className="text-accent hover:underline mr-4">Düzenle</button>
                  <button onClick={() => handleDelete(f.filename)} className="text-red-500 hover:underline">Sil</button>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-muted">Henüz sohbet yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// EDITOR MODAL
// ==========================================
function EditorModal({ filename, onClose }: { filename: string, onClose: () => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/sohbetler/${filename}`)
      .then(r => r.json())
      .then(d => setContent(d.content || ""));
  }, [filename]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/sohbetler/${filename}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-ink">Düzenle: {filename}</h2>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border border-line text-sm text-ink hover:bg-surface-alt">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-strong">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
      <textarea 
        value={content}
        onChange={e => setContent(e.target.value)}
        className="w-full flex-1 min-h-[500px] p-4 font-mono text-sm border border-line rounded bg-surface focus:outline-accent resize-y"
      />
    </div>
  );
}

// ==========================================
// KAVRAMLAR TAB
// ==========================================
function KavramlarTab() {
  const [data, setData] = useState<Record<string, { ad: string, kisa_ad?: string, aliases: string[] }>>({});
  const [saving, setSaving] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [view, setView] = useState<"ui" | "json">("ui");

  useEffect(() => {
    fetch("/api/admin/kavramlar")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setRawJson(JSON.stringify(d, null, 2));
      });
  }, []);

  const handleSave = async (jsonData: string) => {
    try {
      setSaving(true);
      const parsed = JSON.parse(jsonData);
      await fetch("/api/admin/kavramlar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      setData(parsed);
      setRawJson(JSON.stringify(parsed, null, 2));
      alert("Kavramlar kaydedildi!");
    } catch (e: any) {
      alert("JSON Hatası: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-ink">Kavram Sözlüğü ({Object.keys(data).length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setView(view === "ui" ? "json" : "ui")} className="px-3 py-1 rounded border border-line text-sm text-ink hover:bg-surface-alt">
            {view === "ui" ? "JSON Görünümü" : "UI Görünümü"}
          </button>
          <button onClick={() => handleSave(rawJson)} disabled={saving} className="px-3 py-1 rounded bg-accent text-white text-sm hover:bg-accent-strong">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {view === "json" ? (
        <textarea 
          value={rawJson}
          onChange={e => setRawJson(e.target.value)}
          className="w-full flex-1 min-h-[500px] p-4 font-mono text-sm border border-line rounded bg-surface focus:outline-accent resize-y"
        />
      ) : (
        <p className="text-sm text-muted">Şu an UI düzenleme yapım aşamasında. Kavramları düzenlemek için JSON görünümünü kullanabilirsiniz.</p>
      )}
    </div>
  );
}
