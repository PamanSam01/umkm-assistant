import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || "").split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// --- AI STABILITY CONFIG ---
const MODELS = ["gemini-2.5-flash"];
let isAiProcessing = false; // Lock to prevent parallel requests

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const safeGenerate = async (prompt: string) => {
  if (apiKeys.length === 0) return null;
  
  // Prevent parallel calls to avoid rapid quota exhaustion
  if (isAiProcessing) {
    console.warn("[AI] Permintaan paralel terdeteksi. Menunggu antrean...");
    await sleep(1500); 
  }
  
  isAiProcessing = true;
  const shuffledKeys = [...apiKeys].sort(() => Math.random() - 0.5);
  
  try {
    for (const key of shuffledKeys) {
      const genAI = new GoogleGenerativeAI(key);
      for (const modelName of MODELS) {
        try {
          const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 } 
          });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
        } catch (err: any) {
          const errMsg = err.message || "";
          if (errMsg.includes("429")) {
            await sleep(3000); 
            continue; 
          }
          continue; 
        }
      }
    }
  } finally {
    isAiProcessing = false;
  }
  
  return "Maaf kak, sinyal AI sedang penuh sesak. Mohon tunggu 1 menit lagi ya! 🙏✨";
};

// --- MOCK INTELLIGENCE TEMPLATES ---
const MOCK_EVAL_TEMPLATES = [
  "Luar biasa, Admin! Strategi harga Anda sangat kompetitif. Coba tambahkan sedikit promo di akhir pekan untuk meningkatkan lonjakan omset! 🔥",
  "Performa toko stabil, Kak! Analisis AI menunjukkan bahwa respon chat yang cepat menjadi kunci utama kepercayaan pembeli Anda saat ini. 📈",
  "Wah, toko sedang ramai nih! Pastikan stok barang favorit selalu ready ya agar tidak ada pembeli yang kecewa. Semangat! 🚀",
  "Konversi penjualan Anda cukup baik, Admin. Coba rapikan lagi foto produk di katalog agar pembeli semakin tergoda untuk checkout! ✨",
  "Bisnis Anda tumbuh dengan sehat! Saran AI: Berikan diskon khusus untuk pembeli setia agar mereka kembali berbelanja lagi. 💎"
];

const MOCK_STOCK_TEMPLATES = [
  "Barang favorit mulai menipis! Segera restok hari ini agar tidak kehilangan momen penjualan yang sedang tinggi. 🛒",
  "Stok beberapa barang hampir habis, Admin. Yuk, segera hubungi supplier sebelum barang benar-benar kosong! 📦",
  "Waspada! Stok menipis bisa membuat pembeli ragu. Pastikan katalog selalu terupdate agar toko tetap terlihat profesional. ⚠️"
];

// --- DASHBOARD SERVICES ---
// ... (getDashboardStats remains mostly same, keeping existing logic)
export const getDashboardStats = async (adminId: string) => {
  try {
    let storesQuery = query(collection(db, 'stores'), where('admin_id', '==', adminId));
    let storesSnap = await getDocs(storesQuery);
    if (storesSnap.empty) {
      storesQuery = query(collection(db, 'stores'), where('owner_id', '==', adminId));
      storesSnap = await getDocs(storesQuery);
    }
    const storeIds = storesSnap.docs.map(d => d.id);
    if (storeIds.length === 0) {
      return {
        pesanMasuk: "0", aiReplyRate: "0%", pembeliBaru: "0", totalOmset: "Rp 0",
        konversi: "0%", pendapatan: "Rp 0", chartData: [0, 0, 0, 0, 0, 0, 0],
        recentActivity: [{ type: 'info', msg: 'Selamat datang! Silakan buat toko pertama Anda.', time: 'Baru saja' }]
      };
    }
    const convsQuery = query(collection(db, 'conversations'), where('store_id', 'in', storeIds));
    const convsSnap = await getDocs(convsQuery);
    const ordersQuery = query(collection(db, 'orders'), where('store_id', 'in', storeIds));
    const ordersSnap = await getDocs(ordersQuery);
    let totalRevenue = 0;
    let newOrdersCount = 0;
    ordersSnap.forEach(doc => {
      const data = doc.data();
      if (data.status !== 'pending') {
        totalRevenue += (data.total_amount * (data.quantity || 1)) || 0;
        if (data.status === 'processing') newOrdersCount++;
      }
    });
    let totalMsgs = 0;
    let aiMsgs = 0;
    const convIds = convsSnap.docs.map(d => d.id);
    if (convIds.length > 0) {
      const messagesQuery = query(collection(db, 'messages'), where('conversation_id', 'in', convIds.slice(0, 30)));
      const messagesSnap = await getDocs(messagesQuery);
      totalMsgs = messagesSnap.size;
      aiMsgs = messagesSnap.docs.filter(d => d.data().sender === 'ai').length;
    }
    const aiRate = totalMsgs > 0 ? Math.round((aiMsgs / totalMsgs) * 100) : 0;
    return {
      pesanMasuk: newOrdersCount.toString(), aiReplyRate: `${aiRate}%`, pembeliBaru: convsSnap.size.toString(),
      totalOmset: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      konversi: convsSnap.size > 0 ? `${Math.round((ordersSnap.size / convsSnap.size) * 100)}%` : "0%",
      pendapatan: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      chartData: [100, 120, 150, 130, 160, 200, (totalRevenue / 1000)],
      recentActivity: ordersSnap.docs.filter(d => d.data().status !== 'pending').slice(0, 3).map(d => ({
        type: 'success', msg: `Order ${d.data().product_name} x${d.data().quantity}`, time: 'Baru saja'
      }))
    };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return { pesanMasuk: "0", aiReplyRate: "0%", pembeliBaru: "0", totalOmset: "Rp 0", konversi: "0%", pendapatan: "Rp 0", chartData: [0, 0, 0, 0, 0, 0, 0], recentActivity: [] };
  }
};

// --- CHAT SERVICES ---
export const fetchMessages = async (conversationId: string) => {
  try {
    const q = query(collection(db, 'messages'), where('conversation_id', '==', conversationId), orderBy('created_at', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id, ...doc.data(),
      created_at: doc.data().created_at?.toDate()?.toISOString() || new Date().toISOString()
    }));
  } catch (error) { console.error("Fetch Error:", error); return []; }
};

export const saveMessage = async (conversationId: string, sender: string, text: string) => {
  try {
    // 1. Add Message
    const docRef = await addDoc(collection(db, 'messages'), { 
      conversation_id: conversationId, 
      sender, 
      text, 
      created_at: serverTimestamp() 
    });
    
    // 2. Update Conversation Meta
    await updateDoc(doc(db, 'conversations', conversationId), {
      last_message: text,
      updated_at: serverTimestamp()
    });
    
    return { id: docRef.id };
  } catch (error) { 
    console.error("Save Error:", error); 
    throw error; 
  }
};

// --- AI RESPONSE STRUCTURE ---
export interface SmartAction {
  label: string;
  path: string;
  icon?: string;
}

export interface AIResponse {
  text: string;
  actions?: SmartAction[];
}

// --- HYBRID CHAT SYSTEM (LOCAL INTENT ENGINE) ---
const getLocalResponse = (message: string, storeData: any, products: any[]): AIResponse | null => {
  const msg = message.toLowerCase();
  
  // Dynamic Category Extraction
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  
  // 1. Intent: Specific Category Detection
  const matchedCategory = categories.find(cat => 
    msg.includes(cat.toLowerCase()) || 
    (cat.toLowerCase() === 'fashion' && (msg.includes("baju") || msg.includes("pakaian") || msg.includes("kaos") || msg.includes("hoodie"))) ||
    (cat.toLowerCase() === 'makanan' && (msg.includes("makan") || msg.includes("cemilan") || msg.includes("snack") || msg.includes("kuliner")))
  );

  if (matchedCategory) {
    return {
      text: `Tentu kak! Kami punya berbagai pilihan ${matchedCategory} yang menarik di ${storeData.name}. Yuk, cek koleksinya di bawah ini! 😊`,
      actions: [{ label: `Lihat ${matchedCategory}`, path: `/jelajah?cat=${matchedCategory}` }]
    };
  }

  // 2. Intent: Katalog / Produk Umum
  if (
    msg.includes("produk") || msg.includes("jual apa") || msg.includes("barang") || 
    msg.includes("katalog") || msg.includes("daftar") || msg.includes("ada apa aja") || 
    msg.includes("lihat barang") || msg.includes("barangnya apa") || msg.includes("koleksi")
  ) {
    const actions: SmartAction[] = [{ label: "Jelajah Katalog", path: "/jelajah" }];
    
    if (categories.length > 0) {
      categories.slice(0, 2).forEach(cat => {
        actions.push({ label: `Koleksi ${cat}`, path: `/jelajah?cat=${cat}` });
      });
    }

    return {
      text: `Selamat datang di ${storeData.name}! Kami menyediakan berbagai produk UMKM pilihan untuk Kakak. Silakan jelajahi katalog kami di bawah ini ya! 🛍️✨`,
      actions
    };
  }

  // 3. Intent: Lokasi / Alamat
  if (msg.includes("lokasi") || msg.includes("alamat") || msg.includes("dimana") || msg.includes("daerah") || msg.includes("toko dimana") || msg.includes("posisi")) {
    return {
      text: `Toko ${storeData.name} berlokasi di ${storeData.location || "Indonesia"}. Kakak bisa mampir langsung atau pesan online lewat sini ya! 📍`,
      actions: [{ label: "Cek Lokasi", path: "/jelajah" }]
    };
  }

  // 4. Intent: Pembayaran / COD
  if (msg.includes("bayar") || msg.includes("cod") || msg.includes("transfer") || msg.includes("pembayaran") || msg.includes("cara beli")) {
    return {
      text: `Untuk pembayaran di ${storeData.name}, Kakak bisa menggunakan Transfer Bank, E-Wallet, atau sistem COD (Bayar di Tempat). Sangat praktis kak! 💳✨`,
      actions: [{ label: "Panduan Belanja", path: "/pesanan-saya" }]
    };
  }

  // 5. Intent: Pengiriman / Ongkir
  if (msg.includes("ongkir") || msg.includes("kirim") || msg.includes("kurir") || msg.includes("paket") || msg.includes("resi")) {
    return {
      text: `Jangan khawatir soal pengiriman kak! Kami bekerja sama dengan kurir terpercaya. Biaya ongkir akan dihitung otomatis saat Kakak checkout produk nanti. 🚚📦`,
      actions: [{ label: "Cek Pesanan", path: "/pesanan-saya" }]
    };
  }

  // 6. Intent: Jam Operasional
  if (msg.includes("buka") || msg.includes("tutup") || msg.includes("jam") || msg.includes("operasional") || msg.includes("kapan")) {
    return {
      text: `Toko ${storeData.name} siap melayani Kakak setiap hari! Untuk respon AI aktif 24 jam, sedangkan pengiriman dilakukan di jam operasional kurir ya kak. ⏰✨`,
      actions: [{ label: "Mulai Belanja", path: "/jelajah" }]
    };
  }

  return null; // No local match found, proceed to Gemini
};

// --- AI SERVICES ---
export const generateAIResponse = async (userMessage: string, storeId?: string, isAdmin: boolean = false, conversationId?: string): Promise<AIResponse> => {
  try {
    let storeData = null;
    let products: any[] = [];
    let context = "";
    
    // 1. Fetch Basic Store Context
    if (storeId) {
      const storeSnap = await getDoc(doc(db, 'stores', storeId));
      if (storeSnap.exists()) {
        storeData = storeSnap.data();
        const prodsSnap = await getDocs(query(collection(db, 'products'), where('store_id', '==', storeId), limit(10)));
        products = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        context = `[TOKO]: "${storeData.name}" | Lokasi: ${storeData.location || 'Indonesia'}. `;
        const prodsText = products.map(p => `- ${p.name} | Rp ${p.price.toLocaleString('id-ID')} | Stok:${p.stock}`).join('\n');
        if (prodsText) context += `\n[KATALOG (Top 10)]:\n${prodsText}\n`;
      }
    }

    // 2. TRY LOCAL NAVIGATION RESPONSE FIRST (Hybrid Logic)
    if (!isAdmin && storeData) {
      const localResp = getLocalResponse(userMessage, storeData, products);
      if (localResp) {
        return localResp;
      }
    }

    // 3. FALLBACK TO GEMINI (Only for complex/free-form chat)
    let historyContext = "";
    if (conversationId) {
      const histQuery = query(collection(db, 'messages'), where('conversation_id', '==', conversationId), orderBy('created_at', 'desc'), limit(5));
      const histSnap = await getDocs(histQuery);
      historyContext = histSnap.docs.reverse().map(d => `${d.data().sender}: ${d.data().text}`).join('\n');
    }

    const basePrompt = `Anda adalah "InboxAI", asisten cerdas untuk UMKM Assistant. Gaya: Ramah, singkat, solutif, khas Indonesia.
KONTEKS TOKO: ${context}
HISTORI CHAT (Terbaru):
${historyContext}`;

    const adminPrompt = `${basePrompt}
TARGET: Pemilik Toko (Admin).
TUGAS: Berikan analisis bisnis, tips stok, atau jawaban bantuan teknis. Jangan menyarankan untuk belanja.`;

    const userPrompt = `${basePrompt}
TARGET: Pembeli (Customer).
TUGAS: Jawab pertanyaan dengan persuasif. Jika mereferensikan produk spesifik, gunakan format: [PROD:id:Nama]. Jangan gunakan tag [KATALOG]. Jika ditanya hal umum toko, arahkan secara natural.`;

    const systemPrompt = isAdmin ? adminPrompt : userPrompt;

    const response = await safeGenerate(`${systemPrompt}\n\nUser: ${userMessage}`);
    
    return { 
      text: response || "Maaf kak, sinyal AI saya terganggu sebentar. 🙏",
      actions: [] 
    };

  } catch (error: any) { 
    console.error("AI Error:", error); 
    return {
      text: "Maaf kak, sinyal sedang kurang stabil. Tapi saya tetap di sini membantu jika ada pertanyaan tentang produk! 😊",
      actions: [{ label: "Bantuan", path: "/jelajah" }]
    }; 
  }
};

export const generateProductDescription = async (productName: string) => {
  try {
    const prompt = `Berikan SATU deskripsi produk saja untuk: "${productName}". Syarat: 2-3 kalimat, ramah, persuasif, tanpa markdown.`;
    const response = await safeGenerate(prompt);
    return response || "Gagal membuat deskripsi otomatis.";
  } catch (error: any) {
    return `Gagal generate deskripsi otomatis.`;
  }
};

export const generateStockInsight = async (lowStockProducts: any[]) => {
  if (lowStockProducts.length === 0) return null;
  
  if (IS_DEMO) {
    await sleep(1200); // Simulated Thinking
    return MOCK_STOCK_TEMPLATES[Math.floor(Math.random() * MOCK_STOCK_TEMPLATES.length)];
  }

  try {
    const productList = lowStockProducts.map(p => `${p.name} (Sisa: ${p.stock})`).join(", ");
    const prompt = `Berikan satu saran bisnis singkat (max 20 kata) untuk stok menipis: ${productList}. Ramah & proaktif.`;
    return await safeGenerate(prompt);
  } catch (error) {
    return null;
  }
};

export const generatePerformanceEvaluation = async (stats: any) => {
  if (IS_DEMO) {
    await sleep(1500); // Simulated Thinking
    // Logic: if sales are high, pick success template, else random
    const isSuccess = parseInt(stats.pesanMasuk) > 0;
    if (isSuccess) {
      return "Luar biasa, Admin! Pesanan mulai masuk. Respon chat Anda yang cepat adalah kunci sukses hari ini! 🚀";
    }
    return MOCK_EVAL_TEMPLATES[Math.floor(Math.random() * MOCK_EVAL_TEMPLATES.length)];
  }

  try {
    const prompt = `Lakukan evaluasi performa bisnis singkat (max 25 kata) berdasarkan data ini:
    - Pesan Masuk: ${stats.pesanMasuk}
    - Total Omset: ${stats.totalOmset}
    - Konversi: ${stats.konversi}
    Berikan satu saran proaktif yang cerdas dan menyemangat. Bahasa Indonesia yang sangat ramah.`;
    return await safeGenerate(prompt);
  } catch (error) {
    return null;
  }
};

export const generateStoreDescription = async (storeName: string, location: string) => {
  try {
    const prompt = `Buat satu deskripsi toko UMKM yang sangat menarik untuk toko bernama "${storeName}" yang berlokasi di "${location}". 
    GAYA BAHASA: Manusia asli, sangat ramah, hangat, menggunakan sapaan "Kami", sedikit santai tapi tetap profesional (khas UMKM lokal Indonesia yang melayani dengan hati). 
    KETENTUAN: 
    1. Maksimal 3-4 kalimat. 
    2. Fokus pada kualitas dan pelayanan ramah. 
    3. Jangan gunakan format markdown atau poin-poin. 
    4. Gunakan bahasa yang mengundang orang untuk mampir dan bertanya.`;
    
    const response = await safeGenerate(prompt);
    return response || "Halo kak! Kami hadir untuk memberikan produk terbaik dengan pelayanan yang ramah. Silakan mampir ya!";
  } catch (error: any) {
    return "Gagal generate deskripsi otomatis.";
  }
};

