# 🚀 InboxAI - Asisten Cerdas UMKM Indonesia

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**InboxAI** adalah platform asisten bisnis cerdas yang dirancang khusus untuk membantu UMKM (Usaha Mikro, Kecil, dan Menengah) di Indonesia naik kelas melalui kekuatan AI. Dengan InboxAI, pemilik toko dapat mengotomatisasi layanan pelanggan, menganalisis performa bisnis, dan mengelola pesanan dengan desain antarmuka yang premium dan sangat responsif.

---

## ✨ Fitur Unggulan

*   **🤖 AI Auto-Reply & Insight**: Menggunakan Google Gemini AI untuk membalas pesan pelanggan secara otomatis dan cerdas, serta memberikan analisis stok dan performa bisnis secara proaktif.
*   **📊 Dashboard Real-time**: Visualisasi data penjualan, omset, dan konversi pembeli secara instan menggunakan Firebase Firestore.
*   **💬 Sinkronisasi Chat Instan**: Sistem percakapan yang sangat responsif antara pelanggan dan admin dengan dukungan metadata denormalisasi untuk performa tinggi.
*   **📱 Responsivitas Modern**: Desain premium yang adaptif untuk perangkat mobile standar, mode "Desktop Site" di mobile, hingga monitor desktop lebar.
*   **🛒 Katalog Produk Terintegrasi**: Manajemen produk yang mudah dengan kemampuan generate deskripsi otomatis menggunakan AI.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: React 18, TypeScript, Vite.
*   **Styling**: Tailwind CSS dengan efek *Glassmorphism* dan *Iridescence*.
*   **Backend & Database**: Firebase Firestore (Real-time DB) & Firebase Auth.
*   **AI Engine**: Google Generative AI (Gemini 2.5 Flash).
*   **Icons**: Lucide React.

---

## 🚀 Memulai Penginstalan

### 1. Clone Repositori
```bash
git clone https://github.com/PamanSam01/umkm-assistant.git
cd umkm-assistant
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori dan masukkan kredensial berikut:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini API Key (Bisa lebih dari satu, pisahkan dengan koma)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_DEMO_MODE=false
```

### 4. Jalankan Aplikasi
```bash
npm run dev
```

---

## ☁️ Deployment ke Google Cloud Run

Proyek ini telah dikonfigurasi untuk dijalankan di Google Cloud Run menggunakan Docker.

### 1. Build & Push Image ke Artifact Registry
Ganti `[PROJECT_ID]` dan `[REPO_NAME]` dengan ID proyek Google Cloud Anda.
```bash
gcloud builds submit --tag gcr.io/[PROJECT_ID]/[REPO_NAME] .
```

### 2. Deploy ke Cloud Run
Jalankan perintah berikut untuk meluncurkan layanan:
```bash
gcloud run deploy umkm-assistant \
  --image gcr.io/[PROJECT_ID]/[REPO_NAME] \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --port 8080
```

---

## 📁 Struktur Folder

```text
src/
├── components/     # Komponen UI Reusable (Logo, AI Chat, Background)
├── context/        # State Management (Auth & App Context)
├── layouts/        # Layout Utama (MainLayout)
├── lib/            # Inisialisasi Library (Firebase)
├── pages/          # Halaman Aplikasi (Dashboard, Chat, Login, dll)
└── services/       # Integrasi API & Logika AI (api.ts)
```

---

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda memiliki saran untuk meningkatkan InboxAI, silakan:
1. Fork proyek ini.
2. Buat branch fitur baru (`git checkout -b fitur/Hebat`).
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur Hebat'`).
4. Push ke branch tersebut (`git push origin fitur/Hebat`).
5. Buat Pull Request.

---

## 📜 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.

---

<p align="center">
  Dibuat dengan ❤️ untuk UMKM Indonesia 🇮🇩
</p>
