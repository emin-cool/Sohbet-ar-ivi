"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "sohbetler" | "kavramlar" | "ayarlar";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("sohbetler");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const isAdmin = session?.user?.role === "ADMIN";

  if (status === "loading") {
    return <div className="p-20 text-center text-muted">Yükleniyor...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-site px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Erişim Engellendi</h1>
        <p className="text-lg text-ink/70">
          Yönetim paneli yalnızca admin yetkisine sahip kullanıcılar için kullanılabilir.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-serif text-3xl font-bold text-ink">
          Yönetim Paneli
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">👤 {session?.user?.name}</span>
          <Link href="/" className="text-sm text-accent hover:underline">
            Siteye Dön &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-line">
        <TabButton active={activeTab === "sohbetler"} onClick={() => setActiveTab("sohbetler")}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Sohbet Yönetimi
        </TabButton>
        <TabButton active={activeTab === "kavramlar"} onClick={() => setActiveTab("kavramlar")}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          Kavram Sözlüğü
        </TabButton>
        <TabButton active={activeTab === "ayarlar"} onClick={() => setActiveTab("ayarlar")}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          Ayarlar
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === "sohbetler" && <SohbetYonetimi />}
        {activeTab === "kavramlar" && <KavramlarTab />}
        {activeTab === "ayarlar" && <AyarlarTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-ink hover:border-line"
      }`}
    >
      {children}
    </button>
  );
}

// ==========================================
// SOHBET YÖNETİMİ — Birleşik Yükleme + Liste
// ==========================================
interface SohbetRow {
  id: string;
  slug: string;
  dosyaAdi: string;
  baslik: string;
  updatedAt: string;
}

function SohbetYonetimi() {
  // --- Sohbet listesi state ---
  const [sohbetler, setSohbetler] = useState<SohbetRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // --- Upload state ---
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [sonuclar, setSonuclar] = useState<
    Array<{
      dosya: string;
      basarili: boolean;
      slug?: string;
      hata?: string;
      uyarilar?: string[];
    }>
  >([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".odt", ".txt", ".md", ".markdown", ".zip"];

  // --- Sohbet listesi ---
  const fetchSohbetler = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/admin/sohbetler");
      if (res.ok) setSohbetler(await res.json());
    } catch (e) {}
    setListLoading(false);
  }, []);

  useEffect(() => {
    fetchSohbetler();
  }, [fetchSohbetler]);

  const filteredSohbetler = sohbetler.filter(
    (s) =>
      s.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Tek sil ---
  const handleDeleteOne = async (slug: string, baslik: string) => {
    if (!confirm(`"${baslik}" kalıcı olarak silinecek. Emin misiniz?`)) return;
    const res = await fetch(`/api/admin/sohbetler/detay?slug=${slug}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSohbetler((prev) => prev.filter((s) => s.slug !== slug));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  // --- Seçilenleri sil ---
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `${selectedIds.size} sohbet kalıcı olarak silinecek. Emin misiniz?`
      )
    )
      return;

    setBulkDeleting(true);
    for (const slug of selectedIds) {
      await fetch(`/api/admin/sohbetler/detay?slug=${slug}`, {
        method: "DELETE",
      });
    }
    setSelectedIds(new Set());
    await fetchSohbetler();
    setBulkDeleting(false);
  };

  // --- Tümünü sil ---
  const handleDeleteAll = async () => {
    if (sohbetler.length === 0) return;
    const input = prompt(
      `DİKKAT: Tüm ${sohbetler.length} sohbet kalıcı olarak silinecek!\n\nOnaylamak için "SİL" yazın:`
    );
    if (input?.trim().toUpperCase() !== "SİL") return;

    setBulkDeleting(true);
    try {
      const res = await fetch("/api/admin/sohbetler", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSohbetler([]);
        setSelectedIds(new Set());
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error || "Silme hatası." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    }
    setBulkDeleting(false);
  };

  // --- Checkbox ---
  const toggleSelect = (slug: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSohbetler.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSohbetler.map((s) => s.slug)));
    }
  };

  // --- Upload ---
  const validateFiles = (fileList: File[]): File[] => {
    const valid: File[] = [];
    for (const f of fileList) {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (ACCEPTED_EXTENSIONS.includes(ext)) valid.push(f);
    }
    return valid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = validateFiles(Array.from(e.target.files));
      if (selected.length === 0) {
        setMessage({ type: "error", text: "Desteklenmeyen dosya formatı." });
      } else {
        setFiles(selected);
        setMessage(null);
      }
      setSonuclar([]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node))
      setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const valid = validateFiles(Array.from(e.dataTransfer.files));
    if (valid.length === 0) {
      setMessage({ type: "error", text: "Desteklenmeyen dosya formatı." });
      return;
    }
    setFiles(valid);
    setMessage(null);
    setSonuclar([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFormatBadge = (name: string) => {
    const ext = name.split(".").pop()?.toUpperCase();
    const colors: Record<string, string> = {
      PDF: "bg-red-100 text-red-700 border-red-200",
      DOCX: "bg-blue-100 text-blue-700 border-blue-200",
      DOC: "bg-blue-100 text-blue-700 border-blue-200",
      TXT: "bg-gray-100 text-gray-700 border-gray-200",
      MD: "bg-purple-100 text-purple-700 border-purple-200",
      MARKDOWN: "bg-purple-100 text-purple-700 border-purple-200",
      ODT: "bg-orange-100 text-orange-700 border-orange-200",
      ZIP: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return (
      <span
        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          colors[ext || ""] || "bg-chip text-muted border-line"
        }`}
      >
        {ext}
      </span>
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setMessage(null);
    setSonuclar([]);
    setUploadProgress(0);

    const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
    const normalFiles = files.filter(f => !f.name.toLowerCase().endsWith('.zip'));

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 15, 85));
      }, 300);

      let allSonuclar: any[] = [];
      let allMessage = "";

      // ZIP dosyalarını tek tek yükle
      for (const zf of zipFiles) {
         const fd = new FormData();
         fd.append("file", zf);
         const res = await fetch("/api/admin/upload-zip", { method: "POST", body: fd });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "ZIP Yükleme hatası.");
         allSonuclar = [...allSonuclar, ...(data.sonuclar || [])];
         allMessage += data.mesaj + " ";
      }

      // Normal dosyaları toplu yükle
      if (normalFiles.length > 0) {
        const formData = new FormData();
        normalFiles.forEach((file) => formData.append("dosya", file));
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Yükleme hatası.");
        allSonuclar = [...allSonuclar, ...(data.sonuclar || [])];
        allMessage += data.message + " ";
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setMessage({ type: "success", text: allMessage.trim() });
      setSonuclar(allSonuclar);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Listeyi yenile
      await fetchSohbetler();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // --- Editor Modal ---
  if (editingSlug) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <EditorModal
          slug={editingSlug}
          onClose={() => {
            setEditingSlug(null);
            fetchSohbetler();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Sohbet Yönetimi
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {sohbetler.length} sohbet kayıtlı
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowUploadArea(!showUploadArea);
              setSonuclar([]);
              setMessage(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              showUploadArea
                ? "bg-ink text-surface hover:bg-muted"
                : "bg-accent text-white hover:bg-accent-strong shadow-sm hover:shadow-md"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showUploadArea ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </>
              )}
            </svg>
            {showUploadArea ? "Kapat" : "Sohbet Ekle"}
          </button>
          {sohbetler.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={bulkDeleting}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-300 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Tümünü Sil
            </button>
          )}
        </div>
      </div>

      {/* Mesaj */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm animate-in ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span className="text-lg flex-shrink-0">{message.type === "success" ? "✅" : "⚠️"}</span>
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-muted hover:text-ink">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Area (collapsible) */}
      {showUploadArea && (
        <div className="rounded-card border border-line bg-surface p-6 shadow-sm space-y-4">
          {/* Desteklenen formatlar */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted font-medium">Desteklenen:</span>
            {["PDF", "DOCX", "DOC", "TXT", "MD", "ZIP"].map((fmt) => (
              <span key={fmt} className="inline-flex items-center rounded-full bg-chip px-2 py-0.5 text-[10px] font-medium text-chip-fg">
                .{fmt.toLowerCase()}
              </span>
            ))}
              · <code className="bg-chip px-1 py-0.5 rounded text-[10px] font-mono">.pdf, .docx, .txt, .md, .zip</code> formatları desteklenir<br/>
              · Birden fazla dosya sürükleyebilirsiniz
          </div>

          {/* Drag & Drop */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? "border-accent bg-accent-soft/20 scale-[1.005]"
                : "border-line hover:border-accent/50 hover:bg-bg"
            } ${files.length > 0 ? "py-4 px-5" : "py-10 px-6"}`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.doc,.odt,.txt,.md,.markdown,.zip"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isUploading}
              className="hidden"
            />

            {files.length === 0 ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`rounded-full p-3 transition-colors ${isDragging ? "bg-accent/10" : "bg-chip"}`}>
                  <svg className={`w-6 h-6 transition-colors ${isDragging ? "text-accent" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-ink">
                  {isDragging ? "Dosyaları buraya bırakın" : "Dosyaları sürükleyip bırakın"}
                </p>
                <p className="text-xs text-muted">
                  veya <span className="text-accent font-medium">tıklayarak seçin</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink">{files.length} dosya seçildi</span>
                  <button
                    onClick={() => { setFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-line bg-bg p-2.5 group">
                    <svg className="w-5 h-5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 text-sm text-ink truncate">{f.name}</span>
                    <span className="text-xs text-muted">{formatSize(f.size)}</span>
                    {getFormatBadge(f.name)}
                    <button
                      onClick={() => removeFile(i)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-accent" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Dönüştürülüyor...
                </span>
                <span className="font-mono text-accent">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1 rounded-full bg-chip overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md disabled:bg-line disabled:text-muted disabled:shadow-none"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Yükleniyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Yükle ve Dönüştür
              </>
            )}
          </button>

          {/* Sonuçlar */}
          {sonuclar.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-line">
              <h3 className="text-sm font-semibold text-ink">Sonuçlar:</h3>
              {sonuclar.map((s, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  s.basarili ? "bg-green-50/50 border-green-200" : "bg-red-50/50 border-red-200"
                }`}>
                  <span>{s.basarili ? "✅" : "❌"}</span>
                  <span className="font-medium text-ink flex-1 truncate">{s.dosya}</span>
                  {s.slug && (
                    <Link href={`/sohbet/${s.slug}`} className="text-xs text-accent hover:underline" target="_blank">
                      Görüntüle →
                    </Link>
                  )}
                  {s.hata && <span className="text-xs text-red-600 truncate max-w-[200px]" title={s.hata}>{s.hata}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sohbet Listesi */}
      <div className="rounded-card border border-line bg-surface shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 bg-bg/50">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="text"
              placeholder="Sohbet ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-1.5 text-sm focus:outline-accent"
            />
          </div>

          {/* Seçilenleri sil */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {bulkDeleting ? "Siliniyor..." : `${selectedIds.size} Seçileni Sil`}
            </button>
          )}

          <span className="text-xs text-muted hidden sm:block">
            {filteredSohbetler.length} / {sohbetler.length} sohbet
          </span>
        </div>

        {/* Table */}
        {listLoading ? (
          <div className="py-16 text-center">
            <svg className="animate-spin h-6 w-6 text-accent mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-muted">Yükleniyor...</p>
          </div>
        ) : filteredSohbetler.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 mx-auto text-line mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm text-muted">
              {sohbetler.length === 0
                ? 'Henüz sohbet yok. "Sohbet Ekle" butonuyla dosya yükleyin.'
                : "Aramayla eşleşen sohbet bulunamadı."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg/30 text-xs text-muted uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredSohbetler.length && filteredSohbetler.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-line accent-accent"
                    />
                  </th>
                  <th className="py-2.5 px-3">Başlık</th>
                  <th className="py-2.5 px-3 w-40 hidden md:table-cell">Son Güncelleme</th>
                  <th className="py-2.5 px-3 w-32 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredSohbetler.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-line/50 transition-colors ${
                      selectedIds.has(s.slug) ? "bg-accent-soft/10" : "hover:bg-bg/50"
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.slug)}
                        onChange={() => toggleSelect(s.slug)}
                        className="rounded border-line accent-accent"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-ink">{s.baslik}</div>
                      <div className="text-xs text-muted">{s.slug}</div>
                    </td>
                    <td className="py-2.5 px-3 text-muted text-xs hidden md:table-cell">
                      {new Date(s.updatedAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/sohbet/${s.slug}`}
                          target="_blank"
                          className="rounded p-1.5 text-muted hover:text-accent hover:bg-accent-soft/20 transition-colors"
                          title="Görüntüle"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setEditingSlug(s.slug)}
                          className="rounded p-1.5 text-muted hover:text-accent hover:bg-accent-soft/20 transition-colors"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteOne(s.slug, s.baslik)}
                          className="rounded p-1.5 text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import RichTextEditor from "@/components/admin/RichTextEditor";

// ==========================================
// EDITOR MODAL — DB üzerinden düzenleme
// ==========================================
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

function EditorModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [baslik, setBaslik] = useState("");
  const [ayetler, setAyetler] = useState<{sure: string, sureNo: number, ayet: string}[]>([]);
  const [selectedSure, setSelectedSure] = useState("");
  const [ayetNo, setAyetNo] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/sohbetler/detay?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setContent(d.content || "");
          setBaslik(d.baslik || "");
          let parsedAyetler = [];
          try { parsedAyetler = JSON.parse(d.ayetlerJson || "[]"); } catch (e) {}
          setAyetler(parsedAyetler);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Sohbet verisi yüklenemedi.");
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
      setSaving(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Kaydetme sırasında bir hata oluştu.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[700px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-ink">Düzenle: {baslik || slug}</h2>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-line text-sm text-ink hover:bg-bg transition-colors"
          >
            ← Geri
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-strong disabled:opacity-50 transition-colors"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center">
          <span>Hata: {error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-800 text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted py-8">Yükleniyor...</p>
      ) : (
        <div className="flex flex-col flex-1 h-full">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Başlık</label>
              <input
                type="text"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent"
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
                  className="w-24 rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent"
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
        </div>
      )}
    </div>
  );
}

// ==========================================
// KAVRAMLAR TAB — DB CRUD
// ==========================================
function KavramlarTab() {
  const [data, setData] = useState<
    Record<string, { ad: string; kisa_ad?: string; aliases: string[] }>
  >({});
  const [saving, setSaving] = useState(false);
  const [rawJson, setRawJson] = useState("");
  const [view, setView] = useState<"ui" | "json">("ui");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ad: "", kisa_ad: "", aliases: "" });

  const [newKavram, setNewKavram] = useState({
    slug: "",
    ad: "",
    kisa_ad: "",
    aliases: "",
  });

  useEffect(() => {
    fetch("/api/admin/kavramlar")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          setRawJson(JSON.stringify(d, null, 2));
        }
        setLoading(false);
      });
  }, []);

  const filteredEntries = Object.entries(data).filter(([slug, val]) =>
    slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    val.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
    val.aliases.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSave = async (jsonData: string) => {
    try {
      setSaving(true);
      const parsed = JSON.parse(jsonData);
      const res = await fetch("/api/admin/kavramlar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setData(parsed);
      setRawJson(JSON.stringify(parsed, null, 2));
      alert("Kavramlar kaydedildi!");
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKavram.slug || !newKavram.ad) return alert("Slug ve ad zorunludur.");
    if (data[newKavram.slug]) return alert("Bu slug ile bir kavram zaten mevcut.");
    
    const updatedData = { ...data };
    updatedData[newKavram.slug] = {
      ad: newKavram.ad,
      kisa_ad: newKavram.kisa_ad || undefined,
      aliases: newKavram.aliases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setData(updatedData);
    setRawJson(JSON.stringify(updatedData, null, 2));
    setNewKavram({ slug: "", ad: "", kisa_ad: "", aliases: "" });
  };

  const handleDelete = (slug: string) => {
    if (!window.confirm(`"${slug}" kavramını silmek istediğinize emin misiniz?`)) return;
    const updatedData = { ...data };
    delete updatedData[slug];
    setData(updatedData);
    setRawJson(JSON.stringify(updatedData, null, 2));
  };

  const startEdit = (slug: string) => {
    const val = data[slug];
    setEditingSlug(slug);
    setEditForm({
      ad: val.ad,
      kisa_ad: val.kisa_ad || "",
      aliases: val.aliases.join(", "),
    });
  };

  const saveEdit = () => {
    if (!editingSlug) return;
    const updatedData = { ...data };
    updatedData[editingSlug] = {
      ad: editForm.ad,
      kisa_ad: editForm.kisa_ad || undefined,
      aliases: editForm.aliases.split(",").map((s) => s.trim()).filter(Boolean),
    };
    setData(updatedData);
    setRawJson(JSON.stringify(updatedData, null, 2));
    setEditingSlug(null);
  };

  if (loading) {
    return <p className="text-center text-muted py-8">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          Kavram Sözlüğü ({Object.keys(data).length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "ui" ? "json" : "ui")}
            className="px-3 py-1.5 rounded-lg border border-line text-sm text-ink hover:bg-bg transition-colors"
          >
            {view === "ui" ? "JSON" : "Kart"} Görünümü
          </button>
          <button
            onClick={() => handleSave(rawJson)}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-strong disabled:opacity-50 transition-colors"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {view === "json" ? (
        <div className="rounded-card border border-line bg-surface p-4 shadow-sm">
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            className="w-full min-h-[500px] p-4 font-mono text-sm border border-line rounded-lg bg-bg focus:outline-accent resize-y"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Arama */}
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="text"
              placeholder="Kavram ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface pl-9 pr-3 py-2 text-sm focus:outline-accent"
            />
          </div>

          {/* Yeni kavram ekle */}
          <form onSubmit={handleAdd} className="rounded-card border border-line bg-surface p-4 shadow-sm">
            <h3 className="font-semibold text-ink mb-3 text-sm">Yeni Kavram Ekle</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input type="text" placeholder="Slug (örn: gercek-kendilik)" value={newKavram.slug} onChange={(e) => setNewKavram({ ...newKavram, slug: e.target.value })} className="px-3 py-2 border border-line rounded-lg focus:outline-accent text-sm" required />
              <input type="text" placeholder="Ad (örn: Gerçek Kendilik)" value={newKavram.ad} onChange={(e) => setNewKavram({ ...newKavram, ad: e.target.value })} className="px-3 py-2 border border-line rounded-lg focus:outline-accent text-sm" required />
              <input type="text" placeholder="Kısa Ad (opsiyonel)" value={newKavram.kisa_ad} onChange={(e) => setNewKavram({ ...newKavram, kisa_ad: e.target.value })} className="px-3 py-2 border border-line rounded-lg focus:outline-accent text-sm" />
              <input type="text" placeholder="Eş Anlamlılar (virgülle)" value={newKavram.aliases} onChange={(e) => setNewKavram({ ...newKavram, aliases: e.target.value })} className="px-3 py-2 border border-line rounded-lg focus:outline-accent text-sm" />
            </div>
            <button type="submit" className="mt-3 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-strong transition-colors">
              Ekle
            </button>
          </form>

          {/* Kavram kartları */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map(([slug, val]) => (
              <div key={slug} className="rounded-card border border-line bg-surface p-4 shadow-sm flex flex-col justify-between group hover:shadow-card-hover transition-shadow">
                {editingSlug === slug ? (
                  <div className="space-y-2">
                    <input type="text" value={editForm.ad} onChange={(e) => setEditForm({ ...editForm, ad: e.target.value })} className="w-full px-2 py-1 border border-line rounded text-sm focus:outline-accent" placeholder="Ad" />
                    <input type="text" value={editForm.kisa_ad} onChange={(e) => setEditForm({ ...editForm, kisa_ad: e.target.value })} className="w-full px-2 py-1 border border-line rounded text-sm focus:outline-accent" placeholder="Kısa Ad" />
                    <input type="text" value={editForm.aliases} onChange={(e) => setEditForm({ ...editForm, aliases: e.target.value })} className="w-full px-2 py-1 border border-line rounded text-sm focus:outline-accent" placeholder="Eş anlamlılar (virgülle)" />
                    <div className="flex gap-1.5">
                      <button onClick={saveEdit} className="px-2.5 py-1 bg-accent text-white text-xs rounded hover:bg-accent-strong">Kaydet</button>
                      <button onClick={() => setEditingSlug(null)} className="px-2.5 py-1 border border-line text-xs rounded hover:bg-bg">İptal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-ink">{val.ad}</h3>
                        {val.kisa_ad && <p className="text-xs text-muted">Kısa: {val.kisa_ad}</p>}
                        <p className="text-xs text-muted mt-0.5">slug: {slug}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(slug)} className="p-1 text-muted hover:text-accent transition-colors" title="Düzenle">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(slug)} className="p-1 text-muted hover:text-red-500 transition-colors" title="Sil">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {val.aliases.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {val.aliases.map((a, i) => (
                          <span key={i} className="inline-block rounded-full bg-chip px-2 py-0.5 text-xs text-chip-fg">{a}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <p className="text-center text-muted py-8 text-sm">
              {searchQuery ? "Aramayla eşleşen kavram bulunamadı." : "Henüz kavram yok."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// AYARLAR TAB — Şifre Değiştirme
// ==========================================
function AyarlarTab() {
  const { data: session } = useSession();
  const [mevcutSifre, setMevcutSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (yeniSifre.length < 6) {
      setMessage({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    if (yeniSifre !== yeniSifreTekrar) {
      setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/sifre-degistir", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mevcutSifre, yeniSifre }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Bir hata oluştu." });
      } else {
        setMessage({ type: "success", text: "Şifre başarıyla değiştirildi!" });
        setMevcutSifre("");
        setYeniSifre("");
        setYeniSifreTekrar("");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Şifre Değiştir
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hesabınızın şifresini güncelleyin.
        </p>
      </div>

      {/* Kullanıcı bilgisi */}
      <div className="rounded-card border border-line bg-bg p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white font-bold text-lg">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-medium text-ink">{session?.user?.name}</p>
            <p className="text-xs text-muted">{session?.user?.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}</p>
          </div>
        </div>
      </div>

      {/* Şifre formu */}
      <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Mevcut Şifre</label>
          <div className="relative">
            <input
              type={showPasswords ? "text" : "password"}
              value={mevcutSifre}
              onChange={(e) => setMevcutSifre(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent pr-10"
              placeholder="Mevcut şifreniz"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Yeni Şifre</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={yeniSifre}
            onChange={(e) => setYeniSifre(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-accent"
            placeholder="En az 6 karakter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Yeni Şifre (Tekrar)</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={yeniSifreTekrar}
            onChange={(e) => setYeniSifreTekrar(e.target.value)}
            required
            minLength={6}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-accent ${
              yeniSifreTekrar && yeniSifre !== yeniSifreTekrar
                ? "border-red-300 bg-red-50/50"
                : "border-line"
            }`}
            placeholder="Yeni şifrenizi tekrar girin"
          />
          {yeniSifreTekrar && yeniSifre !== yeniSifreTekrar && (
            <p className="mt-1 text-xs text-red-500">Şifreler eşleşmiyor.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="rounded border-line accent-accent"
          />
          <label htmlFor="showPasswords" className="text-xs text-muted cursor-pointer">
            Şifreleri göster
          </label>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !mevcutSifre || !yeniSifre || !yeniSifreTekrar || yeniSifre !== yeniSifreTekrar}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-strong hover:shadow-md disabled:bg-line disabled:text-muted disabled:shadow-none"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Kaydediliyor...
            </>
          ) : (
            "Şifreyi Değiştir"
          )}
        </button>
      </form>
    </div>
  );
}
