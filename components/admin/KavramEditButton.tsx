"use client";

import { useState } from "react";
import { useAdmin } from "./AdminContext";
import KavramEditorModal from "./KavramEditorModal";

export default function KavramEditButton() {
  const { isAdminMode } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAdminMode) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 z-40 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
      >
        <span>✏️</span> Kavramları Düzenle
      </button>

      {isModalOpen && (
        <KavramEditorModal
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
