# Studia — College Planner

Aplikasi perencana kuliah (Dashboard, Jadwal, Tugas, Mata Kuliah, Ujian, Presensi, Catatan) dibangun dengan React + Vite + Tailwind CSS.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Setup Supabase (opsional — sinkronisasi data lintas perangkat)

Project ini sudah terhubung ke Supabase untuk sinkronisasi data (`src/lib/supabaseClient.js`, `src/lib/plannerSync.js`, `src/lib/deviceId.js`). **`localStorage` tetap menjadi sumber data utama** — Supabase hanya lapisan sinkronisasi di atasnya. Belum ada fitur login: setiap perangkat/browser diberi ID anonim otomatis (disimpan di localStorage) yang dipakai sebagai `user_id`.

Jika env var Supabase **tidak diisi**, aplikasi berjalan 100% seperti sebelumnya — localStorage saja, tanpa sinkronisasi apa pun.

Untuk mengaktifkan sinkronisasi:

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** di dashboard Supabase, jalankan:

   ```sql
   create table planner_data (
     user_id uuid not null,
     key text not null,
     value jsonb not null,
     updated_at timestamptz not null default now(),
     primary key (user_id, key)
   );

   alter table planner_data enable row level security;

   -- Tanpa login, permission dibuka untuk semua request dengan anon key.
   -- Ini SEMENTARA — akan diperketat begitu fitur login ditambahkan.
   create policy "Allow all access for now"
     on planner_data
     for all
     using (true)
     with check (true);
   ```

3. Salin `.env.example` menjadi `.env`.
4. Buka **Project Settings → API**, isi `.env` dengan:
   - `VITE_SUPABASE_URL` — Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — Publishable/anon key
5. Jangan pernah commit file `.env` ke Git (sudah otomatis diabaikan lewat `.gitignore`).

Setelah env var diisi dan `npm run dev` dijalankan ulang, setiap perubahan pada Jadwal/Tugas/Mata Kuliah/Ujian/Presensi/Catatan otomatis tersinkron ke tabel `planner_data` (dengan jeda sekitar 1 detik setelah perubahan terakhir), dan saat aplikasi dibuka di perangkat lain dengan `user_id` yang sama, data tersebut akan ditarik kembali secara otomatis.

Catatan: karena belum ada login, `user_id` di atas adalah ID acak per-perangkat, bukan identitas akun. Ini akan digantikan oleh `auth.uid()` sungguhan saat fitur login dibangun.

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
4. Jika sudah menyiapkan Supabase, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di **Project Settings → Environment Variables** sebelum deploy. Jika belum, boleh dilewati — aplikasi tetap berjalan dengan localStorage.
5. Klik **Deploy**.

## Catatan data

Seluruh data — Jadwal, Tugas, Mata Kuliah, Ujian, Presensi, dan Catatan — tetap disimpan di `localStorage` browser sebagai sumber utama, sehingga aplikasi selalu bisa dipakai offline atau tanpa Supabase dikonfigurasi. Jika Supabase sudah disiapkan (lihat bagian di atas), setiap perubahan juga otomatis disinkronkan ke tabel `planner_data`, dan ditarik kembali saat aplikasi dibuka di perangkat lain dengan `user_id` (ID anonim per-perangkat) yang sama. Belum ada fitur login — itu akan menjadi tahap pengembangan berikutnya.

