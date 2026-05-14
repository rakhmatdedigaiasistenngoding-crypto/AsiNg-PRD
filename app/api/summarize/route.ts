import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data, oldMaster } = body;

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        let prompt = "";

        if (type === "chunk") {
            // data berisi array of messages
            const formattedChat = data.map((msg: any) => `${msg.role === 'user' ? 'USER' : 'RDG'}: ${msg.text}`).join('\n\n');
            prompt = `
Anda adalah AI perangkum percakapan. Buatlah rangkuman padat dan jelas dari 15 obrolan berikut.
Fokus pada:
1. Keputusan teknis atau bisnis yang diambil.
2. Preferensi spesifik dari pengguna.
3. Ide-ide penting yang dibahas.

PERCAKAPAN:
${formattedChat}

Berikan hanya teks rangkumannya saja secara langsung tanpa basa-basi.
`;
        } else if (type === "master") {
            // data berisi array of chunk summaries
            const formattedSummaries = data.map((sum: string, idx: number) => `Rangkuman ${idx + 1}:\n${sum}`).join('\n\n');
            const oldMasterText = oldMaster ? `Rangkuman Master Sebelumnya:\n${oldMaster}\n\n` : "";
            
            prompt = `
Anda adalah AI perangkum tingkat lanjut. Tugas Anda adalah menggabungkan beberapa rangkuman percakapan menjadi SATU "Rangkuman Keseluruhan" yang komprehensif.
${oldMasterText}
RANGKUMAN BARU YANG HARUS DIGABUNGKAN:
${formattedSummaries}

Buatlah Rangkuman Keseluruhan yang baru, mencakup informasi dari Rangkuman Master Sebelumnya (jika ada) dan mengintegrasikan poin-poin dari Rangkuman Baru.
Fokus pada evolusi proyek, keputusan final, dan konteks utama. Berikan hanya teks rangkumannya saja secara langsung.
`;
        } else {
            return new Response(JSON.stringify({ error: "Tipe summarisasi tidak valid" }), { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const summary = await result.response.text();

        return new Response(JSON.stringify({ summary: summary.trim() }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Summarization Error:", error);
        return new Response(JSON.stringify({ error: "Gagal membuat rangkuman", details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
