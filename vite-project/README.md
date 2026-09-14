# Studia — College Planner

Aplikasi perencana kuliah (Dashboard, Jadwal, Tugas, Mata Kuliah, Ujian, Presensi, Catatan) dibangun dengan React + Vite + Tailwind CSS.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build untuk production

```bash
npm run build
npm run preview
```

## Deploy ke Vercel

1. Push folder ini ke sebuah repository Git (GitHub/GitLab/Bitbucket).
2. Di Vercel, klik **New Project** dan import repository tersebut.
3. Vercel akan otomatis mendeteksi framework Vite — biarkan pengaturan default:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Klik **Deploy**.

Tidak diperlukan environment variable atau konfigurasi tambahan apa pun.

## Catatan data

Data Tugas, Mata Kuliah, Ujian, Presensi, dan Catatan disimpan di `localStorage` browser pengguna (per perangkat/browser). Jadwal kuliah menggunakan data bawaan (in-memory) sesuai desain aplikasi saat ini.
