'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FrameTemplate, PhotoSlot } from '@/types';
import { detectFrameLayout, type FrameDetectionResult } from '@/lib/frameDetector';
import { parseAndValidateSlots } from '@/lib/frameConfig';
import type { CreateFrameParams } from '@/lib/frameAdminService';
import FrameTester from './FrameTester';
import ZoomablePreview from './ZoomablePreview';

interface AddFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFrame: (
    params: CreateFrameParams
  ) => Promise<{ success: boolean; frame?: FrameTemplate; error?: string }>;
}

export default function AddFrameModal({ isOpen, onClose, onAddFrame }: AddFrameModalProps) {
  const [frameName, setFrameName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [detection, setDetection] = useState<FrameDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const [slotsJson, setSlotsJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validSlots, setValidSlots] = useState<PhotoSlot[]>([]);
  const [isJsonAccordionOpen, setIsJsonAccordionOpen] = useState(false);

  // State untuk preview pengujian
  const [compositedUrl, setCompositedUrl] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'composite' | 'wireframe'>('wireframe');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state saat modal ditutup
  const handleClose = useCallback(() => {
    if (detection?.previewUrl) {
      URL.revokeObjectURL(detection.previewUrl);
    }
    if (compositedUrl) {
      URL.revokeObjectURL(compositedUrl);
    }
    setFrameName('');
    setSelectedFile(null);
    setDetection(null);
    setIsDetecting(false);
    setDetectionError(null);
    setSlotsJson('');
    setJsonError(null);
    setValidSlots([]);
    setCompositedUrl(null);
    setActivePreviewTab('wireframe');
    setIsJsonAccordionOpen(false);
    setSubmitError(null);
    onClose();
  }, [detection?.previewUrl, compositedUrl, onClose]);

  // Handle pemilihan file PNG
  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.includes('png')) {
      alert('Harap pilih file berformat PNG transparan.');
      return;
    }

    if (detection?.previewUrl) {
      URL.revokeObjectURL(detection.previewUrl);
    }
    if (compositedUrl) {
      URL.revokeObjectURL(compositedUrl);
      setCompositedUrl(null);
    }

    setSelectedFile(file);
    setIsDetecting(true);
    setDetectionError(null);
    setSubmitError(null);

    // Defaultkan nama frame jika belum diisi dari nama file
    if (!frameName) {
      const cleanName = file.name
        .replace(/\.png$/i, '')
        .replace(/^frame_\d+_?/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setFrameName(cleanName || 'Custom Frame');
    }

    try {
      const result = await detectFrameLayout(file);
      setDetection(result);
      const formattedJson = JSON.stringify(result.slots, null, 2);
      setSlotsJson(formattedJson);
      setValidSlots(result.slots);
      setJsonError(null);
      setActivePreviewTab('wireframe');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendeteksi layout frame PNG';
      console.error('[AddFrameModal] Detection error:', err);
      setDetectionError(msg);
      setDetection(null);
    } finally {
      setIsDetecting(false);
    }
  };

  // Validasi real-time saat teks JSON diedit
  const handleJsonChange = (value: string) => {
    setSlotsJson(value);
    if (!detection) return;

    const res = parseAndValidateSlots(value, detection.canvasWidth, detection.canvasHeight);
    if (res.error) {
      setJsonError(res.error);
      setValidSlots([]);
    } else {
      setJsonError(null);
      setValidSlots(res.slots || []);
    }
  };

  // Copy JSON ke clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(slotsJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Format ulang JSON
  const handleFormatJson = () => {
    if (validSlots.length > 0) {
      setSlotsJson(JSON.stringify(validSlots, null, 2));
      setJsonError(null);
    }
  };

  // Callback dari FrameTester saat hasil compositing selesai
  const handleCompositedChange = (url: string | null) => {
    setCompositedUrl(url);
    if (url) {
      setActivePreviewTab('composite');
    }
  };

  // Unduh hasil preview komposisi
  const handleDownloadPreview = () => {
    if (!compositedUrl || !detection) return;
    const a = document.createElement('a');
    a.href = compositedUrl;
    a.download = `test_composite_${detection.canvasWidth}x${detection.canvasHeight}.png`;
    a.click();
  };

  // Submit ke Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameName.trim()) {
      alert('Silakan isi nama frame.');
      return;
    }
    if (!selectedFile || !detection) {
      alert('Silakan upload file PNG frame terlebih dahulu.');
      return;
    }
    if (validSlots.length === 0) {
      alert('Konfigurasi slots tidak valid. Minimal harus ada 1 slot yang valid.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await onAddFrame({
      name: frameName.trim(),
      file: selectedFile,
      canvasWidth: detection.canvasWidth,
      canvasHeight: detection.canvasHeight,
      slots: validSlots,
    });

    setIsSubmitting(false);

    if (res.success) {
      handleClose();
    } else {
      setSubmitError(res.error || 'Terjadi kesalahan saat menyimpan frame.');
    }
  };

  // Objek template sementara untuk pengujian
  const tempFrameTemplate: FrameTemplate | null = detection
    ? {
        name: frameName || 'Preview Frame',
        file: selectedFile?.name || 'temp.png',
        publicUrl: detection.previewUrl,
        canvasWidth: detection.canvasWidth,
        canvasHeight: detection.canvasHeight,
        slots: validSlots,
      }
    : null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white my-auto"
        >
          {/* Header Modal Ringkas */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0 bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🖼️</span>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Tambah Frame Baru</h2>
                <p className="text-[11px] text-zinc-400">
                  Upload file PNG transparan untuk auto-deteksi ukuran & slots, lalu uji coba dengan foto sendiri.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form Body (Scrollable jika layar sempit) */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 no-scrollbar">
            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs leading-relaxed shrink-0">
                <strong className="font-bold">Gagal menyimpan frame:</strong>
                <p className="mt-0.5">{submitError}</p>
              </div>
            )}

            {/* Bagian 1: Input Nama Frame & File PNG (Compact Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Nama Frame <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Floral Vintage 🌸"
                  value={frameName}
                  onChange={(e) => setFrameName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-amber-500 focus:outline-none text-xs text-white placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  File Frame PNG Transparan <span className="text-red-400">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 hover:border-amber-500/50 text-left text-xs text-zinc-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate pr-2">
                    {selectedFile ? selectedFile.name : 'Pilih file PNG transparan...'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 shrink-0">
                    Browse
                  </span>
                </button>
              </div>
            </div>

            {/* Loading Deteksi */}
            {isDetecting && (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400 shrink-0">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs">Menganalisis dimensi canvas & mendeteksi slot lubang transparan...</p>
              </div>
            )}

            {/* Error Deteksi */}
            {detectionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs shrink-0">
                ⚠️ {detectionError}
              </div>
            )}

            {/* Bagian 2: Hasil Deteksi & Workspace 2-Column */}
            {detection && (
              <div className="flex flex-col gap-3.5">
                {/* Warnings (jika ada) */}
                {detection.warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed"
                  >
                    ⚠️ {warn}
                  </div>
                ))}

                {/* Strip Badge Spesifikasi Canvas (Sangat Ringkas) */}
                <div className="flex items-center flex-wrap gap-2 px-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                    <span className="text-zinc-500 font-sans text-[11px]">Dimensi:</span>
                    <strong className="text-white font-bold">{detection.canvasWidth} × {detection.canvasHeight} px</strong>
                  </div>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                    <span className="text-zinc-500 font-sans text-[11px]">Rasio:</span>
                    <span className="text-amber-400 font-semibold">
                      {(detection.canvasWidth / detection.canvasHeight).toFixed(2)}:1
                    </span>
                  </div>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                    <span className="text-zinc-500 font-sans text-[11px]">Slot:</span>
                    <span className="text-green-400 font-bold">{validSlots.length} Slot Terdeteksi</span>
                  </div>
                  {selectedFile && (
                    <>
                      <span className="text-zinc-700">•</span>
                      <span className="text-[11px] text-zinc-400">
                        Ukuran File: {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </>
                  )}
                </div>

                {/* Grid 2 Kolom: Kiri (Kontrol & Konfigurasi) vs Kanan (Preview Zoomable) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Kolom Kiri: Kontrol Uji Coba & Slot JSON */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    {/* Frame Tester (Uji Foto Webcam / Upload) */}
                    {tempFrameTemplate && validSlots.length > 0 && (
                      <FrameTester
                        frameTemplate={tempFrameTemplate}
                        onCompositedUrlChange={handleCompositedChange}
                        hidePreview={true}
                      />
                    )}

                    {/* Accordion Konfigurasi Slot JSON (Dapat Diciutkan agar Kompak) */}
                    <div className="rounded-xl bg-zinc-950/70 border border-white/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsJsonAccordionOpen((prev) => !prev)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">
                            📐 Konfigurasi Koordinat Slots
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                            {validSlots.length} slot
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {isJsonAccordionOpen ? '▲ Tutup' : '▼ Edit JSON'}
                        </span>
                      </button>

                      {isJsonAccordionOpen && (
                        <div className="p-3 border-t border-white/10 flex flex-col gap-2 bg-zinc-950">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">
                              Format: JSON Array
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleFormatJson}
                                className="text-[10px] text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                              >
                                Format
                              </button>
                              <button
                                type="button"
                                onClick={handleCopyJson}
                                className="text-[10px] text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
                              >
                                {copiedJson ? '✓ Disalin' : '📋 Copy'}
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={6}
                            value={slotsJson}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            className={`w-full p-2.5 font-mono text-[11px] rounded-lg bg-zinc-900 border ${
                              jsonError ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-amber-500'
                            } focus:outline-none text-zinc-200 placeholder-zinc-600 leading-relaxed`}
                          />

                          {jsonError && (
                            <p className="text-[11px] text-red-400 font-medium">⚠️ {jsonError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kolom Kanan: Viewport Preview Interaktif dengan Fitur Zoom In */}
                  <div className="lg:col-span-7 flex flex-col gap-2">
                    {/* Tab Switcher: Hasil Komposisi vs Overlay Posisi Slot */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setActivePreviewTab('composite')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activePreviewTab === 'composite'
                              ? 'bg-amber-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>📸 Hasil Komposisi</span>
                          {compositedUrl && (
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePreviewTab('wireframe')}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            activePreviewTab === 'wireframe'
                              ? 'bg-amber-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>📐 Wireframe Slot</span>
                        </button>
                      </div>

                      {/* Tombol aksi khusus jika preview aktif */}
                      {activePreviewTab === 'composite' && compositedUrl && (
                        <button
                          type="button"
                          onClick={handleDownloadPreview}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                          title="Unduh hasil tes foto komposisi"
                        >
                          ⬇️ Unduh Preview
                        </button>
                      )}
                    </div>

                    {/* Konten Tab Aktif dengan Komponen ZoomablePreview */}
                    {activePreviewTab === 'composite' ? (
                      compositedUrl ? (
                        <ZoomablePreview
                          src={compositedUrl}
                          alt="Preview Hasil Komposisi"
                          canvasWidth={detection.canvasWidth}
                          canvasHeight={detection.canvasHeight}
                          maxHeightClass="max-h-95 min-h-65"
                        />
                      ) : (
                        <div className="w-full min-h-65 max-h-95 rounded-xl bg-zinc-950/80 border border-white/10 flex flex-col items-center justify-center p-6 text-center gap-2">
                          <span className="text-3xl">📸</span>
                          <h4 className="text-xs font-bold text-zinc-200">
                            Belum Ada Foto Uji Coba
                          </h4>
                          <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                            Gunakan panel di sebelah kiri (Webcam atau Upload File) untuk menguji foto asli Anda pada frame ini.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActivePreviewTab('wireframe')}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-amber-400 font-semibold cursor-pointer transition-colors"
                          >
                            📐 Lihat Posisi Slot Wireframe
                          </button>
                        </div>
                      )
                    ) : (
                      <ZoomablePreview
                        src={detection.previewUrl}
                        alt="Wireframe Deteksi Posisi Slot"
                        canvasWidth={detection.canvasWidth}
                        canvasHeight={detection.canvasHeight}
                        slots={validSlots}
                        showSlots={true}
                        maxHeightClass="max-h-95 min-h-65"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons Modal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 shrink-0 mt-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !detection || validSlots.length === 0 || !frameName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Simpan & Upload ke Supabase</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
