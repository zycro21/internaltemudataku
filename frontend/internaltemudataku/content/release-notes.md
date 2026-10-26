# Release Notes

Catatan perubahan skema database TemuDataku. Isi file ini ditampilkan di website
(tombol versi di sidebar). Nomor versi di sidebar otomatis mengikuti entri
**paling atas** di file ini, jadi tidak ada angka versi lain yang perlu diubah.

## Cara menambah catatan rilis baru

Tambahkan blok baru di **paling atas** (di bawah judul ini), dengan format:

    ## v1.2.0 — 2026-11-02 — Judul singkat (opsional)

    Ringkasan satu-dua kalimat tentang rilis ini.

    ### Ditambahkan
    - Tabel `nama_tabel`: fungsinya apa.
    - Kolom `kolom` di tabel `nama_tabel`: fungsinya apa.

    ### Diubah
    - Fungsi kolom `kolom` di `nama_tabel` disesuaikan: ...

    ### Dihapus
    - Kolom `kolom` dari tabel `nama_tabel`.

Aturan singkat:

- Judul rilis: `## v<versi> — <tanggal YYYY-MM-DD> — <judul>`. Tanggal dan judul boleh dikosongkan.
- Sub-bagian yang dikenali: **Ditambahkan**, **Diubah**, **Dihapus** (bagian yang kosong tidak perlu ditulis).
- Nama tabel yang ditulis dengan `backtick` otomatis menjadi tautan yang melompat ke tabel itu di diagram.
- Saran penomoran: naikkan angka tengah (1.**1**.0) kalau ada tabel/kolom ditambah atau dihapus,
  angka belakang (1.0.**1**) kalau hanya penjelasan fungsi yang disesuaikan, dan angka depan (**2**.0.0)
  kalau ada perombakan struktur besar.

## v1.2.0 — 2026-10-25 — Modul Form

Penambahan modul **Form** (form builder): 8 tabel dan 7 enum baru. Total sekarang 134 tabel dan 31 enum.

### Ditambahkan

- Tabel `forms`: master form, berisi tipe (Event atau Standalone), status, slug acak, aturan penerimaan response, pengaturan responder, dan tema tampilan.
- Tabel `form_sections`: section (halaman) dalam form, beserta navigasi setelah section selesai (lanjut, lompat ke section lain, atau submit).
- Tabel `form_items`: pertanyaan atau elemen konten (judul, gambar, video) di dalam section. Aturan validasi dan konfigurasi per tipe disimpan sebagai JSON.
- Tabel `form_options`: pilihan jawaban sekaligus baris dan kolom grid, termasuk aturan branching ke section tertentu.
- Tabel `form_responses`: satu kali pengisian (atau draft autosave) dari responder, termasuk responder anonim.
- Tabel `form_answers`: jawaban untuk satu pertanyaan, lengkap dengan snapshot judul dan tipe pertanyaan saat dijawab.
- Tabel `form_answer_selections`: jawaban bertipe pilihan (multiple choice, checkboxes, dropdown, dan grid).
- Tabel `form_answer_files`: file yang diunggah responder untuk pertanyaan bertipe File Upload.
- Enum baru: `FormType`, `FormStatus`, `FormResponderAccess`, `FormNavigationAction`, `FormItemType`, `FormOptionKind`, `FormResponseStatus`.

### Diubah

- Angka total di dokumentasi diperbaiki menjadi 134 tabel dan 31 enum. Sebelumnya pengantar menulis 123 model dan 23 enum, sedangkan penutup menulis 126 tabel dan 24 enum.
- Dokumentasi `forms` mencatat bahwa kolom `eventId` belum berupa foreign key, karena modul Event belum ada di skema.

## v1.0.0 — Baseline dokumentasi

Dokumentasi awal sebelum modul Form: 126 tabel, 24 enum, dan 11 modul (termasuk Job Board sebagai modul dummy).