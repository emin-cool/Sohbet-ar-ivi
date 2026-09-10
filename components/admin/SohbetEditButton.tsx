"use client";

import { useState } from "react";
import { useAdmin } from "./AdminContext";
import InlineEditorModal from "./InlineEditorModal";

interface SohbetEditButtonProps {
  slug: string;
}

export default function SohbetEditButton({ slug }: SohbetEditButtonProps) {
  const { isAdminMode } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAdminMode) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 z-40 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
      >
        <span>✏️</span> Sohbeti Düzenle
      </button>

      {isModalOpen && (
        <InlineEditorModal
          slug={slug}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={() => {
            // Basitçe sayfayı yenileyerek yeni verinin sunucudan gelmesini sağla
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
