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
  Upload, // Icon Baru
  Save    // Icon Baru
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

// --- KOMPONEN UTAMA DASHBOARD ---
export default function PRDMentorDashboard() {
  const [activePhase, setActivePhase] = useState(1);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Halo! Saya **RDG**, mentor digital Anda.\n\nSebelum kita bedah ide hebat Anda, boleh saya tahu nama Anda siapa?" }
  ]);

  const [prdData, setPrdData] = useState({
    userName: "",
    creationDate: "",
    title: "Proyek Belum Berjudul",
    label: "DRAFTING",
    sections: [
      { id: "1", title: "1. Executive Summary", items: [{ label: "Problem Statement", value: "TBD" }, { label: "Proposed Solution", value: "TBD" }, { label: "Success Criteria", value: "TBD" }] },
      { id: "2", title: "2. User Experience", items: [{ label: "Calon Pengguna", value: "TBD" }, { label: "User Stories", value: "TBD" }] },
      { id: "3", title: "3. Technical Architecture", items: [{ label: "Tech Stack / Tools", value: "TBD" }, { label: "Data Flow", value: "TBD" }] },
      { id: "4", title: "4. Risks & Roadmap", items: [{ label: "MVP Timeline", value: "TBD" }, { label: "Potential Risks", value: "TBD" }] }
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
    }
  }, []);

  useEffect(() => {
    const stateToSave = { messages, prdData, activePhase };
    localStorage.setItem("rdg_app_state", JSON.stringify(stateToSave));
  }, [messages, prdData, activePhase]);

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
    const stateToSave = { messages, prdData, activePhase };
    const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDG_Backup_${prdData.title.replace(/\s+/g, '_')}.json`;
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
    doc.text(`Tanggal      : ${prdData.creationDate || "-"}`, margin, cursorY);
    cursorY += 10;

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
    content += `**Tanggal:** ${prdData.creationDate}\n`;
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

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-emerald-600">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <FileText size={18} />
          </div>
          <span className="hidden sm:inline">AI PRD Mentor</span>
        </div>

        <div className="flex gap-4 sm:gap-6 text-[10px] sm:text-xs font-medium text-slate-400">
          {[{ id: 1, n: "Discovery" }, { id: 2, n: "Analysis" }, { id: 3, n: "Technical" }, { id: 4, n: "Deliver" }].map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePhase(p.id)}
              className={`px-1 pb-1 transition-all ${activePhase === p.id ? "text-emerald-600 border-b-2 border-emerald-600 font-bold" : "hover:text-slate-600"}`}
            >
              {p.id}. {p.n}
            </button>
          ))}
        </div>

        {/* --- AREA TOMBOL HEADER --- */}
        <div className="flex gap-2 items-center">

          <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400 hover:text-red-500 hover:bg-red-50" title="Reset Proyek">
            <Trash2 size={16} />
          </Button>

          {/* Tombol Import (Hidden Input File) */}
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportProject} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Import Data (.json)" className="hidden md:flex border-slate-200 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Upload size={14} /> Import
          </Button>

          {/* Tombol Backup */}
          <Button variant="outline" size="sm" onClick={handleBackupProject} title="Backup Data (.json)" className="hidden md:flex border-slate-200 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
            <Save size={14} /> Backup
          </Button>

          <div className="w-px h-6 bg-slate-200 hidden md:block mx-1"></div> {/* Garis Pemisah */}

          <Button variant="outline" size="sm" onClick={handleExportMarkdown} title="Export Markdown" className="hidden lg:flex border-slate-200 gap-1">
            <FileJson size={14} /> .MD
          </Button>
          <Button variant="default" size="sm" onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-sm">
            <Download size={14} /> <span className="hidden sm:inline">Export PDF</span>
          </Button>

        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden relative">
        <div className="hidden md:flex h-full w-full">
          <div className="w-[60%] border-r border-slate-200 h-full bg-white flex flex-col overflow-hidden">
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              prdData={prdData}
              setPrdData={setPrdData}
              activePhase={activePhase}
            />
          </div>
          <div className="w-[40%] h-full overflow-hidden">
            <PRDPreview prdData={prdData} />
          </div>
        </div>

        <div className="block md:hidden h-full">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-white shrink-0 h-12">
              <TabsTrigger value="chat">Obrolan RDG</TabsTrigger>
              <TabsTrigger value="prd">Draft Dokumen</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
              <ChatInterface messages={messages} setMessages={setMessages} prdData={prdData} setPrdData={setPrdData} activePhase={activePhase} />
            </TabsContent>
            <TabsContent value="prd" className="flex-1 min-h-0 overflow-hidden m-0 p-0">
              <PRDPreview prdData={prdData} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// --- SUB-KOMPONEN: CHAT INTERFACE ---
function ChatInterface({ messages, setMessages, prdData, setPrdData, activePhase }: any) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToTop = () => chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 300);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newMessages,
          phase: activePhase,
          document: prdData,
          userName: prdData.userName
        })
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setMessages([...newMessages, { role: "ai", text: data.reply }]);

      if (data.document) {
        setPrdData((prev: any) => {
          const merged = { ...prev, ...data.document };
          if (merged.userName && !prev.creationDate) {
            merged.creationDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          } else {
            merged.creationDate = prev.creationDate;
          }
          return merged;
        });
      }
    } catch (error) {
      setMessages([...newMessages, { role: "ai", text: "Gagal terhubung ke RDG. Cek koneksi internet Anda." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden relative">
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
        <Button onClick={scrollToTop} size="icon" className="absolute bottom-24 right-6 h-10 w-10 rounded-full shadow-xl bg-slate-800 hover:bg-slate-700 text-white z-20 transition-all opacity-90">
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
              className="w-full resize-none bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner-sm min-h-[58px] max-h-[180px] overflow-y-auto"
              rows={1}
              onInput={(e: any) => {
                e.target.style.height = '58px';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <div className="absolute right-2 bottom-2">
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon" className="bg-emerald-600 hover:bg-emerald-700 h-[42px] w-[42px] rounded-xl shadow-md transition-all active:scale-90 disabled:opacity-50">
                <Send size={18} className="ml-0.5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <p className="text-[10px] text-slate-400">
              Tekan <b>Enter</b> untuk baris baru. Tekan <b>Ctrl+Enter</b> untuk mengirim.
            </p>
            <p className="text-[10px] text-slate-300 font-mono">
              {input.length} karakter
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- SUB-KOMPONEN: PREVIEW DOKUMEN ---
function PRDPreview({ prdData }: { prdData: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setShowScrollTop(e.currentTarget.scrollTop > 200);
  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

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
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Calendar size={12} />
                  <span className="text-[10px] font-medium">{prdData.creationDate}</span>
                </div>
              </div>
            )}

            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none decoration-emerald-500/30 decoration-4">
              {prdData.title}
            </h1>

            <div className="space-y-12">
              {prdData.sections.map((section: any) => (
                <section key={section.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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