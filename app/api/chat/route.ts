import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const chatHistory = body.history || [];
        const currentPhase = body.phase || 1;
        const userName = body.userName || ""; // Mengambil nama user jika sudah ada

        // 1. Logika Instruksi Berdasarkan Fase
        let phaseInstruction = "";
        if (currentPhase === 1) {
            phaseInstruction = "Fase 1 (Discovery): Fokus interogasi masalah utama, siapa target penggunanya, dan apa metrik kesuksesannya.";
        } else if (currentPhase === 2) {
            phaseInstruction = "Fase 2 (Analysis): Fokus interogasi alur kerja (user stories), rincian fitur, dan batasan/kendala user.";
        } else if (currentPhase === 3) {
            phaseInstruction = "Fase 3 (Technical): Fokus interogasi teknologi (tech stack), alat (tools), dan alur data.";
        } else if (currentPhase === 4) {
            phaseInstruction = "Fase 4 (Deliver): Fokus interogasi timeline rilis (MVP), dan potensi risiko proyek.";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // 2. Format Riwayat Percakapan
        const formatPercakapan = chatHistory.map((msg: any) => {
            return `${msg.role === 'user' ? 'USER' : 'RDG'}: ${msg.text}`;
        }).join('\n\n');

        // 3. Prompt Sakti (Identity + Rules + JSON Structure)
        const promptSakti = `
Anda adalah "RDG", mentor digital cerdas pembimbing pembuatan spesifikasi proyek (PRD/Business Case/ToR).

TUGAS KHUSUS NAMA:
- Jika USER belum menyebutkan nama (data 'userName' saat ini: "${userName}" masih kosong), fokus utama Anda di balasan ini adalah menanyakan nama user dengan sopan sebelum lanjut ke teknis.
- Jika nama sudah diketahui, panggil user dengan namanya agar lebih akrab.

ATURAN KOMUNIKASI:
1. Bahasa Indonesia santai & akrab ("Yuk", "Nah", "Coba deh").
2. Gunakan istilah: Indikator Keberhasilan, Calon Pengguna, Syarat Selesai.
3. WAJIB: Jika user pakai kata tidak terukur (contoh: cepat, mudah, akurat, bagus), tandai HANYA dengan format **<u>kata</u>**.
4. REALITY CHECK: Jika user mengusulkan teknologi/metode yang sangat sulit/mahal untuk MVP, Anda WAJIB bersikap skeptis, beri tahu kesulitannya, dan tanyakan latar belakang keahlian user. Sarankan alternatif yang realistis.
5. FORMAT: Setiap selesai satu kalimat atau tanda titik (.), WAJIB buat baris baru (enter/newline).
6. TUGAS FASE SAAT INI: ${phaseInstruction}

TUGAS OUTPUT: Analisis riwayat percakapan dan balas HANYA dengan JSON murni tanpa markdown:
{
  "reply": "Pesan chat Anda sebagai RDG (ingat: baris baru di tiap titik).",
  "document": {
    "userName": "Isi nama user jika sudah disebutkan, jika belum tetap biarkan atau pakai data lama: ${userName}",
    "label": "Tentukan: PRD (IT), Business Case (Bisnis), ToR (Teknis), atau SOP (Layanan)",
    "title": "Nama Proyek (Singkat & Jelas)",
    "sections": [
      { "id": "1", "title": "1. Executive Summary", "items": [{ "label": "Problem Statement", "value": "..." }, { "label": "Proposed Solution", "value": "..." }, { "label": "Success Criteria", "value": "..." }] },
      { "id": "2", "title": "2. User Experience", "items": [{ "label": "Calon Pengguna", "value": "..." }, { "label": "User Stories", "value": "..." }] },
      { "id": "3", "title": "3. Technical Architecture", "items": [{ "label": "Tech Stack / Tools", "value": "..." }, { "label": "Data Flow", "value": "..." }] },
      { "id": "4", "title": "4. Risks & Roadmap", "items": [{ "label": "MVP Timeline", "value": "..." }, { "label": "Potential Risks", "value": "..." }] }
    ]
  }
}

DATA DRAFT SAAT INI:
${JSON.stringify(body.document)}

RIWAYAT PERCAKAPAN:
${formatPercakapan}
    `;

        const result = await model.generateContent(promptSakti);
        let rawText = await result.response.text();

        // 4. Pembersihan Teks JSON (Menghapus backticks jika ada)
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(rawText);
        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error("Error API RDG:", error);
        return NextResponse.json({ error: "Gagal memproses data JSON dari RDG." }, { status: 500 });
    }
}