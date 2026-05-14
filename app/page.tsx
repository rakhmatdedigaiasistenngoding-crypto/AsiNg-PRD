"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Send,
  FileText,
  Download,
  ArrowUp,
  User as UserIcon,
  Calendar,
  Trash2,
  FileJson,
  FolderOpen,
  Clock,
  RefreshCw,
  Save,
  ChevronDown,
  Menu,
  X,
  Info,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Target,
  Users,
  BarChart3,
  Shield,
  MonitorSmartphone,
  Smartphone,
  AlertTriangle
} from "lucide-react"
import jsPDF from "jspdf"

// --- KOMPONEN HELPER: FORMAT TEKS AI ---
function FormattedMessage({ text }: { text: string }) {
  const parts = text.split(/(\*\*<u>.*?<\/u>\*\*)/g);
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith('**<u>') && part.endsWith('</u>**')) {
            const word = part.replace('**<u>', '').replace('</u>**', '');
            return (
              <span key={index} className="font-bold underline text-emerald-700 bg-emerald-50 px-1 rounded">
                {word}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    </div>
  );
}

// Helper untuk membersihkan tag formatting HTML/Markdown
function stripFormatting(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*<u>/g, '')
    .replace(/<\/u>\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/<u>/g, '')
    .replace(/<\/u>/g, '');
}

// --- KONSTANTA VERSI APLIKASI ---
const APP_VERSION = "1.3";

// --- KOMPONEN UTAMA DASHBOARD ---
const PHASES = [
  { id: 1, n: "Discovery", desc: "Temukan akar masalah & peluang" },
  { id: 2, n: "Analysis", desc: "Analisis pengguna & kebutuhan" },
  { id: 3, n: "Technical", desc: "Arsitektur & stack teknologi" },
  { id: 4, n: "Deliver", desc: "Roadmap, risiko & peluncuran" }
];

export default function PRDMentorDashboard() {
  const [activePhase, setActivePhase] = useState(1);
  const [phaseMenuOpen, setPhaseMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("chat");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Halo! Saya **RDG**, mentor digital Anda.\n\nSebelum kita bedah ide hebat Anda, boleh saya tahu nama Anda siapa?" }
  ]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isVIP, setIsVIP] = useState(false);

  // STATE UNTUK HIERARCHICAL SUMMARIZATION
  const [chunkList, setChunkList] = useState<string[]>([]);
  const [masterSummary, setMasterSummary] = useState<string>("");

  const [prdData, setPrdData] = useState({
    userName: "",
    creationDate: "",
    lastUpdated: "",
    title: "Proyek Belum Berjudul",
    label: "DRAFTING",
    sections: [
      { id: "1", title: "1. Executive Summary", items: [{ label: "Problem Statement", value: "TBD" }, { label: "Proposed Solution", value: "TBD" }, { label: "Success Criteria", value: "TBD" }] },
      { id: "2", title: "2. User Experience & Functionality", items: [{ label: "Calon Pengguna", value: "TBD" }, { label: "User Stories", value: "TBD" }, { label: "Acceptance Criteria", value: "TBD" }, { label: "Non-Goals", value: "TBD" }] },
      { id: "3", title: "3. Technical Architecture", items: [{ label: "Tech Stack / Tools", value: "TBD" }, { label: "Data Flow", value: "TBD" }, { label: "Security & Privacy", value: "TBD" }, { label: "AI System Requirements", value: "TBD" }] },
      { id: "4", title: "4. Risks & Roadmap", items: [{ label: "MVP Timeline", value: "TBD" }, { label: "Phased Rollout", value: "TBD" }, { label: "Potential Risks", value: "TBD" }] }
    ]
  });

  // Referensi untuk input file (Import)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. LOGIKA AUTO-SAVE & LOAD (LOCAL STORAGE)
  useEffect(() => {
    const savedData = localStorage.getItem("rdg_app_state");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.messages) setMessages(parsed.messages);
      if (parsed.prdData) setPrdData(parsed.prdData);
      if (parsed.activePhase) setActivePhase(parsed.activePhase);
      if (parsed.isVIP) setIsVIP(parsed.isVIP);
      if (parsed.chunkList) setChunkList(parsed.chunkList);
      if (parsed.masterSummary) setMasterSummary(parsed.masterSummary);
    }
  }, []);

  useEffect(() => {
    const stateToSave = { messages, prdData, activePhase, isVIP, chunkList, masterSummary };
    localStorage.setItem("rdg_app_state", JSON.stringify(stateToSave));
  }, [messages, prdData, activePhase, isVIP, chunkList, masterSummary]);

  // --- LOGIKA PWA INSTALLATION ---
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Deteksi iOS
    const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(isIPhone);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- LOGIKA MENDETEKSI UPDATE PWA ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // 2. FUNGSI RESET (MULAI BARU)
  const handleReset = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua draf dan memulai percakapan baru?")) {
      localStorage.removeItem("rdg_app_state");
      window.location.reload();
    }
  };

  // --------------------------------------------------------
  // FUNGSI BARU: BACKUP (EXPORT JSON) & RESTORE (IMPORT JSON)
  // --------------------------------------------------------
  const handleBackupProject = () => {
    // stateToSave menyimpan prdData apa adanya (lastUpdated tidak diubah menjadi hari ini secara paksa)
    const stateToSave = { messages, prdData, activePhase, isVIP, chunkList, masterSummary };
    
    const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Format tanggal untuk nama file: DD-MM-YYYY (Tanggal backup dilakukan)
    const dateFileStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const safeUserName = prdData.userName ? prdData.userName.replace(/\s+/g, '_') : 'Anonim';
    link.download = `Backup_${dateFileStr}_${safeUserName}_${prdData.title.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validasi sederhana apakah ini file RDG yang benar
        if (parsed.messages && parsed.prdData) {
          setMessages(parsed.messages);
          setPrdData(parsed.prdData);
          if (parsed.activePhase) setActivePhase(parsed.activePhase);
          if (parsed.isVIP !== undefined) setIsVIP(parsed.isVIP);
          alert("Data berhasil dipulihkan! Selamat melanjutkan proyek Anda.");
        } else {
          alert("Format file tidak dikenali. Pastikan ini adalah file Backup (.json) dari RDG.");
        }
      } catch (err) {
        alert("Gagal membaca file Backup. File mungkin rusak.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input agar bisa upload file yang sama berkali-kali
  };
  // --------------------------------------------------------

  // 3. FUNGSI EXPORT PDF (TEXT-BASED)
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let cursorY = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(prdData.title.toUpperCase(), margin, cursorY);
    cursorY += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Tipe Dokumen : ${prdData.label}`, margin, cursorY);
    cursorY += 6;
    doc.text(`Penulis      : ${prdData.userName || "Anonim"}`, margin, cursorY);
    cursorY += 6;
    doc.text(`Tgl Dibuat   : ${prdData.creationDate || "-"}`, margin, cursorY);
    cursorY += 6;
    if (prdData.lastUpdated && prdData.lastUpdated !== prdData.creationDate) {
      doc.text(`Tgl Update   : ${prdData.lastUpdated}`, margin, cursorY);
      cursorY += 6;
    }
    cursorY += 4;

    doc.setDrawColor(200);
    doc.line(margin, cursorY, 190, cursorY);
    cursorY += 15;

    prdData.sections.forEach((section) => {
      if (cursorY > 260) { doc.addPage(); cursorY = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105);
      doc.text(section.title, margin, cursorY);
      cursorY += 10;
      doc.setFontSize(10);
      doc.setTextColor(0);

      section.items.forEach((item) => {
        if (cursorY > 270) { doc.addPage(); cursorY = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(`${item.label}:`, margin, cursorY);
        cursorY += 6;
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(item.value || "TBD", 170);
        doc.text(splitText, margin, cursorY);
        cursorY += (splitText.length * 5) + 8;
      });
      cursorY += 5;
    });

    doc.save(`RDG_Draf_${prdData.title.replace(/\s+/g, '_')}.pdf`);
  };

  // 4. FUNGSI EXPORT MARKDOWN
  const handleExportMarkdown = () => {
    let content = `# ${prdData.title}\n\n`;
    content += `**Penulis:** ${prdData.userName}\n`;
    content += `**Tanggal Dibuat:** ${prdData.creationDate}\n`;
    if (prdData.lastUpdated && prdData.lastUpdated !== prdData.creationDate) {
      content += `**Terakhir Diperbarui:** ${prdData.lastUpdated}\n`;
    }
    content += `**Tipe:** ${prdData.label}\n\n---\n\n`;

    prdData.sections.forEach(s => {
      content += `## ${s.title}\n`;
      s.items.forEach(i => {
        content += `### ${i.label}\n${i.value}\n\n`;
      });
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDG_${prdData.title.replace(/\s+/g, '_')}.md`;
    link.click();
  };

  const activePhaseData = PHASES.find(p => p.id === activePhase)!;

  // Saat fase berubah di mobile
  const handlePhaseChange = (id: number) => {
    setActivePhase(id);
    // Tidak lagi memaksa pindah ke tab chat jika sedang di tab dokumen
    setPhaseMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* BANNER NOTIFIKASI UPDATE PWA */}
      {updateAvailable && (
        <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <p className="text-sm font-medium">Pembaruan sistem tersedia! Refresh untuk versi terbaru.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => window.location.reload()} className="bg-white text-emerald-700 hover:bg-emerald-50 h-8 text-xs font-bold px-4">
              Refresh Sekarang
            </Button>
            <button onClick={() => setUpdateAvailable(false)} className="text-emerald-200 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      <header className="flex items-center justify-between border-b bg-white px-4 sm:px-6 py-3 shrink-0 z-20 shadow-sm">
        <button onClick={() => setShowAboutModal(true)} className={`flex items-center gap-2 font-bold hover:opacity-80 transition-opacity cursor-pointer ${isVIP ? 'text-amber-500' : 'text-emerald-600'}`} title="Tentang Aplikasi">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm ${isVIP ? 'bg-gradient-to-br from-amber-400 to-yellow-600' : 'bg-emerald-600'}`}>
            <FileText size={18} />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="hidden sm:inline">AI PRD Mentor</span>
            <span className={`hidden sm:inline text-[10px] font-medium ${isVIP ? 'text-amber-500' : 'text-slate-400'}`}>by Rakhmat Dedi G</span>
          </div>
        </button>

        {/* === NAVIGASI FASE: DROPDOWN di mobile, INLINE di desktop === */}
        <div className="relative">
          {/* Mobile: Dropdown fase */}
          <button
            onClick={() => setPhaseMenuOpen(o => !o)}
            className="flex md:hidden items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-lg"
          >
            <span>{activePhaseData.id}. {activePhaseData.n}</span>
            <ChevronDown size={14} className={`transition-transform ${phaseMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {phaseMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 md:hidden">
              {PHASES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePhaseChange(p.id)}
                  className={`w-full text-left px-4 py-3 text-xs transition-colors ${
                    activePhase === p.id ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold">{p.id}. {p.n}</p>
                  <p className={`text-[10px] mt-0.5 ${activePhase === p.id ? 'text-emerald-100' : 'text-slate-400'}`}>{p.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Desktop: Inline tabs */}
          <div className="hidden md:flex gap-4 lg:gap-6 text-[10px] lg:text-xs font-medium text-slate-400">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePhase(p.id)}
                className={`px-1 pb-1 transition-all ${activePhase === p.id ? "text-emerald-600 border-b-2 border-emerald-600 font-bold" : "hover:text-slate-600"}`}
              >
                {p.id}. {p.n}
              </button>
            ))}
          </div>
        </div>

        {/* --- AREA TOMBOL HEADER --- */}
        <div className="flex gap-2 items-center">

          {/* Tombol Reset - selalu tampil, merah */}
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Reset Proyek">
            <Trash2 size={16} />
          </Button>

          {/* ====== DESKTOP: Tombol individual ====== */}
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportProject} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Import Data (.json)" className="hidden md:flex border-slate-200 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <FolderOpen size={14} /> <span className="hidden lg:inline">Import</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleBackupProject} title="Backup Data (.json)" className="hidden md:flex border-slate-200 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            <Save size={14} /> <span className="hidden lg:inline">Backup</span>
          </Button>
          <div className="w-px h-6 bg-slate-200 hidden md:block mx-1"></div>
          <Button variant="outline" size="sm" onClick={handleExportMarkdown} title="Export Markdown" className="hidden md:flex border-slate-200 gap-1">
            <FileJson size={14} /> <span className="hidden lg:inline">.MD</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-sm hidden md:flex">
            <Download size={14} /> <span className="hidden lg:inline">Export PDF</span>
          </Button>

          {/* ====== MOBILE: Hamburger Menu ====== */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {mobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <button
                  onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen size={14} /> Import Data (.json)
                </button>
                <button
                  onClick={() => { handleBackupProject(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Save size={14} /> Backup Data (.json)
                </button>
                <div className="border-t border-slate-100 mx-3"></div>
                <button
                  onClick={() => { handleExportMarkdown(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FileJson size={14} /> Export Markdown (.md)
                </button>
                <button
                  onClick={() => { handleExportPDF(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <Download size={14} /> Export PDF
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* === MODAL TENTANG APLIKASI === */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAboutModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header modal */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 rounded-t-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">AI PRD Mentor</h2>
                    <p className="text-emerald-100 text-xs font-medium">by Rakhmat Dedi G</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="bg-white/20 backdrop-blur text-xs font-bold px-3 py-1 rounded-full">Versi {APP_VERSION}</span>
                  <span className="bg-white/10 text-xs px-3 py-1 rounded-full">Sistem Edukasi Interaktif</span>
                </div>

                {/* --- TOMBOL INSTALASI PWA (OPSI A) --- */}
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-emerald-600 font-bold py-3.5 px-6 rounded-2xl shadow-xl hover:bg-emerald-50 transition-all active:scale-95 group"
                  >
                    <div className="bg-emerald-100 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                      <MonitorSmartphone size={24} />
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-sm">Instal di Perangkat</p>
                      <p className="text-[10px] text-emerald-500/70 font-medium">Akses lebih cepat & lancar</p>
                    </div>
                  </button>
                )}

                {/* PANDUAN MANUAL UNTUK iOS */}
                {isIOS && !deferredPrompt && (
                  <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-xl shrink-0">
                      <Smartphone size={20} />
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <p className="font-bold mb-1">Pasang di iPhone/iPad:</p>
                      <ol className="list-decimal list-inside space-y-1 text-white/80">
                        <li>Klik ikon <b>Share</b> di bawah Safari</li>
                        <li>Pilih <b>'Add to Home Screen'</b></li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Konten modal */}
            <div className="px-6 py-6 space-y-6">
              {/* Deskripsi Singkat */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>AI PRD Mentor</strong> adalah platform edukasi interaktif berbasis AI yang membimbing Anda menyusun dokumen spesifikasi proyek berkualitas tinggi.
                  Bukan sekadar alat pengisi formulir — sistem ini dirancang untuk <strong>membangun kemandirian berpikir</strong> Anda sebagai pemilik produk.
                </p>
              </div>

              {/* Apa itu PRD */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Apa itu PRD?</h3>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>PRD (Product Requirements Document)</strong> adalah dokumen strategis yang mendefinisikan <em>apa</em> yang akan dibangun, <em>untuk siapa</em>, dan <em>mengapa</em> — sebelum satu baris kode pun ditulis.
                  </p>
                  <p>
                    PRD menjadi sumber kebenaran bagi seluruh tim: developer, desainer, hingga stakeholder.
                    Dokumen ini memastikan semua orang bekerja dengan visi yang sama.
                  </p>
                </div>
              </div>

              {/* Manfaat PRD */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Mengapa PRD Penting?</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Target, title: "Fokus yang Jelas", desc: "Menghindari fitur yang tidak perlu dan scope creep" },
                    { icon: Users, title: "Satu Visi Tim", desc: "Semua anggota tim memahami tujuan yang sama" },
                    { icon: BarChart3, title: "Ukuran Sukses", desc: "Menetapkan KPI konkret sejak awal proyek" },
                    { icon: Shield, title: "Mitigasi Risiko", desc: "Mengidentifikasi hambatan sebelum terlambat" }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 group hover:bg-emerald-50 transition-colors">
                      <item.icon size={16} className="text-emerald-500 mb-1.5" />
                      <p className="font-bold text-[11px] text-slate-800">{item.title}</p>
                      <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fitur Aplikasi */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Fitur Unggulan</h3>
                </div>
                <div className="space-y-2">
                  {[
                    "Mentor AI interaktif yang membimbing dengan teknik Socratic Questioning",
                    "4 fase kerja terstruktur: Discovery → Analysis → Technical → Deliver",
                    "Deteksi otomatis kata-kata ambigu & meminta ukuran konkret",
                    "Live preview dokumen PRD yang diperbarui secara real-time",
                    "Ekspor dokumen ke format PDF dan Markdown",
                    "Backup & restore data proyek dalam format JSON",
                    "Dapat diinstal di perangkat sebagai aplikasi (PWA)",
                    "Responsif — nyaman digunakan di HP, tablet, maupun desktop"
                  ].map((fitur, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      <span>{fitur}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer modal */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">© 2026 Rakhmat Dedi G — Semua hak dilindungi</p>
                <Button onClick={() => setShowAboutModal(false)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs rounded-lg">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-hidden relative">
        <div className="hidden md:flex h-full w-full">
          <div className="w-[60%] border-r border-slate-200 h-full bg-white flex flex-col overflow-hidden">
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              prdData={prdData}
              setPrdData={setPrdData}
              activePhase={activePhase}
              setIsVIP={setIsVIP}
              isVIP={isVIP}
              chunkList={chunkList}
              setChunkList={setChunkList}
              masterSummary={masterSummary}
              setMasterSummary={setMasterSummary}
            />
          </div>
          <div className="w-[40%] h-full overflow-hidden">
            <PRDPreview prdData={prdData} activePhase={activePhase} />
          </div>
        </div>

        <div className="block md:hidden h-full">
          <Tabs value={activeMobileTab} onValueChange={setActiveMobileTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-white shrink-0 h-12 p-0 gap-0">
              <TabsTrigger
                value="chat"
                className="h-full rounded-none border-b-2 border-transparent text-slate-500 font-semibold text-xs transition-all
                  data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-emerald-50"
              >
                💬 Obrolan RDG
              </TabsTrigger>
              <TabsTrigger
                value="prd"
                className="h-full rounded-none border-b-2 border-transparent text-slate-500 font-semibold text-xs transition-all
                  data-[state=active]:border-blue-500 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-50"
              >
                📄 Draft Dokumen
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
              <ChatInterface messages={messages} setMessages={setMessages} prdData={prdData} setPrdData={setPrdData} activePhase={activePhase} setIsVIP={setIsVIP} isVIP={isVIP} chunkList={chunkList} setChunkList={setChunkList} masterSummary={masterSummary} setMasterSummary={setMasterSummary} />
            </TabsContent>
            <TabsContent value="prd" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
              <PRDPreview prdData={prdData} activePhase={activePhase} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// --- SUB-KOMPONEN: CHAT INTERFACE ---
function ChatInterface({ messages, setMessages, prdData, setPrdData, activePhase, setIsVIP, isVIP, chunkList, setChunkList, masterSummary, setMasterSummary }: any) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sendErrorNotice, setSendErrorNotice] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToTop = () => chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 300);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const savedInput = input; // Simpan sebelum dikosongkan
    setSendErrorNotice("");
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const latestChunkSummary = chunkList.length > 0 ? chunkList[chunkList.length - 1] : "";
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages,
          phase: activePhase,
          document: prdData,
          userName: prdData.userName,
          latestChunkSummary: latestChunkSummary,
          masterSummary: masterSummary
        })
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      const aiReply = data.reply;
      const updatedMessages = [...newMessages, { role: "ai", text: aiReply }];
      setMessages(updatedMessages);

      if (data.document) {
        // Bersihkan formatting (seperti **<u>...</u>**) dari seluruh string di dalam JSON
        const cleanedDocument = JSON.parse(JSON.stringify(data.document), (key, value) => {
          if (typeof value === 'string') {
            return stripFormatting(value);
          }
          return value;
        });

        setPrdData((prev: any) => {
          const merged = { ...prev, ...cleanedDocument };
          const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          if (merged.userName && !prev.creationDate) {
            merged.creationDate = nowStr;
          } else {
            merged.creationDate = prev.creationDate;
          }
          if (merged.userName) {
            merged.lastUpdated = nowStr;
          }
          return merged;
        });
      }

      setSendErrorNotice("");

      // Aktifkan mode VIP jika divalidasi oleh backend
      if (data.isVIP) {
        setIsVIP(true);
      }

      // --- BACKGROUND PROCESSING UNTUK SUMMARIZATION ---
      const totalMessages = updatedMessages.length;
      // Picu summarization setiap 15 pesan (user + model)
      if (totalMessages > 0 && totalMessages % 15 === 0) {
        // Ambil 15 pesan terakhir
        const msgsToSummarize = updatedMessages.slice(-15);
        
        // Panggil endpoint /api/summarize secara asynchronous (tanpa await agar tidak memblokir UI)
        fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'chunk', data: msgsToSummarize })
        })
        .then(res => res.json())
        .then(summaryData => {
          if (summaryData.summary) {
            setChunkList((prevList: string[]) => {
              // Simpan maksimal 5 rangkuman terakhir saja agar localStorage tidak membengkak
              const newList = [...prevList, summaryData.summary].slice(-5);
              
              // Jika sudah terkumpul 5 chunk summary, buat master summary baru
              if (newList.length > 0 && newList.length % 5 === 0) {
                // Ambil 5 terakhir
                const chunksForMaster = newList.slice(-5);
                fetch('/api/summarize', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'master', data: chunksForMaster, oldMaster: masterSummary })
                })
                .then(r => r.json())
                .then(masterData => {
                  if (masterData.summary) {
                    setMasterSummary(masterData.summary);
                  }
                }).catch(e => console.error("Master Summary error:", e));
              }
              return newList;
            });
          }
        }).catch(e => console.error("Chunk Summary error:", e));
      }


    } catch (error) {
      // Kembalikan pesan ke kotak input & hapus dari riwayat agar user bisa kirim ulang
      setMessages(messages); // Pulihkan ke state sebelum pesan dikirim
      setInput(savedInput);  // Kembalikan teks ke kotak input
      setSendErrorNotice("Pesan gagal terkirim. Teks sudah dikembalikan ke kotak input, silakan kirim ulang.");
      setTimeout(() => {
        setSendErrorNotice("");
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPhaseData = PHASES.find(p => p.id === activePhase)!;

  return (
    <div className="flex h-full flex-col overflow-hidden relative">

      {/* === LABEL FASE AKTIF DI KOLOM CHAT === */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
          <span>FASE {currentPhaseData.id}: {currentPhaseData.n.toUpperCase()}</span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">{currentPhaseData.desc}</span>
      </div>

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg: any, i: number) => (
          <div key={i} className={`flex gap-3 sm:gap-4 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 border shadow-sm ${msg.role === "user" ? "bg-slate-800 text-white" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
              {msg.role === "user" ? "ME" : "RDG"}
            </div>
            <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[85%] ${msg.role === "user" ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-white text-slate-800 rounded-tl-sm border border-slate-200"}`}>
              {msg.role === "user" ? <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p> : <FormattedMessage text={msg.text} />}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 items-start animate-pulse">
            <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-400 flex items-center justify-center text-[10px] font-bold">RDG</div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-1 items-center h-12">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollTop && (
        <Button onClick={scrollToTop} size="icon" className="absolute bottom-40 right-4 h-10 w-10 rounded-full shadow-xl bg-slate-800 hover:bg-slate-700 text-white z-20 transition-all opacity-90">
          <ArrowUp size={20} />
        </Button>
      )}

      <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.03)] relative z-30">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-end group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  if (!isLoading && input.trim()) handleSendMessage();
                }
              }}
              disabled={isLoading}
              placeholder={isLoading ? "RDG sedang meracik ide..." : "Ketik ide atau jawaban Anda..."}
              className="w-full resize-none bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner-sm min-h-[80px] max-h-[200px] overflow-y-auto"
              rows={2}
              onInput={(e: any) => {
                e.target.style.height = '80px';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <div className="absolute right-3 bottom-3">
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon" className="bg-emerald-600 hover:bg-emerald-700 h-[46px] w-[46px] rounded-xl shadow-md transition-all active:scale-90 disabled:opacity-50">
                <Send size={20} className="ml-0.5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 px-2">
            <p className="text-[10px] text-slate-400">
              Tekan <b>Enter</b> untuk baris baru. Tekan <b>Ctrl+Enter</b> untuk mengirim.
            </p>
            <p className="text-[10px] text-slate-300 font-mono">
              {input.length} karakter
            </p>
          </div>
          {sendErrorNotice && (
            <div
              className={`mt-2 mx-2 rounded-lg px-3 py-2 text-[11px] flex items-start gap-2 border ${
                isVIP
                  ? "border-amber-400 bg-amber-100 text-amber-900"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${isVIP ? "text-amber-800" : "text-amber-600"}`} />
              <span>{sendErrorNotice}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- SUB-KOMPONEN: PREVIEW DOKUMEN ---
function PRDPreview({ prdData, activePhase }: { prdData: any, activePhase: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 200);
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // Scroll otomatis ke section saat activePhase berubah
  useEffect(() => {
    if (!activePhase) return;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Beri sedikit jeda agar DOM tersinkron setelah state berubah
    const timer = setTimeout(() => {
      const el = document.getElementById(`prd-section-${activePhase}`);
      if (!el) return;

      // Hitung posisi absolut elemen relatif terhadap scroll container
      // dengan cara menelusuri DOM ke atas (offsetParent)
      let absoluteOffsetTop = 0;
      let current: HTMLElement | null = el;
      while (current && current !== scrollContainer) {
        absoluteOffsetTop += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
      }

      // Scroll ke posisi tersebut, dikurangi 70px untuk clearance sticky header
      scrollContainer.scrollTo({ top: absoluteOffsetTop - 70, behavior: 'smooth' });
    }, 50);

    return () => clearTimeout(timer);
  }, [activePhase]);

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col bg-slate-100/50">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
      >
        <Card className="bg-white shadow-xl border-slate-200/60 min-h-full pb-12 overflow-hidden">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Drafting Workspace</h2>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
              {prdData.label}
            </span>
          </div>

          <div className="p-8 space-y-10">
            {prdData.userName && (
              <div className="space-y-1 border-l-4 border-emerald-500 pl-4 py-1 mb-8 animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserIcon size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Penulis Dokumen</span>
                </div>
                <p className="text-xl font-bold text-slate-800 leading-tight">{prdData.userName}</p>
                <div className="flex flex-col gap-1 pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={12} />
                    <span className="text-[10px] font-medium">Dibuat: {prdData.creationDate || "-"}</span>
                  </div>
                  {prdData.lastUpdated && prdData.lastUpdated !== prdData.creationDate && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Clock size={12} />
                      <span className="text-[10px] font-medium">Diperbarui: {prdData.lastUpdated}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none decoration-emerald-500/30 decoration-4">
              {prdData.title}
            </h1>

            <div className="space-y-12">
              {prdData.sections.map((section: any) => (
                <section id={`prd-section-${section.id}`} key={section.id} className={`scroll-mt-24 animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-2xl transition-all ${activePhase.toString() === section.id ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-white' : ''}`}>
                  <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                    {section.title}
                  </h3>
                  <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner-sm">
                    {section.items.map((item: any, idx: number) => (
                      <div key={idx} className="group">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 group-hover:text-emerald-500 transition-colors">
                          {item.label}
                        </label>
                        {item.value === "TBD" ? (
                          <div className="inline-flex items-center gap-2 text-slate-300 text-xs italic bg-white px-3 py-1 rounded border border-dashed border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse"></span>
                            Belum ada data (TBD)
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                            {item.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {showScrollTop && (
        <Button onClick={scrollToTop} size="icon" className="absolute bottom-6 right-8 h-10 w-10 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white z-20 transition-all">
          <ArrowUp size={20} />
        </Button>
      )}
    </div>
  )
}