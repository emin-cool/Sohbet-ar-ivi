"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import TurndownService from "turndown";
import { marked } from "marked";

// Dinamik olarak ReactQuill'i yükle (SSR hatasını önlemek için)
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p className="p-4 text-muted">Editör yükleniyor...</p>,
});

interface RichTextEditorProps {
  initialValue: string; // Markdown
  onChange: (markdown: string) => void;
}

export default function RichTextEditor({ initialValue, onChange }: RichTextEditorProps) {
  const [htmlContent, setHtmlContent] = useState("");
  const turndownService = React.useMemo(() => new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  }), []);
  
  // Sadece ilk yüklemede Markdown'u HTML'e çevir
  useEffect(() => {
    // marked.parse Promise veya string dönebilir, biz string olarak bekliyoruz
    const html = marked.parse(initialValue) as string;
    setHtmlContent(html);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (content: string) => {
    setHtmlContent(content);
    const markdown = turndownService.turndown(content);
    onChange(markdown);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="bg-white text-black h-full flex flex-col rounded-lg overflow-hidden border border-line">
      <ReactQuill
        theme="snow"
        value={htmlContent}
        onChange={handleChange}
        modules={modules}
        className="flex-1 flex flex-col h-full"
      />
      <style jsx global>{`
        .ql-container {
          flex: 1;
          overflow-y: auto;
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-editor {
          min-height: 100%;
        }
      `}</style>
    </div>
  );
}
