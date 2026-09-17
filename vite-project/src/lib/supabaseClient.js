// Supabase client — disiapkan untuk integrasi V2.
//
// PENTING: modul ini HANYA menyiapkan koneksi ke Supabase. Ia belum
// dipakai oleh App.jsx untuk membaca/menulis data — semua fitur saat
// ini masih berjalan sepenuhnya lewat localStorage seperti sebelumnya.
//
// Env var yang dibutuhkan (isi di file .env, JANGAN pernah di-commit):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_PUBLISHABLE_KEY
//
// Kedua nilai ini TIDAK di-hardcode di sini — selalu dibaca dari
// environment saat build/dev lewat import.meta.env (konvensi Vite).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// true hanya jika kedua env var terisi. Dipakai kode lain nanti untuk
// memutuskan apakah boleh memakai Supabase, atau harus tetap
// mengandalkan localStorage (mis. saat env var belum diisi di lokal
// atau di preview deployment tanpa konfigurasi).
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // Peringatan ini hanya tampil di console saat development, tidak
  // menghentikan aplikasi — localStorage tetap berfungsi normal.
  console.warn(
    "[Supabase] VITE_SUPABASE_URL dan/atau VITE_SUPABASE_PUBLISHABLE_KEY belum diisi. " +
      "Aplikasi akan tetap berjalan memakai localStorage saja."
  );
}

// Client hanya dibuat jika konfigurasi lengkap, supaya tidak melempar
// error saat env var belum ada (mis. sebelum Supabase project dibuat).
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;
