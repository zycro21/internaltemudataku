# Dokumentasi Database TemuDataku

## 1. Pendahuluan

Dokumen ini berisi dokumentasi teknis untuk struktur database aplikasi
**TemuDataku** - platform mentoring & e-learning data science. Dokumentasi
ini disusun sebagai referensi bagi tim pengembang (backend, frontend,
maupun anggota baru yang onboarding) untuk memahami struktur data yang
digunakan aplikasi, tanpa perlu membaca langsung file `schema.prisma`.

## 2. Deskripsi

Database ini dibangun di atas **PostgreSQL**, dengan **Prisma ORM**
sebagai lapisan akses data dari sisi backend (Node.js/Express). Skema
mencakup seluruh domain bisnis aplikasi, di antaranya:

- **E-Learning** - course, sub-chapter, materi, quiz, assignment, progress
  belajar, sertifikat, hingga konten interaktif (accordion, carousel, tab
  navigation, kode eksekusi, dsb).
- **Article** - sistem artikel dengan block-based content editor (heading,
  paragraph, table, divider, link, table of content, media).
- **Mentoring** - booking sesi mentor, jadwal, program mentoring.
- **AYCL (All You Can Learn)** - paket akses belajar.
- **Affiliator** - program afiliasi, komisi, referral code.
- **User & Role Management** - akun, role, autentikasi.
- **Voucher & Redeem Code** - kode promo dan kode redeem akses gratis.
- **Payment & Withdrawal** - transaksi pembayaran dan penarikan dana.
- **Practice** - modul latihan mandiri (materi, submission, review).
- Serta modul pendukung lain: notifikasi, feedback, sertifikat, export log,
  dan lain-lain.

Per catatan terakhir, skema ini terdiri dari **123 model (tabel)** dan
**23 enum**, dikelola dalam satu file `schema.prisma`.

## 3. Cakupan & Cara Membaca Dokumen Ini

Setiap tabel dalam dokumen ini didokumentasikan dengan format yang
konsisten, mencakup:

1. **Fungsi tabel** - tabel ini dipakai untuk menyimpan data apa, dan
   berperan di bagian mana dari aplikasi.
2. **Penjelasan per kolom** - nama kolom, tipe data, apakah wajib diisi
   (`NOT NULL`) atau boleh kosong (`nullable`), beserta nilai default
   (kalau ada).
3. **Primary Key (PK) & Foreign Key (FK)** - kolom mana yang jadi kunci
   utama tabel, dan kolom mana yang mengacu ke tabel lain (beserta tabel
   tujuannya dan perilaku `onDelete`/`onUpdate`-nya kalau relevan).
4. **Catatan makna nilai** - khusus untuk kolom yang nilainya tidak
   langsung jelas hanya dari nama/tipe data-nya. Contoh: kolom `isActive`
   pada tabel `User` - `false` berarti akun dinonaktifkan/dihapus (soft
   delete), `true` berarti akun masih aktif dan bisa dipakai login.

### Legenda

| Simbol/Istilah | Arti |
|---|---|
| 🔑 PK | Primary Key |
| 🔗 FK | Foreign Key (relasi ke tabel lain) |
| `NOT NULL` | Kolom wajib diisi |
| `nullable` | Kolom boleh kosong (`NULL`) |
| `@default(...)` | Nilai default kalau tidak diisi saat insert |
| `@unique` | Nilai di kolom ini harus unik se-tabel |
| `onDelete: Cascade` | Kalau baris induk (parent) dihapus, baris ini ikut terhapus otomatis |
| `onDelete: SetNull` | Kalau baris induk dihapus, kolom FK ini otomatis jadi `NULL` |

## 4. Daftar Modul

*(Tiap modul di bawah akan didokumentasikan tabel-per-tabel di bagian
selanjutnya dari dokumen ini.)*

- [x] E-Learning
- [x] Article
- [x] Mentoring & Booking
- [x] AYCL
- [x] Affiliator & Referral
- [x] User & Role
- [x] Voucher & Redeem Code
- [x] Payment & Withdrawal
- [x] Practice
- [x] Modul Pendukung (Notifikasi, Feedback, Sertifikat, dll)
- [x] Job Board (Dummy - lihat 5.122-5.123)

---

## 5. Detail Tabel

### 5.1 `users`

**Fungsi tabel**: Tabel pusat/induk aplikasi - menyimpan data akun setiap
orang yang terdaftar (mentee, mentor, admin, dst - role-nya sendiri diatur
di tabel terpisah `UserRole`, bukan kolom di tabel ini). Hampir semua
modul lain (booking, e-learning, article, affiliator, dsb.) pada akhirnya
merujuk balik ke tabel ini untuk tahu "ini punya siapa".

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom` | `000004` | ID unik user, digenerate otomatis. |
| `email` | VarChar | `NOT NULL`, `@unique` | - | `budi.santoso@email.com` | Alamat email; dipakai untuk login & identitas unik akun. |
| `passwordHash` | VarChar | `nullable` | - | `$2b$10$abcdefghijklmnopqrstuv` | Hasil hashing password. `NULL` kalau user daftar/login lewat Google OAuth (tidak pernah set password manual). |
| `googleId` | VarChar | `nullable`, `@unique` | - | `104829384756201938475` | ID akun Google. Terisi kalau user pernah login/daftar pakai "Sign in with Google". |
| `fullName` | VarChar | `NOT NULL` | - | `Budi Santoso` | Nama lengkap user. |
| `phoneNumber` | VarChar | `nullable` | - | `081234567890` | Nomor telepon/WhatsApp. |
| `profilePicture` | VarChar | `nullable` | - | `https://lh3.googleusercontent.com/a/ACg8ocJIbX8aG8jQfSwR2wp-kwIFd10p-4MFP6w=s96-c` | Path atau nama file foto profil. |
| `city` | VarChar | `nullable` | - | `Surabaya` | Kota domisili. |
| `province` | VarChar | `nullable` | - | `Jawa Timur` | Provinsi domisili. |
| `isEmailVerified` | Boolean | `nullable` | `false` | `true` | `false` = email belum diverifikasi, `true` = sudah. |
| `verificationToken` | VarChar | `nullable` | - | `a1b2c3d4e5f6...` | Token yang dikirim ke email untuk proses verifikasi akun / reset password. |
| `verificationTokenExpires` | Timestamp(6) | `nullable` | - | `2025-04-17T08:18:57.733Z` | Batas waktu berlakunya `verificationToken`. |
| `registrationDate` | Timestamp(6) | `nullable` | `now()` | `2025-04-17T07:18:57.738Z` | Tanggal user pertama kali mendaftar. |
| `lastLogin` | Timestamp(6) | `nullable` | - | `2026-03-16T07:00:00Z` | Waktu login terakhir tercatat. |
| `isActive` | Boolean | `nullable` | `true` | `true` | **Lihat catatan khusus di bawah.** |
| `fcmToken` | VarChar | `nullable` | - | `f7Xk...token...9dQ` | Firebase Cloud Messaging token - dipakai buat kirim push notification ke device user. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris ini pertama kali dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Waktu baris ini terakhir diupdate. ⚠️ Tidak pakai `@updatedAt` bawaan Prisma, jadi kolom ini **tidak otomatis** ke-update - harus di-set manual di kode tiap kali ada perubahan. |
| `instagram` | VarChar | `nullable` | - | `@temudataku` | Link/username Instagram. |
| `twitter` | VarChar | `nullable` | - | `@temudataku` | Link/username Twitter/X. |
| `youtube` | VarChar | `nullable` | - | `youtube.com/@temudataku` | Link/username YouTube. |
| `tiktok` | VarChar | `nullable` | - | `@temudataku` | Link/username TikTok. |
| `otherSocialMedia` | VarChar | `nullable` | - | `facebook.com/temudataku` | Link media sosial lain di luar 4 platform di atas. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - `users` adalah tabel induk. Semua kolom
  relasi yang tercantum di model Prisma-nya (`bookings`, `certificates`,
  `eLearningSubscriptions`, dst.) adalah **relasi balik** (reverse
  relation) - FK-nya justru ada di tabel-tabel *lain* yang menunjuk ke
  `users.id`, bukan kolom fisik di tabel `users` sendiri.

#### 📌 Catatan Makna Nilai: `isActive`

Kolom ini berfungsi sebagai **flag aktif/nonaktif akun**
(soft-deactivate), berdasarkan nama kolom dan nilai default-nya:

- `true` (default) → akun aktif, bisa dipakai login & mengakses aplikasi
  seperti biasa.
- `false` → akun dinonaktifkan (mis. oleh admin, atau user menutup
  akunnya sendiri). Baris datanya **tidak dihapus** dari database - cuma
  ditandai nonaktif, supaya riwayat & relasi ke tabel lain (booking,
  transaksi, dll.) tetap utuh dan tidak rusak.

#### Relasi ke Tabel Lain (ringkasan)

Daftar tabel yang mereferensikan `users.id` (akan didokumentasikan
detail satu per satu di bagian selanjutnya):

| Modul | Tabel Terkait |
|---|---|
| Admin | `AdminActivityLog` |
| Mentoring/Booking | `Booking`, `BookingParticipant` |
| Sertifikat (mentoring) | `Certificate` |
| Feedback | `Feedback` |
| Mentor | `MentorProfile` (1:1) |
| Notifikasi | `NotificationRecipient` |
| Practice | `PracticeProgress`, `PracticePurchase`, `PracticeReview`, `PracticeSubmission` (sbg mentee & reviewer), `ProjectSubmission` (sbg mentee & grader) |
| Affiliator/Referral | `ReferralCode`, `ReferralUsage`, `AffiliatorProfile` (1:1), `WithdrawalMethod` |
| Aktivitas | `UserActivityLog`, `UserBehavior` |
| Role | `UserRole` |
| Short Link | `ShortLink` |
| E-Learning | `ELearningSubscription`, `ELearningReview`, `ELearningProgress`, `ELearningSubChapterProgress`, `ELearningBlockProgress`, `ELearningTextProgress`, `ELearningQuizAttempt`, `ELearningSubmission` (sbg pengumpul & reviewer), `ELearningCertificate`, `ELearningDiscussion`, `ELearningBookmark`, `ELearningCodeRun`, `ELearningAuditLog`, `ELearningCourseStreamCount` |
| AYCL | `AYCLBooking` |
| Voucher | `Voucher` (sbg pembuat), `VoucherUsage` |
| Redeem Code | `RedeemCode` (sbg pembuat), `RedeemCodeUsage`, `RedeemCodeAttempt` |
| Article | `Article`, `ArticleElementFavorite`, `ArticleLike`, `ArticleComment`, `ArticleCommentLike` |

---

### 5.2 `user_roles`

**Fungsi tabel**: Tabel pivot (junction table) untuk relasi
many-to-many antara `users` dan `roles`. Karena satu user bisa punya lebih
dari satu role sekaligus (contoh nyata: kasus akun `admin` + `mentee`
dobel role yang pernah kita bahas soal bug e-learning lock), hubungan
User↔Role tidak bisa langsung disimpan sebagai satu kolom di tabel
`users` - makanya dibikin tabel perantara ini, satu baris = satu
"user ini punya role ini".

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom` | `caffiliator-U6hbhm8LjH` | ID unik baris penugasan role. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000009` | Menunjuk ke `users.id` - user mana yang dapat role ini. |
| `roleId` | String | `NOT NULL`, 🔗 FK | - | `3` | Menunjuk ke `roles.id` - role apa yang diberikan. |
| `assignedDate` | Timestamp(6) | `nullable` | `now()` | `2025-09-29T03:04:58.477Z` | Tanggal role ini diberikan ke user. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-07-25T18:50:36.233Z` | Waktu baris ini dibuat (biasanya sama dengan `assignedDate`). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade` (kalau user
  dihapus permanen dari DB, semua baris penugasan role-nya ikut
  terhapus), `onUpdate: Cascade`.
- 🔗 **FK 2**: `roleId` → `roles.id` - `onDelete: Cascade` (kalau
  suatu role dihapus dari master data, semua penugasan role itu ke user
  manapun ikut terhapus), `onUpdate: Cascade`.

#### 📌 Catatan

Tidak ada constraint `@@unique([userId, roleId])` di tabel ini. Artinya,
**secara skema, tidak ada yang mencegah** kombinasi user+role yang sama
dimasukkan lebih dari sekali (baris duplikat). Kalau ternyata di aplikasi
mengandalkan `userRoles.length` atau semacamnya untuk logika apa pun,
baris duplikat bisa bikin hasilnya keliru.

---

### 5.3 `roles`

**Fungsi tabel**: Tabel master/lookup daftar role yang tersedia di
aplikasi (mis. admin, mentor, mentee, dst). Dipakai sebagai referensi
oleh `user_roles` untuk menentukan role apa saja yang bisa diberikan ke
user.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String | 🔑 PK, `NOT NULL` | `custom` | `1` | ID unik role. |
| `roleName` | VarChar | `NOT NULL`, `@unique` | - | `mentor` | Nama role, mis. `admin`, `mentor`, `mentee`, dll. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi/keterangan role, buat referensi tim (bukan dipakai logic). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu role ini dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - `roles` adalah tabel master, tidak
  bergantung ke tabel lain manapun.

#### 📌 Catatan

Kolom `roleName` **tidak dibatasi lewat `enum` di level database** -
cuma `VarChar` biasa, jadi nilai apa pun bisa dimasukkan lewat baris
data, tidak ada validasi di level skema. Berdasarkan pemakaian
`authorizeRoles(...)` yang pernah kita temui di kode backend (bukan dari
schema ini),  nilai yang dipakai di aplikasi antara lain:
`admin`, `mentor`, `mentee`, `cm`, `curdev`, `guest`, `cw`.

---

> **Catatan penempatan**: 3 tabel berikut ini (`activity_logs`,
> `user_activity_logs`, `user_behavior`) awalnya masuk daftar "Modul
> Pendukung", tapi ketiganya sama-sama FK langsung ke `users` dan
> fungsinya murni mencatat aktivitas/perilaku user - jadi ditaruh di sini,
> nempel setelah tabel inti User & Role, bukan di bagian akhir dokumen.
> Diberi penomoran `5.3a`/`5.3b`/`5.3c` (bukan `5.20` dst.) supaya sisipan
> ini **tidak menggeser nomor seluruh tabel setelahnya**

### 5.3a `admin_activity_logs`

**Fungsi tabel**: Log aktivitas umum di seluruh platform - mencakup aksi
level sistem (`LOGIN`, `CREATE_SERVICE`, `UPDATE_PROFILE`, dst.) maupun
aksi yang lebih granular (`join`, `leave`, `upload`, `send_message`,
`update_material`, dst., sesuai contoh komentar developer). Modelnya
bernama `AdminActivityLog`, tapi tabel fisiknya `activity_logs` (tanpa kata
"admin") dan FK-nya ke `users` biasa, bukan role admin secara spesifik.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl2cb62936682ba6e1904e86` | ID unik baris log. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang melakukan aksi. |
| `action` | VarChar | `NOT NULL` | - | `GET_ALL_PAYMENTS` | Nama aksi (freetext), contoh dari komentar developer: `LOGIN`, `CREATE_SERVICE`, `UPDATE_PROFILE`. |
| `description` | Text | `nullable` | - | `Admin mengambil daftar booking dengan filter: status=-, menteeName=-, page=1.` | Detail tambahan aksi. |
| `ipAddress` | VarChar | `nullable` | - | `103.10.24.5` | Alamat IP user saat aksi dilakukan. |
| `userAgent` | VarChar | `nullable` | - | `PostmanRuntime/7.49.1` | Info browser/perangkat. |
| `type` | VarChar | `nullable` | - | `READ` | Freetext, contoh dari komentar: `READ`, `EXPORT`, `UPDATE`, `AUTH`, dll. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu aksi terjadi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`.

#### 📌 Catatan

`action` dan `type` dua-duanya freetext `VarChar` tanpa enum, dan dari
contoh nilainya terlihat **saling tumpang tindih secara konsep** (`action`
berisi istilah level-sistem seperti `LOGIN`, sementara `type` berisi
istilah level-interaksi seperti `join`/`upload`) -  penggunaan
kedua kolom ini di kode aplikasi tidak sepenuhnya konsisten (mis. tidak
semua baris log mengisi keduanya sekaligus). Tidak ada index tambahan
selain PK/FK di tabel ini, jadi query log berdasarkan rentang waktu atau
jenis aksi tertentu berpotensi lambat pada data yang besar.

---

### 5.3b `user_activity_logs`

**Fungsi tabel**: Log kunjungan halaman oleh user - lebih sederhana &
lebih spesifik dari `activity_logs` (5.3a), fokus ke halaman apa yang
dibuka dan berapa lama.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom()` | `log_1760367016723_ZKoyOr` | ID unik baris log. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000016` | User yang mengunjungi halaman. |
| `page` | String | `NOT NULL` | - | `/dashboard/mentor/services/project` | Halaman yang dikunjungi (freetext,  path/URL). |
| `durationSec` | Int | `NOT NULL` | `0` | `45` | Lama waktu di halaman tersebut (detik). |
| `accessedAt` | DateTime | `NOT NULL` | `now()` | `2026-03-16T07:45:00Z` | Waktu halaman diakses. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`.

#### 📌 Catatan

Mirip fungsinya dengan `user_behavior` (5.3c) di bawah, tapi `userId` di
sini **wajib diisi** (`NOT NULL`) - beda dari `user_behavior.userId` yang
nullable (bisa mencatat pengunjung anonim/belum login). 
`user_activity_logs` khusus untuk user yang sudah login, sementara
`user_behavior` mencakup semua pengunjung termasuk yang belum login.

---

### 5.3c `user_behavior` (MASIH TIDAK DIPAKAI)

**Fungsi tabel**: Log perilaku pengunjung yang lebih luas dari
`user_activity_logs` (5.3b) - bisa mencatat pengunjung **anonim** (belum
login) karena `userId` nullable, sekaligus menyimpan info IP & user agent
seperti `activity_logs` (5.3a).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl762855b3f62c1a860ee698` | ID unik baris log. |
| `userId` | String | `nullable`, 🔗 FK | - | `000008` | User terkait - **nullable**, jadi bisa mencatat pengunjung yang belum login. |
| `pageVisited` | VarChar | `NOT NULL` | - | `/dashboard` | Halaman yang dikunjungi. |
| `action` | VarChar | `nullable` | - | `enroll_course` | Aksi yang dilakukan di halaman tersebut (freetext). |
| `timestamp` | Timestamp(6) | `nullable` | `now()` | `2026-03-16T07:45:00Z` | Waktu kejadian. |
| `ipAddress` | VarChar | `nullable` | - | `103.10.24.5` | Alamat IP pengunjung. |
| `userAgent` | VarChar | `nullable` | - | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)` | Info browser/perangkat. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id`, opsional - `onDelete: Cascade`, `onUpdate: Cascade`.

#### 📌 Catatan

Tabel ini, `activity_logs` (5.3a), dan `user_activity_logs` (5.3b)
bersama-sama membentuk **3 sistem logging yang tumpang tindih** dan
sepertinya dibangun secara terpisah di waktu yang berbeda (nama tabel/
kolomnya juga tidak seragam - `pageVisited` di sini vs `page` di 5.3b,
`timestamp`/`createdAt` dua-duanya ada di sini padahal isinya 
sama). Ketiganya sama-sama punya kolom IP/user-agent kecuali 5.3b. Perlu
dicek ke kode aplikasi mana yang benar-benar masih dipakai aktif sebelum
mengandalkan salah satunya untuk analitik.

---

### 5.4 `mentor_profiles`

**Fungsi tabel**: Data tambahan khusus untuk user yang berperan sebagai
mentor - relasi 1:1 dengan `users` (satu user maksimal punya satu profil
mentor). Ini tabel "hub" untuk sisi mentor.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `Mentor-....` | `Mentor-000002` | ID unik profil mentor. |
| `userId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `000011` | Menunjuk ke `users.id`. `@unique` di sini yang bikin relasinya 1:1 (bukan 1:banyak). |
| `expertise` | Text | `nullable` | - | `Data Science, Machine Learning` | Bidang keahlian mentor (mis. "Data Science", "Machine Learning"). |
| `bio` | Text | `nullable` | - | `Data scientist dengan 5 tahun pengalaman.` | Deskripsi/bio singkat mentor. |
| `experience` | Text | `nullable` | - | `5 tahun ` | Pengalaman kerja/mengajar mentor. |
| `availabilitySchedule` | JSONB | `nullable` | - | `{"tuesday":["10.00 - 12.00","15.00 - 17.00"],"saturday":["13.00 - 15.00"],"thursday":["09.00 - 11.00"]}` | Jadwal ketersediaan mentor. Strukturnya bebas (JSON). |
| `hourlyRate` | Decimal | `nullable` | - | `200` | Tarif per jam mentor. |
| `isVerified` | Boolean | `nullable` | `false` | `true` |  status "sudah diverifikasi admin" - `false` = belum diverifikasi (belum boleh tampil publik/terima booking?), `true` = sudah. |
| `linkedin` | Text | `nullable` | - | `https://www.linkedin.com/in/mochamaddimasputrahermawan` | Link profil LinkedIn mentor. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu profil dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Waktu terakhir diupdate. Tidak pakai `@updatedAt`, jadi tidak auto-update. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`mentor_profiles` jadi rujukan untuk: `mentoring_service_mentors`,
`mentoring_session_mentors`, `Practice` (sudah dibahas di 5.78), `mentor_report`,
`ELearningCourse` (mentor pengajar course - relasi `"MentorCourses"`),
dan `MentorEarningSummary` (1:1, sudah dibahas di 5.19).

---

### 5.5 `mentor_report`

**Fungsi tabel**: Laporan evaluasi yang diisi mentor setelah selesai satu
sesi mentoring (`MentoringSession`) - semacam catatan "bagaimana
peserta di sesi ini".

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl8e9375e382022f41f5cb73` | ID unik laporan. |
| `sessionId` | String | `NOT NULL`, 🔗 FK | - | `cl1e208481c9d2435e707c90` | Menunjuk ke `mentoring_sessions.id`. |
| `mentorProfileId` | String | `NOT NULL`, 🔗 FK | - | `cld37ab94293c5c322214c71` | Menunjuk ke `mentor_profiles.id` - mentor yang menulis laporan. |
| `understanding` | Text | `nullable` | - | `Cukup baik, perlu latihan lebih banyak.` | Catatan tingkat pemahaman peserta. |
| `participation` | Text | `nullable` | - | `Aktif bertanya dan mengerjakan tugas.` | Catatan keaktifan/partisipasi peserta. |
| `challenges` | Text | `nullable` | - | `Membersihkan dataset yang berantakan.` | Kendala yang ditemui selama sesi. |
| `commonQuestions` | Text | `nullable` | - | `Apakah cocok untuk pemula?` | Pertanyaan yang sering muncul dari peserta. |
| `nextFocus` | Text | `nullable` | - | `Latihan studi kasus regresi logistik.` | Rencana fokus untuk sesi berikutnya. |
| `additionalNotes` | Text | `nullable` | - | `Mentee disarankan ikut sesi tambahan.` | Catatan tambahan bebas. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu laporan dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | auto | `2026-03-16T08:00:00Z` | Pakai `@updatedAt` - **otomatis** ter-update Prisma tiap ada perubahan baris (beda dari kebanyakan tabel lain di skema ini yang harus di-set manual). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `sessionId` → `mentoring_sessions.id` - `onDelete`/`onUpdate` **tidak didefinisikan eksplisit** di skema (pakai default provider, umumnya `RESTRICT` - sesi tidak bisa dihapus kalau masih ada laporan yang menunjuk ke situ).
- 🔗 **FK 2**: `mentorProfileId` → `mentor_profiles.id` - sama, tidak ada `onDelete`/`onUpdate` eksplisit.

#### 📌 Catatan

Kolom `sessionId` dan `mentorProfileId` di tabel ini **tidak pakai
`@map`**, jadi nama kolom fisik di database persis camelCase
(`sessionId`, `mentorProfileId`) - beda dari konvensi snake_case
(`session_id`, dst.) yang dipakai mayoritas tabel lain di skema ini.
Bukan masalah fungsional, tapi baik diketahui kalau nanti ada yang query
manual pakai raw SQL.

---

### 5.6 `mentoring_services`

**Fungsi tabel**: Tabel produk/program mentoring utama - satu baris =
satu program mentoring yang dijual (mis. Bootcamp, Group
Mentoring). Ini tabel induk untuk seluruh konten pendukung halaman detail
program (section, tools, jadwal, portofolio, testimoni) serta booking dan
sesi-sesinya.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `(type mentoringservice)-....` | `bootcamp-000003` | ID unik program. |
| `serviceName` | VarChar | `NOT NULL` | - | `Data Science Bootcamp` | Nama program mentoring. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi program. |
| `price` | Decimal | `NOT NULL` | - | `150000` | Harga jual program. |
| `strikePrice` | Decimal | `nullable` | - | `300000` | "Harga coret" - harga asal sebelum diskon, ditampilkan dicoret di UI |
| `serviceType` | VarChar | `nullable` | - | `(freetext)` | Jenis/kategori layanan (nilai bebas, tidak di-enum). |
| `maxParticipants` | Int | `nullable` | - | `30` | Kapasitas maksimal peserta. |
| `durationDays` | Int | `NOT NULL` | - | `30` | Lama program berjalan (hari). |
| `startDate` | Timestamp | `nullable` | - | `22026-05-06T00:00:00.000Z` | Tanggal mulai program. |
| `endDate` | Timestamp | `nullable` | - | `2026-05-06T00:00:00.000Z` | Tanggal selesai program. |
| `thumbnail` | VarChar | `nullable` | - | `/images/mentoringThumbnail/thumbnail-mentoring-mentoring-20260626-jnply.jpg` | Path/nama file gambar thumbnail. |
| `whatsappGroup` | VarChar | `nullable` | - | `https://chat.whatsapp.com/AbCdEfGhIj` | Link grup WhatsApp untuk peserta program ini. |
| `programAbout` | Text | `nullable` | - | `Program mentoring intensif 8 minggu.` | Ringkasan "tentang program". |
| `totalWeeks` | Int | `nullable` | - | `8` | Total durasi program dalam minggu. |
| `totalProjects` | Int | `nullable` | - | `4` | Total jumlah project dalam program. |
| `slug` | VarChar | `nullable`, `@unique` | - | `belajar-python-untuk-pemula` | Slug URL untuk halaman detail program. |
| `isFeatured` | Boolean | `NOT NULL` | `false` | `true` | `true` = program ditandai unggulan/ditampilkan menonjol di listing. |
| `difficultyOrder` | Int | `nullable` | - | `1` | Angka urutan untuk sorting berdasarkan tingkat kesulitan. |
| `category` | VarChar | `nullable` | - | `Data Science` | Kategori program. |
| `level` | VarChar | `nullable` | - | `Intermediate` | Level kesulitan (nilai bebas, tidak di-enum). |
| `isActive` | Boolean | `nullable` | `true` | `true` |  toggle publish/tayang - `false` = program disembunyikan dari listing publik, `true` = tampil. *(pola sama seperti `isActive` di `users` |
| `installmentAvailable` | Boolean | `NOT NULL` | `false` | `true` | `true` = program ini bisa dibayar dengan cicilan. |
| `maxInstallmentMonths` | Int | `nullable` | - | `3` | Jumlah bulan cicilan maksimal, kalau `installmentAvailable` true. |
| `createdAt` | Timestamp | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp | `nullable` | - | `2026-03-16T08:00:00Z` | Waktu terakhir diupdate (tidak auto). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel induk/master produk mentoring.

---

### Enum: `MentoringSectionType`

Dipakai di kolom `type` pada tabel `mentoring_sections`.

| Nilai | Keterangan |
|---|---|
| `BENEFIT` | Section berisi manfaat/keuntungan ikut program. |
| `MECHANISM` | Section berisi mekanisme/cara program berjalan. |
| `SYLLABUS` | Section berisi silabus/materi yang diajarkan. |
| `TARGET` | Section berisi target peserta yang cocok ikut program. |

---

### 5.7 `mentoring_sections`

**Fungsi tabel**: Blok konten deskriptif yang tampil di halaman detail
`mentoring_services` - satu baris = satu section (benefit, mekanisme,
silabus, atau target peserta).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clc42c9113845a8d34c4e0f6` | ID unik section. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000012` | Menunjuk ke `mentoring_services.id`. |
| `type` | Enum `MentoringSectionType` | `NOT NULL` | - | `MECHANISM` | Jenis section - lihat tabel enum di atas. |
| `title` | Text | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul section. |
| `content` | JSON | `NOT NULL` | - | `{"title":"Foundation of Production-Ready ML & API Development","description":"Mempelajari cara mengubah model machine learning (scikit-learn/TensorFlow) menjadi layanan mandiri menggunakan FastAPI atau Flask, termasuk implementasi request validation, error handling, dan pembuatan dokumentasi API otomatis dengan Swagger."}` | Isi section. Strukturnya menurut komentar developer di skema: untuk **semua** nilai `type` saat ini selalu berbentuk `{ title: string, description: string }`. |
| `order` | Int | `NOT NULL` | - | `1` | Urutan tampil section di halaman. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade` (service dihapus → semua section-nya ikut terhapus).

#### 📌 Catatan

Ada index tambahan `@@index([serviceId, order])` (bukan PK/FK) - dipasang
supaya query "ambil semua section milik satu service, terurut sesuai
`order`" lebih cepat. Kolom `serviceId` juga **tidak pakai `@map`** (sama
seperti kasus di `mentor_report`).

---

### 5.8 `mentoring_tools`

**Fungsi tabel**: Daftar tools/teknologi yang diajarkan/dipakai dalam
suatu program mentoring (mis. "Python", "Tableau", "Excel") - ditampilkan
sebagai badge/list di halaman detail program.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl589ca72d179e3e2f4a2284` | ID unik baris tool. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000012` | Menunjuk ke `mentoring_services.id`. |
| `name` | Text | `NOT NULL` | - | `Budi Santoso` | Nama tool. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`.

---

### 5.9 `mentoring_schedules`

**Fungsi tabel**: Daftar tanggal pelaksanaan untuk suatu program
mentoring (mis. tanggal-tanggal sesi live yang dijadwalkan).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl20b99334fec59e591d4214` | ID unik baris jadwal. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000013` | Menunjuk ke `mentoring_services.id`. |
| `date` | Timestamp | `NOT NULL` | - | `2026-03-16T08:00:00Z` | Tanggal pelaksanaan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`.

---

### 5.10 `mentoring_portfolios`

**Fungsi tabel**: Contoh portofolio/hasil karya mentee dari program ini -
dipakai sebagai social proof/bukti hasil belajar di halaman detail
program.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl15506ac1ddc5820251ba96` | ID unik portofolio. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000015` | Menunjuk ke `mentoring_services.id`. |
| `title` | Text | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul portofolio. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi portofolio. |
| `menteeName` | Text | `NOT NULL` | - | `Siti Rahma` | Nama mentee pemilik portofolio (teks bebas, bukan FK ke `users` - jadi tidak wajib akun mentee itu masih terdaftar/ada). |
| `projectLink` | Text | `NOT NULL` | - | `https://x.com/home` | Link menuju hasil karya/project. |
| `thumbnail` | Text | `nullable` | - | `https://cdn.temudataku.com/thumb/thumb-01.jpg` | Gambar thumbnail portofolio. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`.

---

### 5.11 `mentoring_testimonials`

**Fungsi tabel**: Testimoni peserta untuk suatu program mentoring
tertentu - ditampilkan di halaman detail program (beda dari testimoni
umum lain kalau ada modul testimoni terpisah).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl6e0af4bec48eedf898657d` | ID unik testimoni. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000013` | Menunjuk ke `mentoring_services.id`. |
| `name` | Text | `NOT NULL` | - | `Budi Santoso` | Nama pemberi testimoni (teks bebas, bukan FK ke `users`). |
| `role` | Text | `nullable` | - | `Backend Developer` | Keterangan peran/status pemberi testimoni (mis. "Mahasiswa", "Career Switcher"). |
| `comment` | Text | `NOT NULL` | - | `Materinya jelas dan mudah dipahami!` | Isi testimoni. |
| `rating` | Int | `NOT NULL` | - | `3` | Rating angka. Tidak ada batas min/max di level skema - validasi rentang (mis. 1-5)  di level aplikasi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`.

---

### 5.12 `mentoring_service_mentors`

**Fungsi tabel**: Tabel pivot many-to-many antara `mentoring_services`
dan `mentor_profiles` - menentukan mentor mana saja yang mengampu suatu
program mentoring (satu program bisa punya banyak mentor, satu mentor
bisa mengampu banyak program).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clfd50fbe155e2a1e831d8f6` | ID unik baris penugasan. |
| `mentoringServiceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000001` | Menunjuk ke `mentoring_services.id`. |
| `mentorProfileId` | String | `NOT NULL`, 🔗 FK | - | `Mentor-000002` | Menunjuk ke `mentor_profiles.id`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `mentoringServiceId` → `mentoring_services.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `mentorProfileId` → `mentor_profiles.id` - `onDelete: Cascade`.

#### 📌 Catatan

Ada `@@unique([mentoringServiceId, mentorProfileId])` - **beda dari**
`user_roles` yang tidak punya constraint serupa. Di sini kombinasi
service+mentor yang sama **tidak bisa** dimasukkan dua kali; database
akan menolak (constraint violation) kalau dicoba.

---

### 5.13 `mentoring_sessions`

**Fungsi tabel**: Satu sesi pertemuan/kelas live untuk suatu
`mentoring_services`, pada tanggal & jam tertentu - termasuk link
meeting, rekaman, dan materi presentasinya.

> ℹ️ Sama seperti `mentoring_services`, model ini juga punya komentar
> introspeksi (`/// This model ... has comments in the database`) -
> artefak dari `COMMENT ON` di PostgreSQL, bukan catatan developer.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(session-....-type)` | `Session-7kwdWGr0cl-bootcamp-000007` | ID unik sesi. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000007` | Menunjuk ke `mentoring_services.id`. |
| `date` | **String** | `NOT NULL` | - | `19-03-2026` | Tanggal sesi. ⚠️ Disimpan sebagai **teks bebas**, bukan tipe `Date`/`Timestamp` asli Postgres - format & validasinya sepenuhnya tanggung jawab aplikasi. |
| `startTime` | **String** | `NOT NULL` | - | `2026-03-19T12:30:00.000Z` | Jam mulai. ⚠️ Sama seperti `date`, bertipe teks bebas, bukan `Time`. |
| `endTime` | **String** | `NOT NULL` | - | `2026-03-19T14:30:00.000Z` | Jam selesai. ⚠️ Sama, teks bebas. |
| `durationMinutes` | Int | `NOT NULL` | - | `60` | Durasi sesi dalam menit. |
| `meetingLink` | VarChar | `nullable` | - | `https://meet.google.com/abc-defg-hij` | Link meeting (mis. Zoom/Google Meet). |
| `meetingId` | VarChar | `nullable` | - | `ML-777-06` | ID meeting. |
| `passcode` | VarChar | `nullable` | - | `482913` | Passcode/kode akses meeting. |
| `status` | VarChar | `nullable` | - | `scheduled` | Status sesi. Nilai bebas (bukan enum) - cek kode aplikasi untuk daftar nilai pastinya ( mis. "scheduled", "completed", "cancelled"). |
| `notes` | Text | `nullable` | - | `Revisi bagian analisis data.` | Catatan tambahan tentang sesi. |
| `pptLink` | VarChar | `nullable` | - | `https://docs.google.com/presentation/d/abc123` | Link slide presentasi sesi. |
| `recordingLink` | VarChar | `nullable` | - | `https://drive.google.com/file/d/rec123` | Link rekaman sesi. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Waktu terakhir diupdate (tidak auto). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### 📌 Catatan

Kolom `date`, `startTime`, `endTime` semuanya bertipe **String**, bukan
tipe tanggal/waktu native PostgreSQL. Implikasinya: tidak ada validasi
format di level database (mis. mencegah string bukan-tanggal masuk),
dan query yang butuh perbandingan tanggal (mis. "sesi minggu ini")
harus dilakukan lewat parsing string di level aplikasi, bukan operator
tanggal SQL langsung.

---

### 5.14 `mentoring_session_mentors`

**Fungsi tabel**: Tabel pivot many-to-many antara `mentoring_sessions`
dan `mentor_profiles` - menentukan mentor mana yang bertugas di satu
sesi spesifik (beda dari `mentoring_service_mentors` yang levelnya per
*program*, ini levelnya per *sesi individual*).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl54912540daf3b6ca67e980` | ID unik baris penugasan. |
| `mentoringSessionId` | String | `NOT NULL`, 🔗 FK | - | `Session-9ksKLL3VGm-bootcamp-000002` | Menunjuk ke `mentoring_sessions.id`. |
| `mentorProfileId` | String | `NOT NULL`, 🔗 FK | - | `Mentor-000002` | Menunjuk ke `mentor_profiles.id`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `mentoringSessionId` → `mentoring_sessions.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `mentorProfileId` → `mentor_profiles.id` - `onDelete: Cascade`.

#### 📌 Catatan

Sama seperti `mentoring_service_mentors`, ada
`@@unique([mentoringSessionId, mentorProfileId])` - mentor yang sama
tidak bisa ditugaskan dobel ke sesi yang sama.

---

### 5.15 `bookings`

**Fungsi tabel**: Transaksi booking - satu baris dibuat saat mentee
mendaftar/memesan satu `mentoring_services` tertentu. Ini tabel order
utama untuk sisi mentoring (analog dengan "keranjang yang sudah checkout"
untuk satu program).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom()` | `Booking-bootcamp-2650556436` | ID unik booking. |
| `menteeId` | String | `NOT NULL`, 🔗 FK | - | `000016` | Mentee yang melakukan booking. |
| `mentoringServiceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000009` | Program mentoring yang dibooking. |
| `referralUsageId` | String | `nullable`, `@unique`, 🔗 FK | - | `clb1c23af6f78f71fa085593` | Terisi kalau booking ini pakai kode referral (relasi opsional 1:1 ke `ReferralUsage`, sudah dibahas di 5.88). |
| `bookingDate` | Timestamp | `nullable` | `now()` | `2025-10-13T22:44:04.214Z` | Tanggal booking dibuat. |
| `status` | VarChar | `nullable` | - | `completed` | Status booking. Nilai bebas (bukan enum) - perlu dicek ke kode untuk daftar pastinya ( `pending`/`confirmed`/`completed`/`cancelled`, dsb). |
| `specialRequests` | Text | `nullable` | - | `Mohon jadwalkan sesi malam hari.` | Permintaan khusus dari mentee. |
| `material` | Text | `nullable` | - | `Etika Bisnis dalam Data` | Catatan materi yang diminta/dibawa. |
| `expectedOutput` | Text | `nullable` | - | `Hello World` | Ekspektasi hasil/output dari mentee. |
| `supportDocument` | Text | `nullable` | - | `[https://cdn.temudataku.com/docs/panduan.pdf]` | Dokumen pendukung (path/link). |
| `createdAt` | Timestamp | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | Timestamp | `nullable` | - | `2026-03-16T08:00:00Z` | Tidak `@updatedAt` - manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `menteeId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `mentoringServiceId` → `mentoring_services.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 3**: `referralUsageId` → `referral_usages.id` (relasi `"ReferralUsageBooking"`) - `onDelete: Cascade`, `onUpdate: Cascade`. Opsional (`nullable` + `@unique` = 1:1 kalau terisi).

#### 📌 Catatan

- `menteeId` **tidak pakai `@map`**, jadi nama kolom fisiknya persis
  `menteeId` (camelCase) - sama seperti kasus `mentor_report` sebelumnya,
  beda dari konvensi snake_case mayoritas tabel lain.
- Selain `participants` (dibahas di bawah), `bookings` juga jadi rujukan
  untuk `voucherUsage` (relasi `"VoucherUsageBooking"`, 1:1, sudah
  dibahas di 5.96) dan `invoice` (`BookingInvoice`, 1:1, sudah dibahas
  di 5.82).

---

### 5.16 `booking_participants`

**Fungsi tabel**: Daftar peserta individual dalam satu `bookings` -
relevan untuk booking bertipe grup (mis. Group Mentoring) di mana satu
transaksi booking bisa punya banyak peserta, masing-masing dengan status
pembayaran sendiri-sendiri.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl81b435bddc260408b68cc6` | ID unik baris peserta. |
| `bookingId` | String | `NOT NULL`, 🔗 FK | - | `Booking-bootcamp-7415093928` | Booking mana yang diikuti peserta ini. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang jadi peserta. |
| `paymentStatus` | String | `NOT NULL` | - | `confirmed` | Status pembayaran peserta ini. Menurut komentar developer di skema: contoh nilainya `'pending'`, `'confirmed'`, dsb - tapi tetap bukan `enum` (bebas, tidak divalidasi database). |
| `paymentId` | String | `nullable`, 🔗 FK | - | `PAY-BKG-20251005-6408633176` | Menunjuk ke transaksi `Payment` terkait peserta ini (sudah dibahas di 5.81). |
| `isLeader` | Boolean | `NOT NULL` | `false` | `true` | Lihat catatan di bawah. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `bookingId` → `bookings.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 3**: `paymentId` → `payments.id` (relasi `"ParticipantPayment"`) - *(tidak ada `onDelete` eksplisit, pakai default provider.)*

#### 📌 Catatan Makna Nilai: `isLeader`

menandai **siapa pemesan utama/kontak utama** dalam
satu booking grup - `true` = peserta ini yang jadi "ketua" (biasanya yang
pertama kali melakukan booking), `false` = peserta tambahan biasa yang
ikut ditambahkan ke booking yang sama (berlaku untuk yang mentoring service type group).

---

### 5.17 `certificates`

**Fungsi tabel**: Sertifikat kelulusan untuk program **mentoring**
(bukan e-learning - e-learning punya tabel sertifikat sendiri,
`e_learning_certificates` (5.69), yang sudah dibahas di modul
E-Learning). Diterbitkan untuk mentee yang sudah menyelesaikan satu
`mentoring_services`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld9fb2dbf6a7d10d2b4d8f2` | ID unik sertifikat. |
| `menteeId` | String | `NOT NULL`, 🔗 FK | - | `000008` | Mentee penerima sertifikat. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `bootcamp-000004` | Program mentoring yang diselesaikan. |
| `certificateNumber` | VarChar | `NOT NULL`, `@unique` | - | `CERT-1766404211677-8N5RH` | Nomor sertifikat, dipakai juga di halaman verifikasi publik. |
| `issueDate` | Timestamp(6) | `nullable` | `now()` | `2025-12-22T11:50:33.594Z` | Tanggal sertifikat diterbitkan. |
| `certificatePath` | VarChar | `nullable` | - | `/certificates/CERT-1766404211677-8N5RH-000016.pdf` | Path file sertifikat di server. |
| `googleDriveUrl` | VarChar | `nullable` | - | `https://drive.google.com/file/d/abc123` | Link Google Drive sertifikat (pola sama seperti sertifikat e-learning - dipakai untuk preview `/preview` di iframe). |
| `projectCertificatePath` | VarChar | `nullable` | - | `/certs/project-001.pdf` | Path sertifikat halaman ke-2 (kompetensi/project) - mirip pola dokumen 2-halaman "Sertifikat & Kompetensi" di e-learning. |
| `status` | VarChar | `nullable` | - | `generated` | Menurut komentar developer di skema: nilainya `generated`, `sent`, atau `viewed` |
| `verifiedBy` | VarChar | `nullable` | - | `(freetext)` | ID admin/mentor yang memverifikasi (opsional). ⚠️ **Bukan foreign key sungguhan** - cuma kolom teks biasa yang menyimpan ID, tidak ada relasi/`onDelete` yang menjaga integritasnya ke tabel `users`. |
| `note` | VarChar | `nullable` | - | `Sertifikat dikirim ulang atas permintaan user.` | Catatan internal admin (tidak untuk publik). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Tidak `@updatedAt` - manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `menteeId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([menteeId, serviceId])` - satu
  mentee cuma bisa punya **satu** sertifikat per program (tidak bisa
  diterbitkan dobel untuk program yang sama).

#### 📌 Catatan

Nilai `status` (`generated`/`sent`/`viewed`) di tabel ini **konsisten**
dengan pola `StatusBadge` yang sudah pernah kita lihat di komponen
`CertificateVerifiedCard.tsx` untuk sertifikat e-learning - 
besar dua sistem sertifikat ini (mentoring & e-learning) memang dirancang
mengikuti alur status yang sama, meski disimpan di tabel terpisah.

---

### 5.18 `feedback`

**Fungsi tabel**: Feedback/rating dari peserta terhadap **satu sesi
mentoring spesifik** (`mentoring_sessions`) - bukan feedback untuk
keseluruhan program, tapi per pertemuan individual.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl38c22f11a63c5fd8df2501` | ID unik feedback. |
| `sessionId` | String | `NOT NULL`, 🔗 FK | - | `Session-9ksKLL3VGm-bootcamp-000002` | Sesi mentoring yang diberi feedback. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang memberi feedback. |
| `rating` | Decimal(3,1) | `NOT NULL` | - | `3.9` | Angka rating, mendukung 1 desimal (mis. `4.5`). Rentang nilai tidak dibatasi `CHECK` di database. |
| `comment` | Text | `nullable` | - | `Materinya jelas dan mudah dipahami!` | Isi komentar/feedback. |
| `submittedDate` | Timestamp(6) | `nullable` | `now()` | `2026-03-20T14:00:00Z` | Tanggal feedback dikirim. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Tidak `@updatedAt` - manual. |
| `isAnonymous` | Boolean | `NOT NULL` | `false` | `false` | Sesuai komentar developer di skema: **"Jika true, nama user tidak ditampilkan"**. |
| `isVisible` | Boolean | `NOT NULL` | `true` | `true` | Sesuai komentar developer di skema: **"Bisa di-hide admin dari publik"** - jadi `false` berarti feedback ini sengaja disembunyikan admin dari tampilan publik, bukan dihapus. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `sessionId` → `mentoring_sessions.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([sessionId, userId])` - sesuai
  komentar developer di skema: **"Satu user hanya bisa beri satu
  feedback untuk satu session"**.

---

### 5.19 `mentor_earning_summaries`

**Fungsi tabel**: Ringkasan/rekap pendapatan seorang mentor - tabel
**cache agregat** (bukan sumber transaksi mentah) yang dipakai untuk
menampilkan dashboard earning mentor tanpa perlu menghitung ulang dari
seluruh riwayat transaksi setiap kali halaman dibuka.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clce8a3d4f22726ccd812dae` | ID unik ringkasan. |
| `mentorProfileId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `Mentor-000002` | Mentor pemilik ringkasan ini (1:1). |
| `totalEarnings` | Decimal | `NOT NULL` | - | `1250000` | Total pendapatan *all-time*. Sesuai komentar developer: **sudah dipotong bagi hasil (share) platform**, jadi ini angka net, bukan gross transaksi. |
| `totalThisMonth` | Decimal | `NOT NULL` | - | `600000` | Total pendapatan bulan berjalan (net, sudah dipotong share). |
| `totalLastMonth` | Decimal | `NOT NULL` | - | `450000` | Total pendapatan bulan lalu (net, sudah dipotong share). |
| `growthPercent` | Int | `NOT NULL` | - | `12.5` | Persentase pertumbuhan,  dihitung dari perbandingan `totalThisMonth` vs `totalLastMonth`. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt` - **otomatis** ter-update Prisma. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `mentorProfileId` → `mentor_profiles.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### 📌 Catatan

`updatedAt` di tabel ini **otomatis** (`@updatedAt`) - menambah daftar
tabel dengan perilaku ini selain `mentor_report`, berbeda dari mayoritas
tabel lain di modul Mentoring (`users`, `mentor_profiles`,
`mentoring_services`, `bookings`, `certificates`, `feedback`) yang
`updatedAt`-nya **manual**. Kalau ada kebutuhan audit lintas tabel
berbasis `updatedAt`, penting diingat tidak semua tabel berperilaku sama.

---

## Modul: AYCL (All You Can Learn)

> ℹ️ **Catatan pola untuk seluruh modul ini**: Berbeda dari
> mayoritas tabel lain (`users`, `mentoring_*`, dst.) yang rajin pakai
> `@map(...)` untuk konversi ke snake_case, **seluruh tabel AYCL sama
> sekali tidak pakai `@map` di level kolom** - cuma nama tabelnya saja
> yang di-`@map` ke snake_case (`aycl_batches`, dst). Artinya nama kolom
> fisik di database modul ini **persis camelCase** seperti nama field di
> Prisma-nya (`batchId`, `startTime`, `whatsappGroupLink`, dst) - bukan
> `batch_id`, `start_time`. Ini konsisten di seluruh 6 tabel di bawah,
> jadi tidak saya ulang-ulang di tiap tabel.

### 5.20 `aycl_batches`

**Fungsi tabel**: Master data satu batch/angkatan program AYCL - mirip
peran `mentoring_services` di modul Mentoring, tapi untuk program AYCL.
Berisi info landing page (headline, sub-headline) sekaligus harga & masa
aktif program.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(AYCL-....-....)` | `AYCL-1780092850103-3D7232` | ID unik batch. |
| `title` | Text | `NOT NULL` | - | `Belajar Python untuk Pemula` | Nama batch. |
| `slug` | Text | `NOT NULL`, `@unique` | - | `belajar-python-untuk-pemula` | Slug URL-friendly untuk halaman detail. |
| `headline` | Text | `NOT NULL` | - | `Belajar Data Science dari Nol` | Judul besar di hero landing page. Contoh dari komentar developer: *"All You Can Learn • Data Analyst Program"*. |
| `subHeadline` | Text | `nullable` | - | `Kelas untuk pemula tanpa background IT` | Sub-judul pendukung headline. Contoh: *"Upgrade skill Data Analyst..."*. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Intro singkat program. |
| `whatsappGroupLink` | Text | `nullable` | - | `https://chat.whatsapp.com/AbCdEfGhIj` | Link grup WhatsApp peserta. |
| `price` | Decimal | `NOT NULL` | - | `150000` | Harga program. |
| `startDate` | DateTime | `nullable` | - | `2026-04-01` | Tanggal mulai batch. |
| `endDate` | DateTime | `nullable` | - | `2026-05-01` | Tanggal selesai batch. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | `false` = batch tidak ditampilkan/tidak bisa dibooking lagi. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | DateTime | `nullable` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt` - otomatis ter-update Prisma (walau tipe kolomnya tetap nullable di skema). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel induk modul AYCL.

#### Relasi ke Tabel Lain (ringkasan)

`schedules` (→ `aycl_schedules`), `bookings` (→ `aycl_bookings`),
`sections` (→ `aycl_sections`), `materials` (→ `aycl_materials`).

---

### 5.21 `aycl_sections`

**Fungsi tabel**: Konten section pada halaman landing satu
`aycl_batches` - mirip peran `mentoring_sections`, tapi dengan struktur
JSON yang **berbeda-beda per tipe** (lihat catatan di bawah - ini beda
dari `mentoring_sections` yang formatnya seragam untuk semua tipe).

**Enum `AYCLSectionType`** (dengan makna dari komentar developer di
skema):

| Nilai | Makna (label yang ditampilkan) |
|---|---|
| `PROGRAM_INFO` | "Ini Program Apa?" |
| `CHALLENGE` | "Biasanya Tantangannya..." |
| `TARGET` | "Cocok untuk Siapa?" |
| `DIFFERENTIATOR` | "Kenapa AYCL .... berbeda?" |
| `BENEFIT` | "Apa yang kamu dapatkan?" |
| `CLOSING` | Penutup |

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(SEC-....-....)` | `SEC-1780092850150-A00D2B` | ID unik section. |
| `batchId` | String | `NOT NULL`, 🔗 FK | - | `AYCL-1780092850103-3D7232` | Section ini milik batch yang mana. |
| `type` | Enum `AYCLSectionType` | `NOT NULL` | - | `TARGET` | Jenis section (lihat tabel makna di atas). |
| `title` | Text | `NOT NULL` | - | `Target` | Judul section. |
| `content` | Json | `NOT NULL` | - | `{"items":["sgsgsgsg","sgsdgsgsgsg"]}` | Struktur **berbeda tiap `type`** - lihat catatan di bawah. |
| `order` | Int | `NOT NULL` | - | `1` | Urutan tampil section. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `batchId` → `aycl_batches.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([batchId, order])`.

#### 📌 Catatan Penting: Struktur `content` per `type`

⚠️ Berbeda dari `mentoring_sections.content` yang formatnya **seragam**
(`{title, description}`) untuk semua tipe, di tabel ini struktur JSON-nya
**beda-beda tergantung nilai `type`** (langsung dari komentar developer
di skema):

| `type` | Struktur `content` |
|---|---|
| `PROGRAM_INFO` | `{ text: string }` |
| `CHALLENGE` | `{ items: string[] }` |
| `TARGET` | `{ items: string[] }` |
| `DIFFERENTIATOR` | `{ items: { title: string, desc: string }[] }` |
| `BENEFIT` | `{ items: string[] }` |
| `CLOSING` | `{ text: string }` |

Kode yang membaca kolom ini **wajib** cek `type` dulu sebelum parsing
`content`, karena bentuknya tidak seragam.

---

### 5.22 `aycl_materials`

**Fungsi tabel**: Daftar materi/silabus ringkas yang ditampilkan di
halaman promosi satu batch AYCL (judul + deskripsi topik) - bukan konten
belajar lengkap seperti `ELearningText`, ini lebih ke daftar topik untuk
landing page.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(MAT-...-...)` | `MAT-1780092850161-2CF585` | ID unik materi. |
| `batchId` | String | `NOT NULL`, 🔗 FK | - | `AYCL-1780092850103-3D7232` | Materi ini milik batch yang mana. |
| `title` | Text | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul materi/topik. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi singkat topik. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `batchId` → `aycl_batches.id` - `onDelete: Cascade`.

---

### 5.23 `aycl_schedules`

**Fungsi tabel**: Jadwal sesi pertemuan untuk satu batch AYCL - mirip
peran `mentoring_sessions`, plus kolom kuota peserta per jadwal.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(SCH-...-...)` | `SCH-1782473579840-58B63C` | ID unik jadwal. |
| `batchId` | String | `NOT NULL`, 🔗 FK | - | `cAYCL-1782473579819-F9CDBF` | Jadwal ini bagian dari batch yang mana. |
| `title` | Text | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul sesi. |
| `date` | **DateTime** | `NOT NULL` | - | `2026-03-16T08:00:00Z` | Tanggal sesi. |
| `startTime` | **DateTime** | `NOT NULL` | - | `2026-06-30T06:02:00.000Z` | Jam mulai. |
| `endTime` | **DateTime** | `NOT NULL` | - | `2026-06-30T07:02:00.000Z` | Jam selesai. |
| `googleMeetLink` | Text | `nullable` | - | `https://meet.google.com/abc-defg-hij` | Link Google Meet. |
| `quota` | Int | `nullable` | - | `30` | Kapasitas maksimal peserta jadwal ini. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `batchId` → `aycl_batches.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([batchId])`.

#### Relasi ke Tabel Lain

`participants` (→ `aycl_participants`).

---

### 5.24 `aycl_bookings`

**Fungsi tabel**: Transaksi booking/pendaftaran peserta untuk satu
`aycl_batches` - mirip peran `bookings` (Mentoring), tapi dilengkapi
data profiling pendaftar (institusi, semester, usia, alasan mendaftar,
dsb.) yang tampak seperti bagian dari form screening peserta.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom()` | `AYCLBook-20260627-yR44ua` | ID unik booking. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang mendaftar. |
| `batchId` | String | `NOT NULL`, 🔗 FK | - | `AYCL-1782473579819-F9CDBF` | Batch yang didaftar. |
| `referralUsageId` | String | `nullable`, `@unique`, 🔗 FK | - | `cl9fadba819445cd50ce643e` | Terisi kalau booking ini pakai kode referral (opsional 1:1). |
| `status` | String | `NOT NULL` | - | `pending` | Sesuai komentar developer di skema: nilainya `pending`, `confirmed`, `completed`, atau `cancelled`. Bukan `enum` - tetap tidak divalidasi database. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu booking dibuat. |
| `currentStatus` | Text | `nullable` | - | `Mahasiswa aktif semester 5` | Status pendaftar saat ini (freetext, mis. "Mahasiswa"/"Fresh Graduate"). |
| `institution` | Text | `nullable` | - | `Universitas Airlangga` | Nama institusi/kampus pendaftar. |
| `studyProgram` | Text | `nullable` | - | `Statistika` | Program studi pendaftar. |
| `semester` | Text | `nullable` | - | `5` | Semester pendaftar (bertipe teks, bukan angka -  supaya bisa diisi nilai non-angka seperti "Sudah Lulus"). |
| `age` | Int | `nullable` | - | `22` | Usia pendaftar. |
| `reason` | Text | `nullable` | - | `Ingin belajar analisis data untuk kerjaan.` | Alasan mendaftar (freetext panjang). |
| `familiarity` | Text | `nullable` | - | `Pernah belajar Python dasar` | Tingkat familiaritas pendaftar dengan topik program (freetext). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `batchId` → `aycl_batches.id` - `onDelete: Cascade`.
- 🔗 **FK 3**: `referralUsageId` → `referral_usages.id` (relasi
  `"ReferralUsageAYCL"`) - *(tidak ada `onDelete` eksplisit)*. Opsional
  1:1.

#### Relasi ke Tabel Lain (ringkasan)

`payment` (→ `Payment`, 1:1, sudah dibahas di 5.81), `voucherUsage` (→
`VoucherUsage`, relasi `"VoucherUsageAYCL"`, 1:1, sudah dibahas di 5.96),
`participants` (→ `aycl_participants`).

---

### 5.25 `aycl_participants`

**Fungsi tabel**: Tabel pivot yang menghubungkan satu `aycl_bookings` ke
jadwal (`aycl_schedules`) spesifik yang diikuti - karena satu booking
bisa mengikuti lebih dari satu jadwal sesi dalam batch yang sama.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cldc750497b83ca1e747b4aa` | ID unik baris partisipasi. |
| `bookingId` | String | `NOT NULL`, 🔗 FK | - | `AYCLBook-20260627-yR44ua` | Booking mana yang berpartisipasi. |
| `scheduleId` | String | `NOT NULL`, 🔗 FK | - | `SCH-1782472339769-8DC522` | Jadwal sesi yang diikuti. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `bookingId` → `aycl_bookings.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `scheduleId` → `aycl_schedules.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([bookingId, scheduleId])` - satu
  booking tidak bisa terdaftar dobel di jadwal yang sama.

---

## Modul: E-Learning

> ℹ️ **Catatan pola untuk seluruh modul ini**: Modul E-Learning punya struktur
> berlapis: `ELearningCourse` → `ELearningSubChapter` → `ELearningSubBab` →
> `ELearningText`, lalu tiap `Text` dipecah jadi `ELearningTextBlock`
> (kontainer urutan), dan tiap block berisi kombinasi **konten struktural**
> (`ELearningContentBlock` - heading/paragraph/accordion/dst, 8 tipe) dan/atau
> **konten interaktif** (`ELearningAdditionalContent` - video/kuis
> pilihan-ganda/matching/kode, 4 tipe). Dua-duanya pakai pola "polimorfik"
> Prisma yang sama: kolom `type` menyimpan tipe kontennya, lalu ada 4-8
> relasi 1:1 opsional (satu per tipe) di mana cuma **satu** yang benar-benar
> terisi untuk satu baris - kode aplikasi wajib cek `type` dulu sebelum
> mengambil relasi yang sesuai, karena Prisma/DB tidak memaksakan
> eksklusivitas ini.
>
> Penamaan tabel fisik juga tidak seragam: tabel struktur inti & tracking
> (`e_learning_courses`, `e_learning_sub_babs`, `e_learning_progress`, dst)
> pakai prefix `e_learning_`, sedangkan tabel-tabel "tipe konten" di dalam
> block (heading, paragraph, accordion, quiz, assignment, dst) pakai prefix
> `ct_e_learning_` ( "**c**ontent **t**ype") - kecuali
> `e_learning_code_runs`, yang walau termasuk keluarga "tipe konten" (log
> eksekusi kode) tetap pakai prefix `e_learning_` biasa. Pemakaian `@map`
> di level kolom juga tidak konsisten antar tabel (sebagian tabel mapping
> penuh ke snake_case, sebagian membiarkan nama kolom fisik tetap camelCase)
> - dicatat per tabel kalau relevan.

### 5.26 `e_learning_audit_logs`

**Fungsi tabel**: Log audit khusus modul E-Learning - mencatat setiap
perubahan (create/update/delete/publish/archive) yang dilakukan mentor/admin
terhadap `COURSE`, `SUB_CHAPTER`, `SUB_BAB`, atau `TEXT`, lengkap dengan
snapshot nilai lama & baru.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cldd45b4c1011e24ae1dde32` | ID unik baris log. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User (mentor/admin) yang melakukan aksi. |
| `entityType` | Enum `ELearningAuditEntityType` | `NOT NULL` | - | `COURSE` | Entitas yang diaudit: `COURSE`, `SUB_CHAPTER`, `SUB_BAB`, atau `TEXT`. |
| `entityId` | String | `NOT NULL` | - | `elearn-20260620-9df175` | ID baris entitas yang diaudit. **Bukan FK sungguhan** - lihat catatan. |
| `action` | Enum `ELearningAuditAction` | `NOT NULL` | - | `UPDATE` | `CREATE`, `UPDATE`, `DELETE`, `PUBLISH`, atau `ARCHIVE`. |
| `description` | VarChar | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi ringkas perubahan (biasanya teks dinamis, mis. "mengubah judul dari X ke Y"). |
| `oldValue` | Json | `nullable` | - | `{"title": "Judul Lama"}` | Snapshot nilai sebelum perubahan. |
| `newValue` | Json | `nullable` | - | `{"title": "Judul Baru"}` | Snapshot nilai setelah perubahan. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu aksi terjadi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([entityType, entityId])`, `@@index([userId])`, `@@index([createdAt])`.

#### 📌 Catatan

`entityId` bersifat **polimorfik** - tabel tujuannya berbeda-beda tergantung
nilai `entityType` (bisa merujuk ke `e_learning_courses`, `e_learning_sub_chapters`,
`e_learning_sub_babs`, atau `e_learning_texts`). Karena itu tidak dideklarasikan
sebagai relasi Prisma/FK sungguhan - join ke tabel yang tepat harus dilakukan
manual di kode aplikasi berdasarkan `entityType`.

---

### 5.27 `e_learning_courses`

**Fungsi tabel**: Master data satu course E-Learning (dibuat oleh mentor) -
induk tertinggi dari struktur konten belajar di modul ini.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(elearn-....-.....)` | `elearn-20251220-4df3df` | ID unik course. |
| `mentorId` | String | `NOT NULL`, 🔗 FK | - | `Mentor-000002` | Mentor pemilik course (dirandom). |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul course. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi course. |
| `thumbnailImages` | VarChar[] | `NOT NULL` | - | `["thumb1.jpg", "thumb2.jpg"]` | Array URL/path gambar thumbnail. |
| `category` | VarChar | `nullable` | - | `Data Science` | Kategori course (freetext). |
| `tags` | VarChar[] | `NOT NULL` | - | `["python", "data-science"]` | Array tag/topik course. |
| `targetAudience` | VarChar | `nullable` | - | `Mahasiswa & fresh graduate` | Target peserta yang dituju. |
| `level` | VarChar | `nullable` | - | `beginner` | Tingkat kesulitan (freetext, contoh dari komentar developer: Beginner/Intermediate/Advanced). |
| `estimatedDuration` | VarChar | `nullable` | - | `200` | Estimasi durasi belajar (freetext, mis. "4 minggu"). |
| `benefits` | Text | `nullable` | - | `Mendapat sertifikat & akses grup alumni.` | Manfaat mengikuti course. |
| `toolsUsed` | Text | `nullable` | - | `Python, Jupyter Notebook, Pandas` | Tools/software yang dipakai di course. |
| `isActive` | Boolean | `nullable` | `true` | `true` | `false` = course tidak ditampilkan/dinonaktifkan. |
| `slug` | String | `nullable`, `@unique` | - | `belajar-python-untuk-pemula` | Slug URL-friendly. Nullable + unique - boleh kosong sebelum course siap dipublikasikan. |
| `status` | Enum `CourseStatus` | `nullable` | `DRAFT` | `PUBLISHED` | `DRAFT`, `PUBLISHED`, atau `ARCHIVED`. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Waktu terakhir diupdate - manual, tidak pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `mentorId` → `mentor_profiles.id` (relasi `"MentorCourses"`) - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`subChapters` (→ `e_learning_sub_chapters`), `discussions` (→
`e_learning_discussions`), `streamCounts` (→ `e_learning_course_stream_counts`).

---

### 5.28 `e_learning_course_stream_counts`

**Fungsi tabel**: Penghitung jumlah klik "stream"/tonton course per akun -
dipakai untuk menampilkan angka "jumlah peserta" di halaman course, dengan
cap anti-spam.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld26d11e65d1e5ce36dd867` | ID unik baris. |
| `courseId` | String | `NOT NULL`, 🔗 FK | - | `elearn-20260628-c8cfc7` | Course yang di-stream. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Akun yang melakukan klik stream. |
| `streamCount` | Int | `NOT NULL` | `0` | `3` | Jumlah klik stream akun ini untuk course ini. **Di-cap MAX 10 di level service** (bukan di DB). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris pertama dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `courseId` → `e_learning_courses.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([courseId, userId])`, `@@index([courseId])`.

#### 📌 Catatan

Sesuai komentar developer di skema: begitu `streamCount` sampai 10, klik
berikutnya dari akun yang sama jadi *no-op* (tidak menambah angka lagi),
supaya satu akun tidak bisa nge-spam angka "peserta" jadi tidak wajar. Satu
baris per pasangan (course, user) - ini yang membuat cap-nya gampang
di-enforce: service meng-*upsert* ke baris yang sama, bukan bikin baris baru
tiap klik.

---

### 5.29 `e_learning_sub_chapters`

**Fungsi tabel**: Modul/bab di dalam satu course - level ini juga yang jadi
tempat menempelnya rating (`ELearningReview`) dan sertifikat kelulusan
(`ELearningCertificate`), bukan di level `ELearningCourse`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(subc-....-.....)` | `subc-20251106-ffca8483cdee` | ID unik sub-chapter. |
| `courseId` | String | `NOT NULL`, 🔗 FK | - | `elearn-20251105-dde12d` | Course induk. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul sub-chapter. |
| `coverImage` | Text | `nullable` | - | `https://cdn.temudataku.com/covers/cover-01.jpg` | Gambar sampul. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tampil dalam course. |
| `estimatedTime` | VarChar | `nullable` | - | `30` | Estimasi waktu pengerjaan (freetext). |
| `taskType` | Enum `TaskType` | `nullable` | - | `QUIZ` | `QUIZ`, `PROJECT`, atau `QUIZ_AND_PROJECT` - jenis tugas yang ada di sub-chapter ini. |
| `status` | Enum `CourseStatus` | `NOT NULL` | `DRAFT` | `PUBLISHED` | `DRAFT`, `PUBLISHED`, atau `ARCHIVED`. |
| `level` | VarChar | `nullable` | - | `advanced` | Freetext, contoh: Beginner/Intermediate/Advanced/Professional. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual, tidak `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `courseId` → `e_learning_courses.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`subBabs` (→ `e_learning_sub_babs`), `progresses` (→
`e_learning_sub_chapter_progress`), `reviews` (→ `e_learning_reviews`),
`certificates` (→ `e_learning_certificates`).

---

### 5.30 `e_learning_sub_babs`

**Fungsi tabel**: Sub-bab di dalam satu sub-chapter - unit di bawah
sub-chapter, tempat bernaungnya materi (`ELearningText`) dan juga jadi
level granularitas untuk bookmark & satu varian progress tracking
(`ELearningProgress`).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(subbab-....-...)` | `subbab-20260414-338a52089af0` | ID unik sub-bab. |
| `subChapterId` | String | `NOT NULL`, 🔗 FK | - | `subbab-20260414-338a52089af0` | Sub-chapter induk. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul sub-bab. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan tampil. Nullable, berbeda dari `orderNumber` di `e_learning_sub_chapters` yang `NOT NULL`. |
| `estimatedTime` | VarChar | `nullable` | - | `300` | Estimasi waktu (freetext). |
| `status` | Enum `CourseStatus` | `NOT NULL` | `DRAFT` | `PUBLISHED` | `DRAFT`, `PUBLISHED`, atau `ARCHIVED`. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `subChapterId` → `e_learning_sub_chapters.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`texts` (→ `e_learning_texts`), `progresses` (→ `e_learning_progress`),
`bookmarks` (→ `e_learning_bookmarks`).

---

### 5.31 `e_learning_texts`

**Fungsi tabel**: Unit materi terkecil dalam satu sub-bab. Sesuai komentar
developer di skema ("*Tabel baru untuk menyimpan teks/penjelasan materi per
SubBab*"), satu `Text` bisa berupa materi biasa (kumpulan `blocks`), ATAU
punya satu `quiz` terlampir, ATAU satu `assignment` terlampir (opsional
1:1, saling eksklusif secara konsep meski tidak dipaksakan DB).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(ETXT-...-....)` | `ETXT-1776387622489-8DA5DB` | ID unik text. |
| `subBabId` | String | `NOT NULL`, 🔗 FK | - | `subbab-20260414-338a52089af0` | Sub-bab induk. |
| `title` | VarChar | `nullable` | - | `Belajar Python untuk Pemula` | Judul unit materi. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan tampil. |
| `status` | Enum `CourseStatus` | `NOT NULL` | `DRAFT` | `PUBLISHED` | `DRAFT`, `PUBLISHED`, atau `ARCHIVED`. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | `now()` | `2026-03-16T08:00:00Z` | ⚠️ Punya default `now()` tapi **bukan** `@updatedAt` - jadi tidak otomatis ter-update saat baris diubah, harus di-set manual di kode. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `subBabId` → `e_learning_sub_babs.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([subBabId])`.

#### Relasi ke Tabel Lain (ringkasan)

`quiz` (→ `ct_e_learning_quizzes`, 1:1 opsional), `assignment` (→
`ct_e_learning_assignments`, 1:1 opsional), `blocks` (→
`e_learning_text_blocks`), `progresses` (→ `e_learning_text_progress`).

---

### 5.32 `e_learning_text_blocks`

**Fungsi tabel**: Kontainer urutan di dalam satu `Text` - tiap block bisa
membawa satu atau lebih `ContentBlock` (konten struktural) dan/atau
`AdditionalContent` (konten interaktif).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl39ef17f9e8ac9ade5ee848` | ID unik block. |
| `textId` | String | `NOT NULL`, 🔗 FK | - | `ETXT-1785934283622-71261E` | Text induk. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan block dalam text. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `textId` → `e_learning_texts.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([textId, orderNumber])`.

#### Relasi ke Tabel Lain (ringkasan)

`contentBlocks` (→ `ct_e_learning_content_blocks`), `additionalContents` (→
`ct_e_learning_additional_contents`), `progresses` (→
`e_learning_block_progress`).

---

### 5.33 `ct_e_learning_content_blocks`

**Fungsi tabel**: Tabel "router" untuk konten struktural - kolom `type`
menentukan salah satu dari 8 tabel tipe-konten (5.34-5.46) mana yang
sungguh-sungguh terisi untuk baris ini.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl06eb4372d778e78b1619c7` | ID unik content block. |
| `blockId` | String | `NOT NULL`, 🔗 FK | - | `cl1e3da5abe655460e84e5bc` | Text block induk. |
| `type` | Enum `ContentBlockType` | `NOT NULL` | - | `LOGIN` | `HEADING`, `PARAGRAPH`, `ACCORDION`, `CAROUSEL`, `CONTENT_CARD`, `TAB_NAVIGATION`, `HIGHLIGHT`, atau `SUMMARY`. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan dalam block. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `blockId` → `e_learning_text_blocks.id` - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

Delapan relasi 1:1 opsional, satu per nilai `type`: `headingContent` (→
5.34), `paragraphContent` (→ 5.35), `accordionContent` (→ 5.37),
`carouselContent` (→ 5.39), `contentCardContent` (→ 5.41), `tabContent`
(→ 5.43), `highlightContent` (→ 5.36), `summaryContent` (→ 5.45).

#### 📌 Catatan

Ini pola "polimorfik" khas Prisma: hanya **satu** dari 8 relasi di atas yang
benar-benar punya baris terkait, sesuai nilai `type`. Prisma/DB tidak
memvalidasi keselarasan ini - kalau ada bug di kode penyimpanan, bisa saja
`type = HEADING` tapi yang tersimpan justru baris di
`ct_e_learning_paragraph_contents`, tanpa DB menolaknya.

---

### 5.34 `ct_e_learning_heading_contents`

**Fungsi tabel**: Konten tipe heading/judul di dalam content block.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cla20f71bc7bca01917a058b` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl6644ea40e53fb3f54f5c9c` | Content block induk (1:1). |
| `level` | Int | `NOT NULL` | - | `2` | Level heading (mis. setara h1-h6). |
| `text` | Text | `NOT NULL` | - | `Ini adalah contoh isi teks konten.` | Teks heading. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.35 `ct_e_learning_paragraph_contents`

**Fungsi tabel**: Konten tipe paragraf teks biasa di dalam content block.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl1dc0f2ab31dcb16d69284a` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl0d0a1aeac5fd59a9358ef6` | Content block induk (1:1). |
| `text` | Text | `NOT NULL` | - | `{fstyle:paragraph:14}Secara umum, proses Supervised Learning dimulai dengan mengumpulkan data yang telah memiliki label. Data tersebut kemudian dibersihkan, diproses, dan dibagi menjadi data latih (training data) serta data uji (testing data).Model kemudian dilatih menggunakan data latih. Selama proses ini, algoritma akan terus melakukan penyesuaian parameter agar hasil prediksi semakin mendekati nilai sebenarnya.Setelah proses pelatihan selesai, model diuji menggunakan data yang belum pernah digunakan sebelumnya. Hasil pengujian ini memberikan gambaran mengenai kemampuan model dalam melakukan prediksi terhadap data baru.` | Isi paragraf. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.36 `ct_e_learning_highlight_contents`

**Fungsi tabel**: Konten tipe kotak highlight/sorotan singkat di dalam
content block.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl5789b7c83a89a2b90a0649` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl87e315d3cc22337a4ad1f9` | Content block induk (1:1). |
| `text` | VarChar(1250) | `NOT NULL` | - | `{fstyle:paragraph:16}{align:justify}💡 Machine Learning bukan solusi untuk semua permasalahan. Gunakan pendekatan ini ketika terdapat cukup data dan masalah yang ingin diselesaikan memang sulit dipecahkan menggunakan aturan biasa.{/align}` | Isi highlight. Satu-satunya konten teks di modul ini dengan **batas panjang eksplisit** (1250 karakter) - tipe konten teks lain (paragraph, dst.) pakai `Text` tanpa batas. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.37 `ct_e_learning_accordion_contents`

**Fungsi tabel**: Wadah/header konten tipe accordion (dropdown yang bisa
dibuka-tutup); item-item accordion-nya sendiri ada di tabel terpisah (5.38).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl4d220a62c3560fbfc4349a` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `clabb32d847a384a415b834b` | Content block induk (1:1). |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul accordion. |
| `description` | String | `nullable` | - | `{fstyle:paragraph:16}Rest API terdiri dari beberapa komponen *utama*` | Deskripsi accordion. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`items` (→ `ct_e_learning_accordion_items`).

---

### 5.38 `ct_e_learning_accordion_items`

**Fungsi tabel**: Satu item/panel di dalam accordion (5.37).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7ffea69c3c041e4780ca43` | ID unik. |
| `accordionId` | String | `NOT NULL`, 🔗 FK | - | `cldf79976aec0a9197eb9ab6` | Accordion induk. |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul panel. |
| `content` | String | `NOT NULL` | - | `Isi konten di sini.` | Isi panel saat dibuka. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan panel. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `accordionId` → `ct_e_learning_accordion_contents.id` - `onDelete: Cascade`.

---

### 5.39 `ct_e_learning_carousel_contents`

**Fungsi tabel**: Wadah/header konten tipe carousel (slider kartu geser);
item-itemnya ada di tabel terpisah (5.40).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld02734612a6fb54a7a60e2` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `clfbe30acee5fd34bdd7a73c` | Content block induk (1:1). |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul carousel. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi carousel. |
| `cardsPerSlide` | Int | `nullable` | - | `3` | Jumlah kartu yang tampil per slide. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`items` (→ `ct_e_learning_carousel_items`).

---

### 5.40 `ct_e_learning_carousel_items`

**Fungsi tabel**: Satu kartu/slide di dalam carousel (5.39).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cle458dd853a8497485ea119` | ID unik. |
| `carouselId` | String | `NOT NULL`, 🔗 FK | - | `cl6c880fdb82e7954d5aa29a` | Carousel induk. |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul kartu. |
| `image` | String | `nullable` | - | `https://cdn.temudataku.com/img/slide-01.jpg` | Gambar kartu. |
| `content` | String | `nullable` | - | `Isi konten di sini.` | Isi teks kartu. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan kartu. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `carouselId` → `ct_e_learning_carousel_contents.id` - `onDelete: Cascade`.

---

### 5.41 `ct_e_learning_content_card_contents`

**Fungsi tabel**: Wadah/header konten tipe kartu-konten (grid kartu dengan
opsi konten yang bisa di-expand); item-itemnya ada di tabel terpisah (5.42).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl8ab3291c292ab3cad5e87b` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl989fc282a22683e67534e6` | Content block induk (1:1). |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul grup kartu. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi grup kartu. |
| `disableExpandableContent` | Boolean | `NOT NULL` | *(tidak ada)* | `false` | Mematikan fitur expand konten kartu. **Tidak punya `@default`** - berbeda dari mayoritas kolom Boolean lain di modul ini yang selalu punya default - jadi kode penyimpanan **wajib** selalu mengirim nilai eksplisit untuk kolom ini. |
| `items` | - | - | - | `(freetext)` | *(relasi, lihat di bawah)* |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`items` (→ `ct_e_learning_content_card_items`).

---

### 5.42 `ct_e_learning_content_card_items`

**Fungsi tabel**: Satu kartu di dalam grup kartu-konten (5.41).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl2157328ff86f80f35ef313` | ID unik. |
| `cardId` | String | `NOT NULL`, 🔗 FK | - | `clbba2204d3134f864b8e14e` | Grup kartu induk. |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul kartu. |
| `content` | String | `NOT NULL` | - | `Isi konten di sini.` | Isi ringkas kartu (selalu tampil). |
| `expandableContent` | String | `nullable` | - | `Penjelasan lebih detail tentang topik ini.` | Isi tambahan yang muncul saat kartu di-expand (kalau `disableExpandableContent` di induknya `false`). |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan kartu. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `cardId` → `ct_e_learning_content_card_contents.id` - `onDelete: Cascade`.

---

### 5.43 `ct_e_learning_tab_navigation_contents`

**Fungsi tabel**: Wadah/header konten tipe navigasi tab; tab-tabnya ada di
tabel terpisah (5.44).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl9648f8a0c8d66c2fa15e1c` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cld820b695c517894b92162f` | Content block induk (1:1). |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul grup tab. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi grup tab. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`tabs` (→ `ct_e_learning_tab_items`).

---

### 5.44 `ct_e_learning_tab_items`

**Fungsi tabel**: Satu tab di dalam grup navigasi tab (5.43).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl1256c94efe4eececa0c833` | ID unik. |
| `tabId` | String | `NOT NULL`, 🔗 FK | - | `cl2989bed80b0b2b27e467ad` | Grup tab induk. |
| `title` | String | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul/label tab. |
| `content` | String | `NOT NULL` | - | `Isi konten di sini.` | Isi konten tab. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tab. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `tabId` → `ct_e_learning_tab_navigation_contents.id` - `onDelete: Cascade`.

---

### 5.45 `ct_e_learning_summary_contents`

**Fungsi tabel**: Wadah konten tipe ringkasan (biasanya di akhir materi);
poin-poin ringkasannya ada di tabel terpisah (5.46).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl48bf5ccf7092c7dd52b0ee` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl4271073ad5b0cd0dfe4c44` | Content block induk (1:1). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_e_learning_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`comments` (→ `ct_e_learning_summary_comments`).

#### 📌 Catatan

Tabel ini tidak punya kolom teks sendiri (tidak ada `title`/`description`
seperti tipe konten lain) - isinya murni daftar poin dari
`ct_e_learning_summary_comments`.

---

### 5.46 `ct_e_learning_summary_comments`

**Fungsi tabel**: Satu poin/baris ringkasan di dalam konten summary (5.45).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl2d1282c7974c9224f37eb7` | ID unik. |
| `summaryId` | String | `NOT NULL`, 🔗 FK | - | `cl214c0290dd6058eb781d8b` | Summary induk. |
| `comment` | String | `NOT NULL` | - | `Materinya jelas dan mudah dipahami!` | Isi poin ringkasan. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan poin. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `summaryId` → `ct_e_learning_summary_contents.id` - `onDelete: Cascade`.

---

### 5.47 `ct_e_learning_additional_contents`

**Fungsi tabel**: Tabel "router" untuk konten **interaktif** - pasangan dari
`ct_e_learning_content_blocks` (5.33), tapi untuk 4 tipe elemen interaktif
(video, pilihan ganda, matching, kode eksekusi) yang ditempelkan relatif
terhadap konten struktural di block yang sama.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clcdfbc0419e1181430272f4` | ID unik. |
| `blockId` | String | `NOT NULL`, 🔗 FK | - | `cl944af2f606846b1dc2fbb4` | Text block induk. |
| `type` | Enum `AdditionalContentType` | `NOT NULL` | - | `IMAGE_VIDEO` | `IMAGE_VIDEO`, `MULTIPLE_CHOICE`, `MATCHING`, atau `INTERACTIVE_CODE`. |
| `position` | Enum `AnchorPosition` | `NOT NULL` | - | `BEFORE` | `BEFORE`, `AFTER`, atau `INLINE` - posisi elemen interaktif relatif terhadap konten struktural di block yang sama. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan bila ada beberapa additional content di block yang sama. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `blockId` → `e_learning_text_blocks.id` - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

Empat relasi 1:1 opsional, satu per nilai `type`: `video` (→ 5.52),
`multipleChoice` (→ 5.50), `matching` (→ 5.48), `code` (→ 5.53).

#### 📌 Catatan

Pola polimorfik yang sama seperti `ct_e_learning_content_blocks` (5.33),
tapi khusus elemen interaktif. `position` menentukan elemen ini dirender di
mana relatif terhadap urutan konten struktural (`ContentBlock`) di dalam
`ELearningTextBlock` yang sama.

---

### 5.48 `ct_e_learning_matching_questions`

**Fungsi tabel**: Soal tipe mencocokkan (matching) sebagai salah satu jenis
konten interaktif; pasangan kiri-kanannya ada di tabel terpisah (5.49).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl4da1d0fabb45cf4a5814b7` | ID unik. |
| `additionalContentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cle3679b69e8162f69448a41` | Additional content induk (1:1). |
| `title` | String | `nullable` | - | `Belajar Python untuk Pemula` | Judul soal. |
| `instruction` | String | `nullable` | - | `Unggah file dalam format .ipynb.` | Instruksi pengerjaan. |
| `maxScore` | Float | `nullable` | `100` | `100` | Skor maksimal soal. |
| `explanation` | Text | `nullable` | - | `Karena B lebih tepat menjawab konteks soal.` | Penjelasan jawaban. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `additionalContentId` → `ct_e_learning_additional_contents.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`items` (→ `ct_e_learning_matching_items`).

---

### 5.49 `ct_e_learning_matching_items`

**Fungsi tabel**: Satu item (baik dari sisi kiri maupun kanan) di dalam
soal matching (5.48).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl242e2c5e7941156c2a67f1` | ID unik. |
| `questionId` | String | `NOT NULL`, 🔗 FK | - | `clec45bd01c64f0bf7534e33` | Soal matching induk. |
| `content` | Text | `NOT NULL` | - | `Isi konten di sini.` | Isi item. |
| `side` | Enum `MatchingItemSide` | `NOT NULL` | - | `LEFT` | `LEFT` atau `RIGHT`. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tampil dalam sisinya. |
| `matchWithId` | String | `nullable` | - | `cl321fec137c756e71cef77a` | ID item pasangannya (di sisi lain) yang benar. **Bukan FK sungguhan** - lihat catatan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `questionId` → `ct_e_learning_matching_questions.id` - `onDelete: Cascade`.

#### 📌 Catatan

`matchWithId` tidak dideklarasikan sebagai relasi/FK Prisma - cuma kolom
String biasa yang ( besar) menyimpan `id` baris lain di tabel
yang sama untuk menandai pasangan LEFT-RIGHT yang benar. Karena bukan FK
sungguhan, integritas datanya (memastikan `matchWithId` valid & konsisten
dengan `side`-nya) sepenuhnya jadi tanggung jawab kode aplikasi, tidak
dipaksakan oleh DB.

---

### 5.50 `ct_e_learning_multiple_choice_questions`

**Fungsi tabel**: Soal pilihan ganda sebagai salah satu jenis konten
interaktif; opsi-opsinya ada di tabel terpisah (5.51). Berbeda dari
`ct_e_learning_questions` (5.56) yang dipakai khusus untuk `ELearningQuiz` -
ini dipakai untuk pilihan ganda yang ditempel langsung sebagai konten
interaktif di tengah materi.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl060e35162aa83c113bb288` | ID unik. |
| `additionalContentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `clb4c72230bee65092c35725` | Additional content induk (1:1). |
| `question` | Text | `NOT NULL` | - | `Apa itu overfitting dalam machine learning?` | Teks pertanyaan. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Keterangan tambahan soal. |
| `allowMultiple` | Boolean | `NOT NULL` | `false` | `true` | `true` = boleh pilih lebih dari satu jawaban benar. |
| `explanation` | String | `nullable` | - | `Karena B lebih tepat menjawab konteks soal.` | Penjelasan jawaban. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `additionalContentId` → `ct_e_learning_additional_contents.id`, `@unique` (1:1) - `onDelete: Cascade`. **Catatan**: kolom FK ini (dan `questionId` di 5.51) tidak pakai `@map` sama sekali - beda dari kebanyakan kolom `*Id` di modul ini yang di-`@map` ke snake_case.

#### Relasi ke Tabel Lain (ringkasan)

`options` (→ `ct_e_learning_multiple_choice_options`).

---

### 5.51 `ct_e_learning_multiple_choice_options`

**Fungsi tabel**: Satu opsi jawaban di dalam soal pilihan ganda (5.50).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cleeb9c9e58165e805bd43d3` | ID unik. |
| `questionId` | String | `NOT NULL`, 🔗 FK | - | `cl9744b14285ddbd9db6fb2b` | Soal induk. |
| `content` | String | `NOT NULL` | - | `Isi konten di sini.` | Teks opsi jawaban. |
| `isCorrect` | Boolean | `NOT NULL` | `false` | `true` | `true` = opsi ini jawaban benar. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tampil opsi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `questionId` → `ct_e_learning_multiple_choice_questions.id` - `onDelete: Cascade`.

---

### 5.52 `ct_e_learning_image_video_contents`

**Fungsi tabel**: Elemen gambar atau video sebagai konten interaktif - satu
tabel menangani dua-duanya lewat kolom diskriminator `mediaType`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl911be3d6af714170a55893` | ID unik. |
| `additionalContentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl52a0892eddebee2ef4a1e0` | Additional content induk (1:1). Tidak pakai `@map`. |
| `title` | String | `nullable` | - | `Belajar Python untuk Pemula` | Judul media. |
| `caption` | String | `nullable` | - | `(freetext)` | Keterangan/caption media. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi media. |
| `mediaType` | Enum `MediaType` | `NOT NULL` | - | `IMAGE` | `IMAGE` atau `VIDEO`. |
| `url` | String | `NOT NULL` | - | `https://cdn.temudataku.com/files/materi-01.pdf` | URL/path file media. |
| `thumbnailUrl` | String | `nullable` | - | `https://cdn.temudataku.com/thumb/thumb-01.jpg` | URL thumbnail (relevan terutama untuk video). |
| `durationSeconds` | Int | `nullable` | - | `120` | Durasi video dalam detik - hanya relevan kalau `mediaType = VIDEO`. |
| `widthPercent` | Int | `nullable` | `100` | `75` | Lebar tampilan media (persen dari kontainer). |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `additionalContentId` → `ct_e_learning_additional_contents.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.53 `ct_e_learning_executable_codes`

**Fungsi tabel**: Elemen kode yang bisa dijalankan langsung (interactive
code playground) sebagai konten interaktif; riwayat tiap kali dijalankan
tersimpan di tabel terpisah (5.54).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `claf7a93180aa5db1e80639a` | ID unik. |
| `additionalContentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `clf36272cf91d9dd95b37ee6` | Additional content induk (1:1). Pakai `@map` (`additional_content_id`) - berbeda dari 5.50/5.52 yang tidak. |
| `title` | VarChar | `nullable` | - | `Belajar Python untuk Pemula` | Judul latihan kode. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Instruksi/deskripsi latihan. |
| `language` | Enum `CodeLanguage` | `NOT NULL` | - | `PYTHON` | `PYTHON`, `JAVASCRIPT`, `CPP`, `SQL`, atau `R`. |
| `initialCode` | Text | `NOT NULL` | - | `print("Hello World")` | Kode awal yang ditampilkan ke peserta. |
| `isEditable` | Boolean | `NOT NULL` | `true` | `true` | `false` = kode read-only, peserta cuma bisa run tanpa edit. |
| `expectedResult` | Text | `nullable` | - | `Hello World` | Output yang diharapkan,  dipakai untuk auto-check hasil eksekusi. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | `now()` | `2026-03-16T08:00:00Z` | Punya default `now()` tapi bukan `@updatedAt` - manual, sama seperti pola di 5.31. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `additionalContentId` → `ct_e_learning_additional_contents.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`runs` (→ `e_learning_code_runs`).

---

### 5.54 `e_learning_code_runs`

**Fungsi tabel**: Log tiap kali peserta menjalankan (run) kode di elemen
kode interaktif (5.53) - satu baris per percobaan run, tidak di-upsert/cap
seperti `e_learning_course_stream_counts`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clbc787e6f5e700818a906b9` | ID unik. |
| `executableId` | String | `NOT NULL`, 🔗 FK | - | `cl8b86e9ff27104fb7e54d16` | Elemen kode yang dijalankan. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta yang menjalankan. |
| `input` | Text | `nullable` | - | `print("hello")` | Input yang dipakai saat run (kalau ada). |
| `output` | Text | `nullable` | - | `hello` | Output hasil eksekusi. |
| `error` | Text | `nullable` | - | `SyntaxError: invalid syntax` | Pesan error kalau eksekusi gagal. |
| `executedAt` | DateTime | `nullable` | `now()` | `2026-03-16T08:05:00Z` | Waktu eksekusi. |
| `executionTime` | Int | `nullable` | - | `250` | Lama eksekusi ( dalam milidetik). |
| `isSuccess` | Boolean | `nullable` | `false` | `true` | Status berhasil/tidaknya eksekusi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `executableId` → `ct_e_learning_executable_codes.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([executableId])`, `@@index([userId])`.

---

### 5.55 `ct_e_learning_quizzes`

**Fungsi tabel**: Kuis yang menempel pada satu `ELearningText` (1:1
opsional) - berisi kumpulan soal (5.56) dan riwayat pengerjaan peserta
(5.57).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl57ab54f7619b196ee01f74` | ID unik kuis. |
| `textId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `ETXT-1787173818330-EAF6F1` | Text induk (1:1). |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul kuis. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi kuis. |
| `totalQuestions` | Int | `nullable` | - | `10` | Jumlah soal - **disimpan manual**, bukan hasil hitung otomatis dari relasi `questions`, jadi bisa tidak sinkron kalau tidak dijaga di kode aplikasi. |
| `timeLimitMinutes` | Int | `nullable` | - | `60` | Batas waktu pengerjaan (menit). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `textId` → `e_learning_texts.id`, `@unique` (1:1) - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`questions` (→ `ct_e_learning_questions`), `quizAttempts` (→
`e_learning_quiz_attempts`).

---

### 5.56 `ct_e_learning_questions`

**Fungsi tabel**: Satu soal di dalam kuis (5.55). Lebih sederhana dari
`ct_e_learning_multiple_choice_questions` (5.50) - opsi jawaban & jawaban
benar langsung disimpan sebagai array string, bukan tabel opsi terpisah.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl466e671addc4778428c3a0` | ID unik. |
| `quizId` | String | `NOT NULL`, 🔗 FK | - | `cl2fd3cfe7303ca95451f021` | Kuis induk. |
| `questionText` | Text | `NOT NULL` | - | `Manakah yang termasuk supervised learning?` | Teks pertanyaan. |
| `options` | VarChar[] | `NOT NULL` | - | `["A. Ya", "B. Tidak"]` | Array pilihan jawaban. |
| `correctAnswers` | VarChar[] | `NOT NULL` | - | `["B. Tidak"]` | Array jawaban benar - bentuk array (bukan tunggal) berarti soal multi-jawaban didukung di sini tanpa perlu flag `allowMultiple` terpisah. |
| `explanation` | String | `nullable` | - | `Karena B lebih tepat menjawab konteks soal.` | Penjelasan jawaban. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan soal dalam kuis. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `quizId` → `ct_e_learning_quizzes.id` - `onDelete: Cascade`.

---

### 5.57 `e_learning_quiz_attempts`

**Fungsi tabel**: Riwayat satu kali pengerjaan kuis oleh peserta - mendukung
retake (percobaan ulang bernomor) dan grading hybrid (auto atau manual oleh
mentor).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(attempt-....-...)` | `attempt-20260821-9e0dc2c6e48e` | ID unik. |
| `quizId` | String | `NOT NULL`, 🔗 FK | - | `clcc38205996121c6db47ad3` | Kuis yang dikerjakan. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `score` | Int | `nullable` | - | `85` | Skor hasil pengerjaan. |
| `startedAt` | DateTime | `nullable` | `now()` | `2026-03-16T08:00:00Z` | Waktu mulai mengerjakan. |
| `completedAt` | DateTime | `nullable` | - | `2026-03-16T08:20:00Z` | Waktu selesai mengerjakan. |
| `answers` | Json | `nullable` | - | `{"q1": "A", "q2": "C"}` | Jawaban peserta (format bebas, disimpan sebagai JSON). |
| `attemptNumber` | Int | `NOT NULL` | `1` | `1` | Nomor percobaan ke berapa. |
| `isAutoGraded` | Boolean | `nullable` | `true` | `true` | `false` = butuh review manual dari mentor. |
| `gradedBy` | String | `nullable` | - | `(freetext)` | Mentor/admin yang menilai manual (freetext ID, bukan FK - lihat catatan). |
| `gradedAt` | DateTime | `nullable` | - | `2026-03-21T10:00:00Z` | Waktu penilaian manual. |
| `remarks` | String | `nullable` | - | `Dinilai ulang setelah revisi diterima.` | Catatan mentor kalau ada review manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `quizId` → `ct_e_learning_quizzes.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([quizId, userId, attemptNumber])`.

---

### 5.58 `ct_e_learning_assignments`

**Fungsi tabel**: Tugas/assignment yang menempel pada satu `ELearningText`
(1:1 opsional) - punya instruksi, file pendukung, dan submission dari
peserta di tabel-tabel terpisah.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(assignment-...-...)` | `assignment-20251112-cf0a1d8ecee5` | ID unik. |
| `textId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `ETXT-1785611423090-42974C` | Text induk (1:1). |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul tugas. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi/instruksi umum tugas. |
| `dueDays` | Int | `nullable` | - | `7` | Batas waktu pengumpulan dalam hitungan hari (relatif, bukan tanggal absolut -  dihitung sejak materi diakses/dibuka). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `textId` → `e_learning_texts.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`instructions` (→ `ct_e_learning_assignment_instructions`),
`supportingFiles` (→ `ct_e_learning_assignment_supporting_files`),
`submissions` (→ `e_learning_submissions`).

---

### 5.59 `ct_e_learning_assignment_instructions`

**Fungsi tabel**: Satu baris instruksi langkah-per-langkah di dalam tugas
(5.58).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl0624e2fcead6d8fe22ecab` | ID unik. |
| `assignmentId` | String | `NOT NULL`, 🔗 FK | - | `cl10c926b12e8eddf2418132` | Tugas induk. |
| `instruction` | Text | `NOT NULL` | - | `Unggah file dalam format .ipynb.` | Isi instruksi. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan instruksi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `assignmentId` → `ct_e_learning_assignments.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([assignmentId, orderNumber])`.

---

### 5.60 `ct_e_learning_assignment_supporting_files`

**Fungsi tabel**: File pendukung (dataset, template, atau referensi) yang
disediakan mentor untuk satu tugas (5.58).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl71da4c943c1c17c0dfd75f` | ID unik. |
| `assignmentId` | String | `NOT NULL`, 🔗 FK | - | `cl49c777a046c167e35ceca4` | Tugas induk. |
| `name` | String | `NOT NULL` | - | `Setting_Up_TF_Developer_Certificate_Exam.pdf` | Nama file. |
| `type` | Enum `SupportingFileType` | `NOT NULL` | - | `LOGIN` | `DATASET`, `TEMPLATE`, atau `REFERENCE`. |
| `url` | String | `NOT NULL` | - | `https://cdn.temudataku.com/files/materi-01.pdf` | URL/path file. |
| `pageCount` | Int | `nullable` | - | `5` | Jumlah halaman -  hanya relevan kalau file berupa dokumen/PDF referensi. |
| `format` | String | `nullable` | - | `pdf` | Format file (mis. "pdf", "csv"). |
| `sizeKB` | Int | `nullable` | - | `512` | Ukuran file dalam KB. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `assignmentId` → `ct_e_learning_assignments.id` - `onDelete: Cascade`.

---

### 5.61 `e_learning_submissions`

**Fungsi tabel**: Pengumpulan tugas oleh peserta - mendukung pengumpulan
ulang bernomor (retake), review dua arah (peserta yang mengumpulkan &
mentor yang menilai), dan breakdown skor per komponen.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom()` | `elearnsub-20260821-8575ba8514c6` | ID unik. |
| `assignmentId` | String | `NOT NULL`, 🔗 FK | - | `cl4057b3a56702a1436f2883` | Tugas yang dikumpulkan. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta pengumpul. |
| `attemptNumber` | Int | `NOT NULL` | `1` | `1` | Nomor percobaan pengumpulan ke berapa. |
| `notes` | String | `nullable` | - | `Revisi bagian analisis data.` | Catatan dari peserta. |
| `files` | VarChar[] | `NOT NULL` | - | `["tugas1.pdf"]` | Array file yang dikumpulkan. |
| `submittedAt` | DateTime | `nullable` | `now()` | `2026-03-20T14:00:00Z` | Waktu dikumpulkan. |
| `status` | Enum `ELearningSubmissionStatus` | `NOT NULL` | `PENDING` | `PUBLISHED` | `PENDING`, `REVIEWED`, `REVISION_REQUIRED`, `APPROVED`, atau `REJECTED`. |
| `reviewedById` | String | `nullable`, 🔗 FK | - | `000001` | Mentor/admin yang mereview (opsional). |
| `reviewedAt` | DateTime | `nullable` | - | `2026-03-21T10:00:00Z` | Waktu direview. |
| `feedback` | String | `nullable` | - | `Progress bagus, lanjutkan konsistensi belajar.` | Feedback dari reviewer. |
| `score` | Int | `nullable` | - | `85` | Skor total. |
| `gradeBreakdown` | JsonB | `nullable` | - | `{"content":8,"structure":9,"creativity":7}` | Rincian skor per komponen. Contoh dari komentar developer: `{"content":8,"structure":9,"creativity":7}`. |
| `isRevisionRequired` | Boolean | `nullable` | `false` | `false` | Menandai submission perlu direvisi. |
| `revisionDeadline` | DateTime | `nullable` | - | `2026-03-25T23:59:59Z` | Batas waktu revisi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `assignmentId` → `ct_e_learning_assignments.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` (relasi `"ELearningSubmittedBy"`) - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 3**: `reviewedById` → `users.id` (relasi `"ELearningReviewedBy"`) - *(tidak ada `onDelete` eksplisit)*, opsional.
- **Constraint tambahan**: `@@unique([assignmentId, userId, attemptNumber])`.

#### 📌 Catatan

Tabel ini punya **dua relasi berbeda ke `users`** dengan nama relasi
eksplisit yang berbeda - `userId` (peserta yang mengumpulkan, relasi
`"ELearningSubmittedBy"`) dan `reviewedById` (mentor/admin yang menilai,
relasi `"ELearningReviewedBy"`) - jadi satu akun `users` bisa muncul di
kedua sisi, tergantung perannya di submission tertentu.

---

### 5.62 `e_learning_subscription_plans`

**Fungsi tabel**: Master data paket langganan e-learning (mis. Monthly,
Quarterly, Yearly per komentar developer).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl769635bcfb40be4ab843d3` | ID unik paket. |
| `name` | VarChar | `NOT NULL` | - | `3 Bulan` | Nama paket. Contoh dari komentar developer: Monthly, Quarterly, Yearly. |
| `durationDay` | Int | `NOT NULL` | - | `30` | Durasi paket dalam hari. Contoh dari komentar developer: 30, 90, 365. |
| `price` | Decimal | `NOT NULL` | - | `150000` | Harga paket. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi paket. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | `false` = paket tidak dijual lagi. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default sama sekali (bukan `now()`, bukan `@updatedAt`) - kosong sampai di-set manual pertama kali oleh kode aplikasi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel master/induk.

#### Relasi ke Tabel Lain (ringkasan)

`subscriptions` (→ `e_learning_subscriptions`), `redeemCodes` (→
`redeem_codes`, 5.92).

---

### 5.63 `e_learning_subscriptions`

**Fungsi tabel**: Langganan aktif seorang user terhadap satu paket - bisa
dibayar langsung, atau didapat lewat kode referral, voucher, atau redeem
code (masing-masing opsional 1:1).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(SUB-EL-.....)` | `SUB-EL-1787102158051-7036758902` | ID unik langganan. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User pelanggan. |
| `planId` | String | `NOT NULL`, 🔗 FK | - | `clb34544ac2f4650838c700a` | Paket yang dilanggan. |
| `referralUsageId` | String | `nullable`, `@unique`, 🔗 FK | - | `clbf1479b1187609be50e25f` | Terisi kalau langganan ini pakai kode referral (opsional 1:1). |
| `startAt` | DateTime | `NOT NULL` | - | `2026-04-01T00:00:00Z` | Tanggal mulai aktif. |
| `endAt` | DateTime | `NOT NULL` | - | `2026-05-01T00:00:00Z` | Tanggal berakhir. |
| `status` | String | `confirmed` | - | `PUBLISHED` | Status langganan (`confirmed`/`cancelled`/`pending`). |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `planId` → `e_learning_subscription_plans.id`.
- 🔗 **FK 3**: `referralUsageId` → `referral_usages.id` (relasi `"ReferralUsageELearningSubscription"`), opsional 1:1.

#### Relasi ke Tabel Lain (ringkasan)

`payment` (→ `payments`, 5.81, 1:1), `voucherUsage` (→ `voucher_usages`,
5.96, relasi `"VoucherUsageELearning"`, 1:1), `redeemCodeUsage` (→
`redeem_code_usages`, 5.93, relasi `"RedeemCodeUsageSubscription"`, 1:1).

---

### 5.64 `e_learning_progress`

**Fungsi tabel**: Progress belajar di level **sub-bab** (boolean
selesai/belum) - satu-satunya dari 4 tabel progress di modul ini yang
bernama tunggal ("progress", bukan "progresses"), dan yang paling minim
kolom auditnya.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cle175f3117b56afb99214d8` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `subBabId` | String | `NOT NULL`, 🔗 FK | - | `cl932e9b861f421d646c0c36` | Sub-bab yang dipelajari. |
| `isCompleted` | Boolean | `nullable` | `false` | `true` | Status selesai/belum. |
| `lastAccessed` | DateTime | `nullable` | - | `2026-03-16T07:45:00Z` | Waktu terakhir diakses. |
| `timeSpent` | Int | `nullable` | `0` | `1800` | Total waktu belajar ( detik). |
| `lastActivityAt` | DateTime | `nullable` | - | `2026-03-16T07:45:00Z` | Waktu aktivitas terakhir. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `subBabId` → `e_learning_sub_babs.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, subBabId])`.

---

### 5.65 `e_learning_sub_chapter_progress`

**Fungsi tabel**: Progress belajar di level **sub-chapter** - dinyatakan
sebagai persentase (bukan boolean), karena satu sub-chapter mengagregasi
beberapa sub-bab.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld80eeabf6ea31187ca1543` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `subChapterId` | String | `NOT NULL`, 🔗 FK | - | `subc-20260621-f4af92209f86` | Sub-chapter yang dipelajari. |
| `progressPercent` | Float | `NOT NULL` | `0` | `75` | Persentase progress, 0-100. |
| `lastActivityAt` | DateTime | `nullable` | - | `2026-03-16T07:45:00Z` | Waktu aktivitas terakhir. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `subChapterId` → `e_learning_sub_chapters.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, subChapterId])`, `@@index([userId])`, `@@index([subChapterId])`.

---

### 5.66 `e_learning_text_progress`

**Fungsi tabel**: Progress belajar di level **text** (unit materi
terkecil) - polanya sama persis dengan sub-chapter progress (5.65), cuma
beda level granularitas.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl8d82a1524581d646b86f69` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `textId` | String | `NOT NULL`, 🔗 FK | - | `ETXT-1785611423090-42974C` | Text yang dipelajari. |
| `progress` | Float | `NOT NULL` | `0` | `75` | Persentase progress, 0-100. |
| `lastAccessedAt` | DateTime | `nullable` | - | `2026-03-16T07:45:00Z` | Waktu terakhir diakses. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `textId` → `e_learning_texts.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, textId])`, `@@index([userId])`, `@@index([textId])`.

---

### 5.67 `e_learning_block_progress`

**Fungsi tabel**: Progress belajar di level **block** (unit paling
granular) - level tracking paling detail di antara 4 tabel progress modul
ini.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7b03863a4af46b9d895ade` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. Tidak pakai `@map`. |
| `blockId` | String | `NOT NULL`, 🔗 FK | - | `clc8e88fff83ab77997a9b9e` | Block yang dipelajari. Tidak pakai `@map`. |
| `progress` | Int | `NOT NULL` | `0` | `75` | Progress 0-100. **Bertipe `Int`**, berbeda dari `progressPercent`/`progress` di 5.65 & 5.66 yang bertipe `Float` - inkonsistensi tipe untuk konsep yang sama antar 3 tabel ini. |
| `isCompleted` | Boolean | `NOT NULL` | `false` | `true` | Status selesai/belum. |
| `timeSpent` | Int | `nullable` | `0` | `1800` | Total waktu ( detik). |
| `lastActivityAt` | DateTime | `nullable` | `now()` | `2026-03-16T07:45:00Z` | Waktu aktivitas terakhir - satu-satunya di antara 4 tabel progress yang kolom "waktu terakhir"-nya punya default `now()`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `blockId` → `e_learning_text_blocks.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, blockId])`, `@@index([blockId])` (tidak ada index terpisah untuk `userId`, berbeda dari 5.65/5.66 yang mengindeks kedua sisi).

---

### 5.68 `e_learning_reviews`

**Fungsi tabel**: Rating & ulasan peserta terhadap satu sub-chapter -
sesuai `@@unique([userId, subChapterId])`, rating hanya ada di level
sub-chapter, tidak ada kolom rating agregat langsung di `ELearningCourse`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl14ac5bc8364d6d06c8498f` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta pemberi ulasan. |
| `subChapterId` | String | `NOT NULL`, 🔗 FK | - | `subc-20260620-35d072eb5e70` | Sub-chapter yang diulas. |
| `rating` | Decimal(2,1) | `NOT NULL` | - | `4` | Nilai rating. |
| `comment` | String | `nullable` | - | `Materinya jelas dan mudah dipahami!` | Isi ulasan. |
| `isPublic` | Boolean | `NOT NULL` | `true` | `true` | `false` = ulasan disembunyikan dari tampilan publik. |
| `isAnonymous` | Boolean | `NOT NULL` | `false` | `false` | `true` = nama peserta disembunyikan di tampilan (lihat catatan). |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. Tidak ada `updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `subChapterId` → `e_learning_sub_chapters.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, subChapterId])` - satu peserta cuma bisa memberi satu ulasan per sub-chapter.

#### 📌 Catatan

`isAnonymous` cuma flag tampilan - `userId` tetap `NOT NULL` dan tersimpan
apa adanya, jadi identitas pemberi ulasan tetap ada di database walau
`true`; anonimitasnya harus diterapkan di layer tampilan (frontend/API),
bukan lewat penyembunyian data di DB.

---

### 5.69 `e_learning_certificates`

**Fungsi tabel**: Sertifikat kelulusan peserta untuk satu sub-chapter - pola
`@@unique([userId, subChapterId])`-nya sama seperti review (5.68), jadi
sertifikat juga diterbitkan per sub-chapter, bukan per course.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld9a098ea37b4678915855e` | ID unik. |
| `subChapterId` | String | `NOT NULL`, 🔗 FK | - | `cl6b8cf0dbbea87b68780ff4` | Sub-chapter yang diselesaikan. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta pemegang sertifikat. |
| `certificateUrl` | VarChar | `NOT NULL` | - | `https://drive.google.com/file/d/1U7hzrDiKwNuVzr4YDc/view?usp=drivesdk` | URL file sertifikat. |
| `certificatePath` | VarChar | `nullable` | - | `/certs/cert-001.pdf` | Path penyimpanan file sertifikat. |
| `issuedAt` | DateTime | `nullable` | `now()` | `2026-08-21T07:31:43.225Z` | Waktu diterbitkan. |
| `certificateNumber` | VarChar | `NOT NULL`, `@unique` | - | `ELCERT-1787297496310-E2NB` | Nomor sertifikat unik. |
| `displayNumber` | VarChar | `NOT NULL`, `@unique` | - | `01/TELFHXM/TemuDataku` | Nomor tampilan unik -  format berbeda dari `certificateNumber` untuk keperluan cetak/tampilan publik (perlu dicek ke kode generator sertifikat untuk kepastian mana yang internal vs mana yang dicetak). |
| `status` | VarChar | `nullable` | - | `generated` | Freetext, contoh dari komentar developer: generated, sent, viewed. |
| `verifiedBy` | VarChar | `nullable` | - | `(freetext)` | ID admin/verifikator (opsional, freetext). **Bukan FK sungguhan** - lihat catatan. |
| `note` | VarChar | `nullable` | - | `Sertifikat dikirim ulang atas permintaan user.` | Catatan tambahan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `subChapterId` → `e_learning_sub_chapters.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, subChapterId])`.

---

### 5.70 `e_learning_discussions` (masih belum dipakai)

**Fungsi tabel**: Forum diskusi/tanya-jawab di level course - mendukung
reply berjenjang lewat self-relation `parentId`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld46ed628baab230da6526c` | ID unik. |
| `courseId` | String | `NOT NULL`, 🔗 FK | - | `cl4330a98b6a15221402c3b0` | Course tempat diskusi berlangsung. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User penulis. |
| `content` | Text | `NOT NULL` | - | `Isi konten di sini.` | Isi diskusi/komentar. |
| `parentId` | String | `nullable`, 🔗 FK | - | `clcdf619cfece2e8aaefa75b` | Diisi kalau baris ini adalah **balasan** (reply) ke diskusi lain (self-relation, relasi `"ReplyTo"`). |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. Tidak ada `updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `courseId` → `e_learning_courses.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 3**: `parentId` → `e_learning_discussions.id` (self-relation `"ReplyTo"`), opsional - *(tidak ada `onDelete` eksplisit)*.

---

### 5.71 `e_learning_bookmarks` (masih belum dipakai)

**Fungsi tabel**: Penanda bookmark peserta terhadap satu sub-bab - berupa
toggle (ada/tidak ada baris), bukan daftar bookmark berulang.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cle50584157d3cc96e2ba64b` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `subBabId` | String | `NOT NULL`, 🔗 FK | - | `cl5951667027fe06b5bffc25` | Sub-bab yang di-bookmark. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu bookmark dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `subBabId` → `e_learning_sub_babs.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([userId, subBabId])` - satu peserta cuma bisa punya satu baris bookmark per sub-bab (toggle, bukan daftar berulang).

---

## Modul: Practice

> ℹ️ **Catatan pola untuk seluruh modul ini**: Practice adalah modul latihan
> mandiri terpisah dari E-Learning - mentor membuat satu `Practice` (paket
> latihan berbayar) berisi beberapa `PracticeMaterial` (dengan file
> pendukungnya di `PracticeFile`), peserta membeli lewat `PracticePurchase`,
> mengerjakan lalu mengumpulkan lewat `PracticeSubmission`, progress
> belajarnya dilacak per-materi lewat `PracticeProgress`, dan bisa memberi
> ulasan lewat `PracticeReview`.
>
> Ikut dibahas juga di sini `Project` & `ProjectSubmission` - **bukan**
> anak dari `Practice`, melainkan fitur proyek/tugas akhir yang menempel ke
> `MentoringService` (modul Mentoring, 5.6), jadi konteksnya sesi mentoring
> berbayar, bukan latihan mandiri. Keduanya dikelompokkan bareng "Practice"
> di ringkasan relasi tabel `users` (5.1) karena sama-sama fitur submission
> tugas dengan skema penilaian mirip, tapi secara struktur data keduanya
> independen dari `Practice`.
>
> Tiga model di modul ini (`PracticeFile`, `PracticePurchase`, `Practice`)
> punya komentar generator Prisma: *"This model or at least one of its
> fields has comments in the database..."* - artinya ada `COMMENT ON
> TABLE/COLUMN` yang di-set langsung di database (lewat migration manual
> atau tool lain), tidak lewat atribut Prisma biasa. Isi komentar DB-nya
> sendiri tidak tercermin di file `schema.prisma`, jadi kalau butuh
> membaca komentarnya, perlu query langsung ke database
> (`information_schema` / `pg_catalog`) atau baca file migration SQL-nya.

### 5.72 `practice_files`

**Fungsi tabel**: File pendukung (materi belajar) yang di-upload mentor
untuk satu `PracticeMaterial`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl5f6b4b28a6c3e038a211f9` | ID unik file. |
| `materialId` | String | `NOT NULL`, 🔗 FK | - | `cl02e12da068f2ec2871a2b4` | Materi induk. |
| `fileName` | VarChar | `NOT NULL` | - | `modul-01.pdf` | Nama file. |
| `filePath` | VarChar | `NOT NULL` | - | `/uploads/materi/modul-01.pdf` | Path/URL penyimpanan file. |
| `fileType` | VarChar | `NOT NULL` | - | `pdf` | Tipe/ekstensi file. |
| `fileSize` | Int | `nullable` | - | `3` | Ukuran file. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tampil file dalam materi. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu diunggah. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual, tidak `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `materialId` → `practice_materials.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### 📌 Catatan

Punya komentar generator Prisma soal database comments - lihat catatan pola
modul di atas.

---

### 5.73 `practice_materials`

**Fungsi tabel**: Satu unit materi/modul di dalam sebuah `Practice` -
tempat menempelnya file pendukung (5.72) dan tracking progress (5.74).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cla52f1eafa63828c6a7eb79` | ID unik materi. |
| `practiceId` | String | `NOT NULL`, 🔗 FK | - | `cl6f0f62414d2210e49b2355` | Practice induk. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul materi. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi materi. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan tampil materi. |
| `status` | String | `nullable` | - | `PUBLISHED` | Freetext, sesuai komentar developer: `draft`, `active`, `inactive`. |
| `startDate` | DateTime | `nullable` | - | `2026-04-01` | Tanggal mulai materi ini aktif (sesuai komentar developer). |
| `endDate` | DateTime | `nullable` | - | `2026-05-01` | Tanggal selesai materi ini aktif. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `practiceId` → `practices.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`practiceFiles` (→ `practice_files`), `practiceProgress` (→
`practice_progress`).

#### 📌 Catatan

`status` di sini freetext dengan 3 nilai (draft/active/inactive) - beda
konsep dari `status` enum `CourseStatus` (DRAFT/PUBLISHED/ARCHIVED) di
modul E-Learning; `startDate`/`endDate` menambahkan kemampuan
menjadwalkan aktif-nonaktifnya materi secara otomatis berdasarkan tanggal,
sesuatu yang tidak ada padanannya langsung di struktur materi E-Learning.

---

### 5.74 `practice_progress`

**Fungsi tabel**: Progress belajar peserta per `PracticeMaterial`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl509ab6b587151f794bc241` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta. |
| `materialId` | String | `NOT NULL`, 🔗 FK | - | `cl6c90758b4e7c4f2a65ed1a` | Materi yang dipelajari. |
| `isCompleted` | Boolean | `nullable` | `false` | `true` | Status selesai/belum. |
| `lastAccessed` | Timestamp(6) | `nullable` | - | `2026-03-16T07:45:00Z` | Waktu terakhir diakses. |
| `timeSpentSeconds` | Int | `nullable` | `0` | `1800` | Total waktu belajar dalam detik (satuannya eksplisit di nama kolom - beda dari `timeSpent` di modul E-Learning yang satuannya cuma diasumsikan dari konteks). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `materialId` → `practice_materials.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([userId, materialId])`.

---

### 5.75 `practice_purchases`

**Fungsi tabel**: Transaksi pembelian satu `Practice` oleh peserta - mirip
peran `e_learning_subscriptions` tapi untuk pembelian sekali-bayar (bukan
langganan berkala).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl4d3910d4376a411c84aa2b` | ID unik pembelian. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Pembeli. Tidak pakai `@map`. |
| `practiceId` | String | `NOT NULL`, 🔗 FK | - | `cl53bfc1368605b8f6018027` | Practice yang dibeli. Tidak pakai `@map`. |
| `referralUsageId` | String | `nullable`, `@unique`, 🔗 FK | - | `clcf5f6ae7450267a3f82153` | Terisi kalau pembelian ini pakai kode referral (opsional 1:1). Tidak pakai `@map`. |
| `purchaseDate` | DateTime | `nullable` | `now()` | `2026-03-15T10:35:00Z` | Tanggal pembelian. |
| `status` | VarChar | `nullable` | - | `PUBLISHED` | Status transaksi (freetext, tidak divalidasi enum). |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default sama sekali. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 2**: `practiceId` → `practices.id` - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 3**: `referralUsageId` → `referral_usages.id` (relasi `"ReferralUsagePracticePurchase"`), opsional 1:1 - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`payment` (→ `payments`, 5.81, relasi `"PracticePurchasePayment"`, 1:1),
`voucherUsage` (→ `voucher_usages`, 5.96, relasi `"VoucherUsagePractice"`,
1:1).

#### 📌 Catatan

Punya komentar generator Prisma soal database comments (lihat catatan pola
modul). Berbeda dari `e_learning_subscriptions` (yang relasi
`referralUsage`-nya tanpa `onDelete` eksplisit), relasi `referralUsage` di
sini justru punya `onDelete: Cascade, onUpdate: Cascade` eksplisit -
perilaku berbeda untuk konsep "pemakaian kode referral" yang serupa antar
dua modul.

---

### 5.76 `practice_reviews`

**Fungsi tabel**: Rating & ulasan peserta terhadap satu `Practice` -
polanya mirip `e_learning_reviews`, tapi `rating` di sini bertipe `Int`
(bukan `Decimal`) dan tanpa flag `isPublic`/`isAnonymous`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cla84767376f0cc884a4e580` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta pemberi ulasan. |
| `practiceId` | String | `NOT NULL`, 🔗 FK | - | `cle71d85ff78c53e61236021` | Practice yang diulas. |
| `rating` | Int | `NOT NULL` | - | `3` | Nilai rating (bilangan bulat, beda dari `Decimal(2,1)` di `e_learning_reviews`). |
| `comment` | String | `nullable` | - | `Materinya jelas dan mudah dipahami!` | Isi ulasan. |
| `submittedDate` | Timestamp(6) | `nullable` | `now()` | `2026-03-20T14:00:00Z` | Tanggal ulasan dikirim. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `practiceId` → `practices.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([userId, practiceId])` - satu peserta cuma bisa memberi satu ulasan per practice.

#### 📌 Catatan

Tabel ini punya `submittedDate` **dan** `createdAt` yang sama-sama default
`now()` -  redundan (dua kolom mencatat waktu yang praktis
sama), berbeda dari `e_learning_reviews` yang cuma punya `createdAt` saja.

---

### 5.77 `practice_submissions`

**Fungsi tabel**: Pengumpulan hasil pengerjaan `Practice` oleh peserta,
lengkap dengan penilaian & feedback dari mentor.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld081be8a945384c36b1238` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Peserta pengumpul. |
| `practiceId` | String | `NOT NULL`, 🔗 FK | - | `cl8ae65249c152eaae7281c4` | Practice yang dikerjakan. |
| `notes` | String | `nullable` | - | `Revisi bagian analisis data.` | Catatan dari peserta. |
| `files` | VarChar[] | `NOT NULL` | - | `["tugas1.pdf"]` | Array file yang dikumpulkan. |
| `submittedAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-20T14:00:00Z` | Waktu dikumpulkan. |
| `status` | String | `nullable` | `"pending"` | `PUBLISHED` | Freetext (bukan enum), sesuai komentar developer: `pending`, `reviewed`, `approved`, `rejected`. |
| `reviewedById` | String | `nullable`, 🔗 FK | - | `cl4958fc8795d05004681803` | Mentor/admin yang mereview (opsional). |
| `reviewedAt` | Timestamp(6) | `nullable` | - | `2026-03-21T10:00:00Z` | Waktu direview. |
| `kesesuaian` | VarChar | `nullable` | - | `Baik` | Nilai komponen "kesesuaian" dari mentor. |
| `kualitas` | VarChar | `nullable` | - | `Cukup` | Nilai komponen "kualitas". |
| `kreativitas` | VarChar | `nullable` | - | `Baik` | Nilai komponen "kreativitas". |
| `kelengkapan` | VarChar | `nullable` | - | `Sangat Baik` | Nilai komponen "kelengkapan". |
| `komentar` | Text | `nullable` | - | `Analisis sudah cukup baik.` | Komentar mentor. |
| `saran` | Text | `nullable` | - | `Perbaiki visualisasi di bagian akhir.` | Saran/masukan mentor. |
| `perluRevisi` | Boolean | `nullable` | `false` | `false` | Menandai submission perlu direvisi. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `user` → `users.id` (relasi `"PracticeSubmittedBy"`) - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `practiceId` → `practices.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 3**: `reviewedById` → `users.id` (relasi `"PracticeReviewedBy"`), opsional - *(tidak ada `onDelete` eksplisit)*.
- **Constraint tambahan**: `@@unique([userId, practiceId])` - **peserta cuma bisa submit sekali per practice**, tidak ada `attemptNumber` seperti di `e_learning_submissions`/`e_learning_quiz_attempts`, jadi tidak ada mekanisme submit ulang bertahap di level skema.

#### 📌 Catatan

Empat kolom penilaian (`kesesuaian`, `kualitas`, `kreativitas`,
`kelengkapan`) dan dua kolom feedback (`komentar`, `saran`) memakai nama
**Bahasa Indonesia**, berbeda dari konvensi penamaan Inggris di hampir
semua tabel lain di skema ini. Semua nilai komponen penilaian juga bertipe
`VarChar` (bukan `Int`/`Decimal`), jadi  diisi label kualitatif
(mis. "Baik", "Cukup") bukan angka - berbeda dari `gradeBreakdown` (Json)
di `e_learning_submissions` yang menyimpan skor numerik per komponen.
`status` di sini tetap `String` biasa dengan default `"pending"`, tidak
diubah jadi enum seperti `ELearningSubmissionStatus` di modul E-Learning,
walau nilai yang mungkin (pending/reviewed/approved/rejected) sama persis
disebutkan di komentar developer.

---

### 5.78 `practices`

**Fungsi tabel**: Master data satu paket latihan mandiri (Practice) yang
dibuat mentor - induk dari seluruh tabel Practice lainnya.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cldaab61f8e4d59948b64eb2` | ID unik practice. |
| `mentorId` | String | `NOT NULL`, 🔗 FK | - | `cl4a741cb68f1ed7f4d4f421` | Mentor pembuat. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul practice. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi practice. |
| `thumbnailImages` | VarChar[] | `NOT NULL` | - | `["thumb1.jpg", "thumb2.jpg"]` | Array gambar thumbnail. Di-`@map` ke `thumbnail_image` (**tunggal**) walau kolomnya array/jamak - beda dari `e_learning_courses.thumbnailImages` yang di-`@map` ke `thumbnail_images` (jamak, konsisten). |
| `price` | Decimal | `NOT NULL` | - | `150000` | Harga practice. |
| `practiceType` | VarChar | `nullable` | - | `(freetext)` | Jenis practice (freetext). |
| `category` | VarChar | `nullable` | - | `Data Science` | Kategori (freetext). |
| `tags` | VarChar[] | `NOT NULL` | - | `["python", "data-science"]` | Array tag. |
| `benefits` | VarChar | `nullable` | - | `Mendapat sertifikat & akses grup alumni.` | Manfaat mengikuti practice. |
| `toolsUsed` | VarChar | `nullable` | - | `Python, Jupyter Notebook, Pandas` | Tools/software yang dipakai. |
| `challenges` | VarChar | `nullable` | - | `Membersihkan dataset yang berantakan.` | Tantangan yang akan dihadapi peserta. |
| `expectedOutcomes` | VarChar | `nullable` | - | `Mampu membuat visualisasi data end-to-end.` | Hasil yang diharapkan setelah selesai. |
| `estimatedDuration` | VarChar | `nullable` | - | `4 minggu` | Estimasi durasi (freetext). |
| `targetAudience` | VarChar | `nullable` | - | `Mahasiswa & fresh graduate` | Target peserta. |
| `isActive` | Boolean | `nullable` | `true` | `true` | `false` = practice tidak ditampilkan. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `mentorId` → `mentor_profiles.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`practiceMaterials` (→ `practice_materials`), `practicePurchases` (→
`practice_purchases`), `practiceReviews` (→ `practice_reviews`),
`practiceSubmissions` (→ `practice_submissions`).

#### 📌 Catatan

Punya komentar generator Prisma soal database comments (lihat catatan pola
modul). Dibanding `e_learning_courses` (5.27), `practices` punya beberapa
kolom deskriptif tambahan yang tidak ada padanannya di E-Learning
(`challenges`, `expectedOutcomes`) - masuk akal karena Practice berorientasi
proyek/latihan praktik, bukan materi belajar bertahap. Tidak ada kolom
`slug` maupun `status` (DRAFT/PUBLISHED/ARCHIVED) di sini seperti di
`e_learning_courses` - kontrol tampil/tidaknya cuma lewat `isActive`.

---

### 5.79 `projects`

**Fungsi tabel**: Proyek/tugas yang menempel pada satu `MentoringService`
(5.6, modul Mentoring) - **bukan** bagian dari `Practice`, walau
dikelompokkan bareng di ringkasan relasi `users`. Submission-nya ada di
tabel terpisah (5.80).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl339b6f210ad4c3504ddb4f` | ID unik proyek. |
| `serviceId` | String | `NOT NULL`, 🔗 FK | - | `cl7d09af19e3c76a9ea3760d` | Mentoring service induk. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul proyek. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi/instruksi proyek. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `serviceId` → `mentoring_services.id` - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`submissions` (→ `project_submissions`).

---

### 5.80 `project_submissions`

**Fungsi tabel**: Pengumpulan tugas proyek oleh mentee untuk satu
`Project` (5.79) - skema penilaiannya paling lengkap di antara semua tabel
submission di skema ini (skor otomatis/plagiarisme, skor per-metrik, status
review pakai enum, tautan ke sesi mentoring tertentu).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cla7299cf96ca329531322ac` | ID unik. |
| `projectId` | String | `NOT NULL`, 🔗 FK | - | `cl70bf517b6239981d274a0d` | Proyek yang dikumpulkan. |
| `menteeId` | String | `NOT NULL`, 🔗 FK | - | `000016` | Mentee pengumpul. |
| `sessionId` | String | `nullable`, 🔗 FK | - | `cl598f3fad2b11260e8b6fe9` | Sesi mentoring terkait (opsional). |
| `title` | VarChar | `nullable` | - | `Belajar Python untuk Pemula` | Judul submission dari mentee. |
| `filePaths` | String[] | `NOT NULL` | - | `["tugas1.pdf"]` | Array path file submission. |
| `projectLink` | VarChar | `nullable` | - | `(freetext)` | Link tambahan (Drive, GitHub, dll - sesuai komentar developer). |
| `submissionDate` | Timestamp(6) | `nullable` | `now()` | `2026-03-20T14:00:00Z` | Waktu dikumpulkan. |
| `plagiarismScore` | Decimal | `nullable` | - | `4.5` | Skor plagiarisme dari sistem otomatis. |
| `score` | Decimal | `nullable` | - | `85` | Skor agregat dari seluruh penilaian (sesuai komentar developer). |
| `briefScore` | String | `nullable` | - | `Baik` | Skor kesesuaian brief (freetext/label, bukan angka). |
| `technicalScore` | String | `nullable` | - | `Cukup` | Skor kualitas teknis. |
| `creativityScore` | String | `nullable` | - | `Baik` | Skor kreativitas. |
| `completenessScore` | String | `nullable` | - | `Baik` | Skor kelengkapan. |
| `mentorFeedback` | VarChar | `nullable` | - | `Kerjakan revisi bagian ke-2.` | Feedback singkat dari mentor. |
| `mentorSuggestion` | VarChar | `nullable` | - | `Tambahkan studi kasus nyata.` | Saran dari mentor. |
| `isReviewed` | Boolean | `nullable` | `false` | `false` | Status sudah/belum direview. |
| `reviewStatus` | Enum `ReviewStatus` | `NOT NULL` | `PENDING` | `REVIEWED` | `PENDING`, `REVIEWED`, atau `REVISION_REQUIRED`. |
| `isRevisedRequired` | Boolean | `nullable` | `false` | `false` | Menandai submission perlu direvisi. |
| `revisionDeadline` | DateTime | `nullable` | - | `2026-03-25T23:59:59Z` | Batas waktu revisi. |
| `gradedBy` | String | `nullable`, 🔗 FK | - | `(freetext)` | Mentor yang menilai (opsional). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `projectId` → `projects.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `menteeId` → `users.id` (relasi `"SubmissionByMentee"`) - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 3**: `sessionId` → `mentoring_sessions.id`, opsional - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 4**: `gradedBy` → `users.id` (relasi `"SubmissionGradedByMentor"`), opsional - `onDelete: Cascade`, `onUpdate: Cascade`.

#### 📌 Catatan

Tabel submission paling detail di seluruh skema: skor dipisah jadi 3
lapis - `plagiarismScore` (otomatis/sistem), 4 kolom skor per-metrik
(`briefScore`/`technicalScore`/`creativityScore`/`completenessScore`, semua
`String` -  label kualitatif, bukan angka, sama seperti pola di
`practice_submissions`), dan `score` (agregat, `Decimal`) - tapi tidak ada
kolom di skema yang menjelaskan bagaimana `score` dihitung dari
komponen-komponennya, jadi logikanya murni ada di kode aplikasi. Tidak
seperti `practice_submissions` yang pakai `@@unique([userId, practiceId])`
(submit sekali per practice), tabel ini **tidak punya unique constraint**
sama sekali pada `(projectId, menteeId)` - artinya satu mentee bisa
mengumpulkan submission berkali-kali untuk proyek yang sama tanpa dibatasi
skema, tanpa mekanisme penomoran `attemptNumber` seperti di
`e_learning_submissions`. `reviewStatus` juga satu-satunya di antara 3
tabel submission serupa (`practice_submissions`,
`e_learning_submissions`, tabel ini) yang memakai **enum sungguhan**
(`ReviewStatus`) alih-alih `String` freetext - tapi enum-nya cuma 3 nilai
(tidak ada `APPROVED`/`REJECTED` seperti `ELearningSubmissionStatus`),
jadi status "disetujui/ditolak akhir"  direpresentasikan lewat
kombinasi `reviewStatus` + `score`, bukan satu kolom status tunggal.

---

## Modul: Payment & Withdrawal

> ℹ️ **Catatan**: Bagian **Withdrawal**-nya sendiri ternyata menempel ke
> sistem afiliator, bukan tabel umum terpisah - didokumentasikan di 5.90
> `commission_payments` dan 5.91 `withdrawal_methods` bersama modul
> Affiliator & Referral, bukan di sini.
>
> `BookingParticipant` (`booking_participants`) sebenarnya juga bagian dari
> alur pembayaran, tapi sudah didokumentasikan lebih dulu di modul
> Mentoring & Booking (5.16) karena strukturnya menempel langsung ke
> `Booking`. `PracticePurchase` (5.75), `ELearningSubscription` (5.63), dan
> `AYCLBooking` (5.24) juga direferensikan dari `Payment` di bawah -
> ketiganya **sudah** didokumentasikan lengkap di modul masing-masing,
> jadi tidak diulang di sini.

### 5.81 `payments`

**Fungsi tabel**: Satu transaksi pembayaran - tabel pembayaran sentral yang
dipakai oleh **empat** sumber transaksi berbeda: cicilan booking mentoring,
pembelian practice, langganan e-learning, dan booking AYCL.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom()` | `PAY-AYCL-20260530-8248560878` | ID unik pembayaran. |
| `bookingInvoiceId` | String | `nullable`, 🔗 FK | - | `cl0c1cfc95904e3bb7b6a354` | Invoice booking mentoring terkait (**bukan** `@unique` - satu invoice bisa punya banyak `Payment`, satu per cicilan). |
| `practicePurchaseId` | String | `nullable`, `@unique`, 🔗 FK | - | `Purchase-......` | Pembelian practice terkait (1:1). |
| `eLearningSubscriptionId` | String | `nullable`, `@unique`, 🔗 FK | - | `SUB-EL-.......` | Langganan e-learning terkait (1:1). |
| `ayclBookingId` | String | `nullable`, `@unique`, 🔗 FK | - | `AYCLBook-.....` | Booking AYCL terkait (1:1). |
| `merchantOrderId` | String | `nullable`, `@unique` | - | `INV-PAY-AYCL-20260717-7323830662-1784272562463` | Order ID dari payment gateway/merchant pihak ketiga. |
| `amount` | Decimal | `NOT NULL` | - | `250000` | Nominal pembayaran. |
| `installmentNumber` | Int | `nullable` | - | `1` | Nomor cicilan ke berapa - **hanya dipakai kalau `bookingInvoiceId` terisi** (sesuai komentar developer). |
| `dueDate` | DateTime | `nullable` | - | `2026-09-17T07:31:16.126Z` | Batas waktu pembayaran (relevan untuk cicilan). |
| `reminderCount` | Int | `NOT NULL` | `0` | `2` | Jumlah reminder yang sudah dikirim ke pembayar. |
| `lastReminderSentAt` | DateTime | `nullable` | - | `2026-03-18T09:00:00Z` | Waktu reminder terakhir dikirim. |
| `paymentDate` | Timestamp(6) | `nullable` | - | `2026-03-15T10:35:00Z` | Tanggal pembayaran benar-benar diterima/lunas. |
| `paymentMethod` | VarChar | `nullable` | - | `BR` | Metode pembayaran (freetext, mis. nama channel/bank sesuai type dari payment gateway Duitku). |
| `transactionId` | VarChar | `nullable` | - | `DS2857926HNLTS3P23DP8OR5` | ID transaksi dari payment gateway. |
| `status` | VarChar | `nullable` | - | `PENDING` | Status pembayaran (freetext, pending, confirmed, completed). |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual, tidak `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `bookingInvoiceId` → `booking_invoices.id` - `onDelete: Cascade`, `onUpdate: Cascade`. *(non-unique - lihat catatan.)*
- 🔗 **FK 2**: `practicePurchaseId` → `practice_purchases.id` (relasi `"PracticePurchasePayment"`), `@unique` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 3**: `eLearningSubscriptionId` → `e_learning_subscriptions.id`, `@unique` - `onDelete: Cascade`.
- 🔗 **FK 4**: `ayclBookingId` → `aycl_bookings.id`, `@unique` - *(tidak ada `onDelete` eksplisit)*.
- **Index tambahan**: `@@index([bookingInvoiceId])`.

#### Relasi ke Tabel Lain (ringkasan)

`bookingParticipants` (→ `booking_participants`, relasi
`"ParticipantPayment"`, **1:many** - satu `Payment` bisa dipakai untuk
menandai status lunas beberapa peserta booking grup sekaligus, lihat 5.16).

#### 📌 Catatan

`payments` adalah tabel pembayaran "hub" untuk 4 jalur transaksi berbeda,
dan pola keterhubungannya **tidak seragam**:

- Untuk **booking mentoring** (cicilan): `bookingInvoiceId` **bukan**
  `@unique`, jadi satu `BookingInvoice` bisa punya *banyak* baris
  `Payment` - satu per cicilan (`installmentNumber` membedakan urutannya).
  Ini satu-satunya dari 4 sumber yang berupa relasi 1:many, bukan 1:1.
- Untuk **practice, e-learning, AYCL**: ketiga kolom FK-nya
  (`practicePurchaseId`, `eLearningSubscriptionId`, `ayclBookingId`)
  semuanya `@unique`, jadi masing-masing hanya bisa punya *satu*
  `Payment` (transaksi sekali-bayar, bukan cicilan).

Kolom `installmentNumber`, `dueDate`, `reminderCount`, dan
`lastReminderSentAt` (menurut komentar developer) **cuma relevan untuk
jalur booking cicilan** - kosong/tidak dipakai untuk 3 jalur pembayaran
lainnya. Tidak ada `CHECK constraint` di level Prisma yang memastikan tepat
satu dari keempat kolom FK ini terisi per baris - kode aplikasi yang wajib
menjaga eksklusivitasnya.

---

### 5.82 `booking_invoices`

**Fungsi tabel**: Invoice/tagihan untuk satu `Booking` mentoring - mendukung
pembayaran penuh (`FULL`) atau cicilan (`INSTALLMENT`), dengan tracking
progres pelunasan lewat `paidAmount`/`remainingAmount`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl4e93991da027fc02f10e2a` | ID unik invoice. |
| `bookingId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `Booking-bootcamp-6907575958` | Booking terkait (1:1). |
| `totalAmount` | Decimal | `NOT NULL` | - | `500000` | Total tagihan. |
| `paidAmount` | Decimal | `NOT NULL` | `0` | `250000` | Jumlah yang sudah dibayar ( diakumulasi dari `payments` yang statusnya lunas). |
| `remainingAmount` | Decimal | `NOT NULL` | - | `250000` | Sisa yang belum dibayar. |
| `paymentType` | VarChar | `NOT NULL` | - | `FULL` | Freetext, sesuai komentar developer: `FULL` atau `INSTALLMENT`. |
| `installmentCount` | Int | `nullable` | - | `3` | Jumlah cicilan yang disepakati (relevan kalau `paymentType = INSTALLMENT`). |
| `status` | VarChar | `NOT NULL` | - | `PUBLISHED` | Freetext, sesuai komentar developer: `PAID_DONE`, `PARTIALLY_PAID`, atau `HAVENT_PAID`. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default sama sekali. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `bookingId` → `bookings.id`, `@unique` (1:1) - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`payments` (→ `payments`, **1:many** - lihat catatan di 5.81).

---

*(Bagian **Payment** dari modul **Payment & Withdrawal** sudah lengkap
dengan ini - 2 tabel baru: `payments` dan `booking_invoices`. Bagian
**Withdrawal**-nya sendiri ternyata menempel ke sistem afiliator, bukan
tabel umum terpisah - didokumentasikan di 5.90 `commission_payments` dan
5.91 `withdrawal_methods` bersama modul Affiliator & Referral. Tabel
`PracticePurchase`, `ELearningSubscription`, dan `AYCLBooking` yang
direferensikan sudah dibahas masing-masing di 5.75, 5.63, dan 5.24;
`BookingParticipant` sudah dibahas di 5.16.)*

## Modul: Affiliator & Referral

> ℹ️ **Catatan pola untuk seluruh modul ini**: Ini sistem afiliasi berbasis
> **tier musiman** (season) - seorang user jadi afiliator lewat
> `AffiliatorProfile`, dapat `ReferralCode` unik miliknya, lalu setiap kali
> kode itu dipakai orang lain untuk transaksi (booking/practice/e-learning/
> AYCL), tercatat di `ReferralUsage` (siapa makenya) dan `ReferralCommisions`
> (berapa komisi yang didapat afiliator, snapshot kondisi saat itu).
> Performa per musim (`AffiliatorSeason`) direkap di
> `AffiliatorSeasonPoint`, dan besaran komisi/diskon per kombinasi produk +
> tier diatur di `AffiliatorProductConfig`. Pencairan komisi jadi uang
> sungguhan lewat `CommissionPayments`, ditransfer ke salah satu
> `WithdrawalMethod` milik afiliator.
>
> **Penting dibedakan dari modul Voucher & Redeem Code** (di bawah, 5.92
> dst.): `ReferralCode` = kode milik seorang **afiliator** (tercatat siapa
> `ownerId`-nya, menghasilkan komisi buat dia). `RedeemCode` = kode promo
> yang dibuat **admin** (giveaway, dsb), tidak terikat afiliator manapun,
> dan tidak menghasilkan komisi untuk siapa pun.

### 5.83 `affiliator_profiles`

**Fungsi tabel**: Profil keafiliatoran seorang user - menandai user itu
sebagai afiliator dan menyimpan status tier & poin akumulasinya.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cld02ba39c68a05a573b5ecb` | ID unik profil. |
| `userId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `000020` | User pemilik profil (1:1 - satu user maksimal satu profil afiliator). |
| `currentTier` | String | `NOT NULL` | `"BRONZE"` | `GOLD` | Freetext (bukan enum), sesuai komentar developer: `BRONZE`, `SILVER`, atau `GOLD`. |
| `totalPoints` | Int | `NOT NULL` | `0` | `320` | Poin akumulasi **lifetime** (sesuai komentar developer: "untuk referensi" - beda dari poin per-musim di 5.85). |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | `false` = status afiliator dinonaktifkan. |
| `joinedAt` | DateTime | `NOT NULL` | `now()` | `2026-01-10T08:00:00Z` | Tanggal bergabung sebagai afiliator. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`seasonPoints` (→ `affiliator_season_points`).

#### 📌 Catatan

`currentTier` freetext dengan 3 nilai (BRONZE/SILVER/GOLD) muncul lagi di
`tierAtSeasonStart`/`tierAtSeasonEnd` (5.85) dan `tier` di
`affiliator_product_configs` (5.86) - tiga tabel berbeda menyimpan konsep
tier yang sama, semuanya `String` biasa, tidak ada satu pun yang dijadikan
`enum` bersama walau nilainya tetap (mirip pola `level` freetext yang
berulang di modul E-Learning & Practice).

---

### 5.84 `affiliator_seasons`

**Fungsi tabel**: Master data periode/musim program afiliasi (mis. "Season
1 2025") - jadi konteks waktu untuk evaluasi tier & komisi.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clad5ef7948c066e4c57be72` | ID unik musim. |
| `seasonName` | String | `NOT NULL` | - | `Season 1 - 2026` | Nama musim, sesuai komentar developer: "Season 1 2025", "Season 2 2025", dst. |
| `startDate` | DateTime | `NOT NULL` | - | `2026-04-01` | Tanggal mulai musim. |
| `endDate` | DateTime | `NOT NULL` | - | `2026-05-01` | Tanggal berakhir musim. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | Menandai musim yang sedang berjalan. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel master.

#### Relasi ke Tabel Lain (ringkasan)

`seasonPoints` (→ `affiliator_season_points`), `referralCommisions` (→
`referral_commisions`).

---

### 5.85 `affiliator_season_points`

**Fungsi tabel**: Rekap poin & evaluasi tier seorang afiliator untuk satu
musim tertentu - beda dari `totalPoints` lifetime di `AffiliatorProfile`
(5.83), ini poin yang **direset per musim**.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clf67ab497b3df393b3c4f24` | ID unik. |
| `affiliatorProfileId` | String | `NOT NULL`, 🔗 FK | - | `clc7730580a4b351c26bded2` | Afiliator terkait. |
| `seasonId` | String | `NOT NULL`, 🔗 FK | - | `cl351237e3a5a7f5baee9560` | Musim terkait. |
| `points` | Int | `NOT NULL` | `0` | `50` | Akumulasi poin dalam musim ini. |
| `tierAtSeasonStart` | String | `NOT NULL` | - | `SILVER` | Tier afiliator saat musim dimulai (freetext). |
| `tierAtSeasonEnd` | String | `nullable` | - | `GOLD` | Tier hasil evaluasi akhir musim - diisi belakangan, kosong selama musim masih berjalan. |
| `maintenanceQuotaMet` | Boolean | `nullable` | - | `true` | `null` = belum dievaluasi, `true`/`false` = hasil evaluasi (sesuai komentar developer) - apakah afiliator memenuhi kuota minimal untuk mempertahankan tier-nya. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `affiliatorProfileId` → `affiliator_profiles.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `seasonId` → `affiliator_seasons.id` - *(tidak ada `onDelete` eksplisit)*.
- **Constraint tambahan**: `@@unique([affiliatorProfileId, seasonId])` - satu baris rekap per afiliator per musim.

---

### 5.86 `affiliator_product_configs`

**Fungsi tabel**: Matriks konfigurasi besaran komisi & diskon per kombinasi
tipe produk + tier afiliator - dipakai sistem untuk menghitung komisi saat
ada transaksi lewat kode referral.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl41541896421e3882a6f779` | ID unik konfigurasi. |
| `productType` | String | `NOT NULL` | - | `ELEARNING_3M` | Freetext, sesuai komentar developer: `ELEARNING_1M`, `ELEARNING_3M`, `ELEARNING_6M`, `MENTORING_BOOTCAMP`, `MENTORING_ONE_ON_ONE`, `MENTORING_GROUP`, atau `AYCL`. |
| `tier` | String | `NOT NULL` | - | `GOLD` | Freetext: `BRONZE`, `SILVER`, atau `GOLD`. |
| `commissionAmount` | Decimal | `nullable` | - | `15000` | Komisi flat dalam rupiah - dipakai untuk produk dengan harga fixed (E-Learning). |
| `discountAmount` | Decimal | `nullable` | - | `25000` | Diskon flat dalam rupiah (pasangan `commissionAmount`). |
| `commissionPercent` | Decimal | `nullable` | - | `10` | Persentase komisi dari harga - dipakai untuk produk dengan harga variabel (Bootcamp, One-on-One, Group, AYCL, sesuai komentar developer). |
| `discountPercent` | Decimal | `nullable` | - | `10` | Persentase diskon dari harga (pasangan `commissionPercent`). |
| `pointsAwarded` | Int | `NOT NULL` | - | `10` | Poin yang diberikan ke afiliator per transaksi sukses. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | Bisa dinonaktifkan per kombinasi produk+tier. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel konfigurasi, tidak terikat baris lain lewat FK.
- **Constraint tambahan**: `@@unique([productType, tier])` - maksimal satu konfigurasi aktif per kombinasi produk+tier.

---

### 5.87 `referral_codes`

**Fungsi tabel**: Kode referral unik milik seorang afiliator - inilah kode
yang dibagikan afiliator ke calon pembeli untuk dipakai saat transaksi.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl0ddd6a9a2623b35b32518a` | ID unik. |
| `ownerId` | String | `NOT NULL`, 🔗 FK | - | `000020` | Afiliator pemilik kode (langsung ke `users`, bukan ke `affiliator_profiles`). |
| `code` | String | `NOT NULL`, `@unique` | - | `TDK-PROMO25` | Kode referral yang dibagikan. |
| `createdDate` | DateTime | `nullable` | `now()` | `2026-03-10` | Tanggal kode dibuat. |
| `expiryDate` | DateTime | `nullable` | - | `2026-12-31` | Tanggal kedaluwarsa (opsional - kalau kosong, tidak kedaluwarsa). |
| `isActive` | Boolean | `nullable` | `true` | `true` | Saklar aktif/nonaktif manual. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `ownerId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`usages` (→ `referral_usages`), `referralCommisions` (→
`referral_commisions`), `commissionPayments` (→ `commission_payments`).

#### 📌 Catatan

`ownerId` menunjuk langsung ke `users.id`, **bukan** ke
`affiliator_profiles.id` - jadi secara skema, kepemilikan `ReferralCode`
tidak terikat langsung ke keberadaan `AffiliatorProfile`; keduanya
dihubungkan lewat `userId`/`ownerId` yang sama-sama merujuk ke `users`,
bukan lewat relasi langsung satu ke yang lain. `createdDate` dan
`createdAt` sama-sama ada dan sama-sama default `now()` - 
redundan (pola serupa juga terlihat di `practice_reviews`,
`submittedDate` vs `createdAt`).

---

### 5.88 `referral_usages`

**Fungsi tabel**: Catatan satu kali pemakaian `ReferralCode` oleh seorang
user - menghubungkan ke transaksi apa kode itu dipakai lewat 4 relasi
opsional (kebalikan arah dari `bookings`/`practice_purchases`/
`e_learning_subscriptions`/`aycl_bookings`, yang masing-masing sudah
punya kolom `referralUsageId` sendiri menunjuk balik ke sini).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clc4780c921c2d0c1539c73d` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang memakai kode. |
| `referralCodeId` | String | `NOT NULL`, 🔗 FK | - | `clda442f645dad8cdb1161cb` | Kode referral yang dipakai. |
| `usedAt` | DateTime | `NOT NULL` | `now()` | `2026-03-16T09:00:00Z` | Waktu kode dipakai. |
| `context` | VarChar | `NOT NULL` | - | `elearning_subscription` | Freetext konteks pemakaian ( menyimpan info produk/jenis transaksi, redundan secara konsep dengan relasi balik `booking`/`practicePurchase`/dst di bawah). |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |
| `updatedAt` | DateTime | `nullable` | *(tidak ada)* | `2026-03-16T08:00:00Z` | Tidak punya default. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `referralCodeId` → `referral_codes.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([userId, referralCodeId])` - satu user cuma bisa memakai kode referral yang sama sekali (tidak berulang).

#### Relasi ke Tabel Lain (ringkasan)

Empat relasi balik opsional 1:1 - **FK-nya sendiri ada di sisi tabel
lain**, bukan di sini: `booking` (→ `bookings.referralUsageId`, sudah
dibahas di 5.15), `practicePurchase` (→
`practice_purchases.referralUsageId`, sudah dibahas di 5.75),
`eLearningSubscription` (→ `e_learning_subscriptions.referralUsageId`,
sudah dibahas di 5.63), `ayclBooking` (→
`aycl_bookings.referralUsageId`, sudah dibahas di 5.24).

#### 📌 Catatan

Karena `@@unique([userId, referralCodeId])` cuma sepasang, dan tidak ada
kolom di tabel ini yang membedakan "dipakai untuk transaksi yang mana",
identitas transaksinya cuma bisa ditelusuri lewat 4 relasi balik opsional
di atas - kode aplikasi perlu tahu dari konteks mana `ReferralUsage` ini
dibuat (empat  tabel pemanggil) untuk tahu baris mana yang
sebenarnya terhubung.

---

### 5.89 `referral_commisions`

**Fungsi tabel**: Catatan komisi yang didapat afiliator dari satu transaksi
sukses lewat kode referralnya - snapshot lengkap kondisi saat transaksi
terjadi, untuk keperluan audit.

> ⚠️ Nama tabel & model ini **salah eja** di skema aslinya:
> `ReferralCommisions` / `referral_commisions` (kurang satu huruf "s"
> dari "Commissions") - beda ejaan dari `CommissionPayments` /
> `commission_payments` (5.90) yang justru dieja benar. Perlu diingat
> ejaan yang salah ini kalau menulis query langsung ke tabel.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl49565420b705b4dede2827` | ID unik. |
| `referralCodeId` | String | `NOT NULL`, 🔗 FK | - | `cl61e214e801f2e36008d62e` | Kode referral yang menghasilkan komisi ini. |
| `transactionId` | String | `NOT NULL` | - | `PAY-EL-20260715-9789868949` | ID transaksi terkait (freetext, tidak dideklarasikan sebagai FK -  menunjuk ke salah satu dari beberapa tabel transaksi berbeda, sama seperti pola `entityId` di `ELearningAuditLog`). |
| `amount` | Decimal | `NOT NULL` | - | `250000` | Komisi yang diterima (hasil kalkulasi saat itu, sesuai komentar developer). |
| `tierAtTransaction` | String | `nullable` | - | `GOLD` | Snapshot tier afiliator saat transaksi terjadi. |
| `productType` | String | `nullable` | - | `E_LEARNING` | Snapshot jenis produk yang dibeli (freetext). |
| `pointsAwarded` | Int | `nullable` | - | `10` | Snapshot poin yang diberikan dari transaksi ini. |
| `seasonId` | String | `nullable`, 🔗 FK | - | `cl00cc14eeadc7a97a593465` | Musim saat transaksi terjadi (opsional - tidak wajib terkait musim manapun). |
| `created_at` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. **Nama field Prisma-nya sendiri sudah snake_case** (`created_at`, bukan `createdAt` + `@map`) - satu-satunya kolom waktu di seluruh skema dengan gaya penulisan field seperti ini. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `referralCodeId` → `referral_codes.id` (nama field relasi `referral_code`, ikut snake_case) - `onDelete: Cascade`.
- 🔗 **FK 2**: `seasonId` → `affiliator_seasons.id`, opsional - *(tidak ada `onDelete` eksplisit)*.

#### 📌 Catatan

Ini tabel **snapshot audit** - `tierAtTransaction`, `productType`, dan
`pointsAwarded` sengaja diduplikasi dari `AffiliatorSeasonPoint`/
`AffiliatorProductConfig` di momen transaksi terjadi, supaya catatan
historisnya tidak berubah walau konfigurasi tier/produk berubah di
kemudian hari - pola yang sama dengan `oldValue`/`newValue` di
`ELearningAuditLog` (5.26). Baik nama field (`referral_code`,
`created_at`) maupun beberapa kolom di model ini tidak konsisten
mengikuti konvensi camelCase yang dipakai hampir di seluruh skema lain.

---

### 5.90 `commission_payments`

**Fungsi tabel**: Pencairan komisi afiliator jadi pembayaran sungguhan -
satu baris per pembayaran komisi, ditransfer lewat salah satu
`WithdrawalMethod` milik afiliator.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clfb2f307d6afccb4f4e963a` | ID unik. |
| `referralCodeId` | String | `NOT NULL`, 🔗 FK | - | `cl1e263ab7d3625ebc2b76e4` | Kode referral (dan tidak langsung, afiliatornya) yang dibayar komisinya. |
| `amount` | Decimal | `NOT NULL` | - | `250000` | Jumlah yang dicairkan. |
| `transactionId` | String | `nullable` | - | `TRX-20260315-00123` | ID transaksi pencairan (dari payment gateway/bank, freetext). |
| `status` | String | `nullable` | - | `PUBLISHED` | Freetext, sesuai komentar developer: `pending`, `paid`, atau `failed`. |
| `paid_at` | DateTime | `nullable` | - | `2026-03-15T10:35:00Z` | Waktu pembayaran selesai. Nama field snake_case langsung (sama seperti `created_at` di 5.89), bukan `paidAt` + `@map`. |
| `notes` | String | `nullable` | - | `Revisi bagian analisis data.` | Catatan tambahan atau alasan penolakan/gagal bayar (sesuai komentar developer). |
| `created_at` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. Nama field snake_case langsung, sama seperti pola di 5.89. |
| `withdrawalMethodId` | String | `nullable`, 🔗 FK | - | `clf56417480f77b0bea0840e` | Metode pencairan yang dipakai (opsional). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `referralCodeId` → `referral_codes.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `withdrawalMethodId` → `withdrawal_methods.id` - `onDelete: SetNull` (berbeda dari mayoritas FK lain yang `Cascade` - riwayat pembayaran komisi tetap dipertahankan walau metode penarikannya dihapus, cuma `withdrawalMethodId`-nya jadi `NULL`).

#### 📌 Catatan

`referralCodeId` di sini **bukan** `@unique`, jadi satu `ReferralCode`
bisa punya banyak `CommissionPayments` - masuk akal karena komisi
biasanya dicairkan berkala (mis. bulanan), bukan sekali per kode. Nama
tabel ini `commission_payments` dieja benar, kontras dengan
`referral_commisions` (5.89) yang salah eja - dua tabel yang secara
konsep saling terkait erat (komisi tercatat di satu tempat, dicairkan di
tempat lain) tapi penulisan namanya tidak konsisten.

---

### 5.91 `withdrawal_methods`

**Fungsi tabel**: Metode pencairan dana (rekening bank/e-wallet) milik
afiliator, tempat komisi mereka ditransfer.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clcdfdbad169f573fe287e6e` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Pemilik metode pencairan. Sesuai komentar developer di skema: "*// affiliator*" - secara konsep khusus dipakai afiliator, walau kolomnya sendiri cuma FK biasa ke `users` (tidak divalidasi role di level DB). |
| `type` | String | `NOT NULL` | - | `bank` | Freetext, sesuai komentar developer: `"bank"` atau `"eWallet"`. |
| `providerName` | String | `NOT NULL` | - | `Mandiri` | Nama penyedia (freetext, contoh dari komentar developer: `"BCA"`, `"Mandiri"`, `"Dana"`, `"OVO"`). |
| `accountNumber` | String | `NOT NULL` | - | `4258205285225` | Nomor rekening / nomor HP (sesuai komentar developer). |
| `accountName` | String | `nullable` | - | `Budi Santoso` | Nama pemilik akun. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | Saklar aktif/nonaktif. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`commissionPayments` (→ `commission_payments`).

---

## Modul: Voucher & Redeem Code

> ℹ️ **Catatan pola untuk seluruh modul ini**: Dua sistem kode diskon yang
> **independen** satu sama lain, dijelaskan lewat komentar developer di
> atas `RedeemCode` di skema aslinya: *"Redeem yang berhasil bikin
> ELearningSubscription baru dengan payment: null (karena memang nggak
> lewat pembayaran), dan dicatat di RedeemCodeUsage buat audit trail +
> cegah 1 user redeem kode yang sama dua kali."* Ringkasnya:
>
> - **`Voucher`** - kode promo diskon **umum**, bisa dipakai lintas produk
>   (E-Learning, Practice, Mentoring, AYCL, atau global), tetap lewat alur
>   pembayaran biasa (cuma memotong harga).
> - **`RedeemCode`** - kode klaim **akses gratis tanpa pembayaran**, khusus
>   untuk `ELearningSubscriptionPlan` saja (tidak berlaku untuk produk
>   lain), dibuat admin untuk keperluan seperti giveaway.
>
> Berbeda dari `ReferralCode` (5.87) di modul sebelah, dua sistem ini
> **tidak terikat ke afiliator manapun** - makanya masuk kategori "referral
> non-afiliator" kalau dianggap sebagai bentuk kode-untuk-keuntungan, tapi
> sebenarnya lebih tepat disebut kode promo/klaim biasa.

### 5.92 `redeem_codes`

**Fungsi tabel**: Master kode klaim akses gratis ke satu
`ELearningSubscriptionPlan`, dibuat admin.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clce841414815622818d60ff` | ID unik. |
| `code` | VarChar | `NOT NULL`, `@unique` | - | `TDK-PROMO25` | Kode yang diklaim user. |
| `planId` | String | `NOT NULL`, 🔗 FK | - | `cl43b58c1727265d52860abb` | Paket langganan e-learning yang didapat kalau kode ini diklaim. |
| `createdById` | String | `NOT NULL`, 🔗 FK | - | `000001` | Admin pembuat kode. |
| `maxUses` | Int | `NOT NULL` | `1` | `100` | Kuota maksimal klaim untuk kode ini (bisa lebih dari 1 untuk kode yang dibagi ke banyak orang). |
| `usedCount` | Int | `NOT NULL` | `0` | `5` | Jumlah klaim yang sudah terpakai. |
| `expiresAt` | Timestamp(6) | `NOT NULL` | - | `2026-12-31T23:59:59Z` | Waktu kedaluwarsa. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | Saklar manual untuk menonaktifkan kode sebelum masa berlakunya habis (sesuai komentar developer, mis. kalau kode bocor/disalahgunakan) - terpisah dari `expiresAt`. |
| `note` | String | `nullable` | - | `Giveaway IG Agustus 2026` | Catatan internal admin, contoh dari komentar developer: "Giveaway IG Agustus 2026". |
| `createdAt` | Timestamp(6) | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `planId` → `e_learning_subscription_plans.id` - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 2**: `createdById` → `users.id` (relasi `"RedeemCodeCreatedBy"`) - *(tidak ada `onDelete` eksplisit)*.
- **Index tambahan**: `@@index([planId])`, `@@index([expiresAt])`, `@@index([isActive])`.

#### Relasi ke Tabel Lain (ringkasan)

`usages` (→ `redeem_code_usages`).

#### 📌 Catatan

Beda dari `Voucher` (5.95) yang cakupannya lintas produk lewat
`VoucherProductScope`, `RedeemCode` **cuma bisa dipakai untuk satu
`ELearningSubscriptionPlan` spesifik** - tidak ada opsi "berlaku untuk
semua paket" atau lintas modul lain (Practice/Mentoring/AYCL).

---

### 5.93 `redeem_code_usages`

**Fungsi tabel**: Catatan satu kali klaim `RedeemCode` oleh user - tiap
klaim sukses otomatis membuat satu `ELearningSubscription` baru (dengan
`payment: null`, sesuai catatan pola modul di atas).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl0e29e694f751a4c0514cb1` | ID unik. |
| `redeemCodeId` | String | `NOT NULL`, 🔗 FK | - | `cl052b54536c7a2bc1fb1455` | Kode yang diklaim. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang mengklaim. |
| `subscriptionId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `SUB-EL-1787102609260-4342737639` | Langganan e-learning yang dihasilkan dari klaim ini (1:1 - setiap klaim pasti bikin tepat satu subscription baru). |
| `redeemedAt` | DateTime | `NOT NULL` | `now()` | `2026-03-16T09:00:00Z` | Waktu diklaim. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `redeemCodeId` → `redeem_codes.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` (relasi `"RedeemCodeUsageUser"`) - `onDelete: Cascade`.
- 🔗 **FK 3**: `subscriptionId` → `e_learning_subscriptions.id` (relasi `"RedeemCodeUsageSubscription"`), `@unique` (1:1) - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([redeemCodeId, userId])` - sesuai komentar developer, "satu user cuma boleh redeem kode YANG SAMA sekali - biar nggak dobel klaim walau kodenya masih ada sisa kuota (`maxUses > 1`)". `@@index([userId])`.

---

### 5.94 `redeem_code_attempts`

**Fungsi tabel**: Log **setiap percobaan** klaim redeem code (berhasil
maupun gagal) - beda dari `redeem_code_usages` yang cuma mencatat klaim
yang **berhasil**;  dipakai untuk rate-limiting/deteksi abuse.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7c59d5899adeb3468514be` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang mencoba klaim. |
| `success` | Boolean | `NOT NULL` | - | `true` | `true` = percobaan berhasil, `false` = gagal (mis. kode salah/habis/kedaluwarsa). |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu percobaan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` (relasi `"RedeemCodeAttemptUser"`) - `onDelete: Cascade`.
- **Index tambahan**: `@@index([userId, success, createdAt])` - kombinasi index ini cocok untuk query "berapa kali user X gagal klaim dalam periode tertentu", memperkuat dugaan tabel ini untuk rate-limiting.

#### 📌 Catatan

Tabel ini **tidak menyimpan kode apa yang dicoba** - cuma `userId` +
`success` + waktu, jadi tidak bisa dipakai untuk melacak kode spesifik
mana yang sering gagal diklaim, hanya untuk melacak perilaku per-user.

---

### 5.95 `vouchers`

**Fungsi tabel**: Master kode promo diskon lintas produk - sistem voucher
paling fleksibel di skema ini, satu-satunya modul kode-promo yang
konsisten memakai `enum` sungguhan (`VoucherDiscountType`,
`VoucherProductScope`) alih-alih `String` freetext.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(VCH-....)` | `VCH-20260623-26FF42` | ID unik voucher. |
| `code` | VarChar | `NOT NULL`, `@unique` | - | `TDK-PROMO25` | Kode voucher. |
| `name` | VarChar | `NOT NULL` | - | `Diskon Mentoring ` | Nama voucher. |
| `description` | Text | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi voucher. |
| `discountType` | Enum `VoucherDiscountType` | `NOT NULL` | - | `PERCENTAGE` | `PERCENTAGE` atau `FLAT`. |
| `discountValue` | Decimal(10,2) | `NOT NULL` | - | `10` | Besaran diskon (persen atau nominal, tergantung `discountType`). |
| `maxDiscountAmount` | Decimal(10,2) | `nullable` | - | `50000` | Batas maksimal potongan - **hanya relevan kalau `discountType = PERCENTAGE`** (sesuai komentar developer, mis. diskon 30% tapi maks potongan Rp 100.000). |
| `minimumPurchase` | Decimal(10,2) | `nullable` | - | `100000` | Minimal nominal pembelian supaya voucher bisa dipakai. |
| `productScope` | Enum `VoucherProductScope` | `NOT NULL` | `GLOBAL` | `ALL_PRODUCTS` | `GLOBAL`, `ELEARNING`, `PRACTICE`, `MENTORING`, atau `AYCL`. |
| `usageLimit` | Int | `nullable` | - | `100` | Kuota total pemakaian. `null` = unlimited (sesuai komentar developer). |
| `usageLimitPerUser` | Int | `NOT NULL` | `1` | `1` | Kuota pemakaian per user. |
| `usageCount` | Int | `NOT NULL` | `0` | `12` | Di-increment tiap redemption berhasil, untuk cek kuota (sesuai komentar developer). |
| `startDate` | DateTime | `nullable` | - | `2026-04-01` | Tanggal mulai berlaku. |
| `expiryDate` | DateTime | `nullable` | - | `2026-12-31` | Tanggal kedaluwarsa. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | Saklar aktif/nonaktif. |
| `createdById` | String | `nullable`, 🔗 FK | - | `cl54ea8c2d58e2887a576480` | Admin/marketing pembuat, untuk audit trail (sesuai komentar developer). |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `createdById` → `users.id` (relasi `"VoucherCreatedBy"`), opsional - `onDelete: SetNull` (voucher tetap ada walau admin pembuatnya dihapus).
- **Index tambahan**: `@@index([code])`, `@@index([isActive])`, `@@index([productScope])`.

#### Relasi ke Tabel Lain (ringkasan)

`usages` (→ `voucher_usages`).

---

### 5.96 `voucher_usages`

**Fungsi tabel**: Catatan satu kali pemakaian voucher - beda dari
`ReferralUsage` (5.88) dan `Payment` (5.81), tabel ini mengimplementasikan
**state machine reservasi** (`RESERVED` → `USED`/`CANCELLED`) yang tidak
ada padanannya di tabel manapun yang sudah dibahas sejauh ini.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl0ee5327e26fffcdfc2ff95` | ID unik. |
| `voucherId` | String | `NOT NULL`, 🔗 FK | - | `VCH-20260715-FD678E` | Voucher yang dipakai. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang memakai. |
| `status` | Enum `VoucherUsageStatus` | `NOT NULL` | `RESERVED` | `PUBLISHED` | `RESERVED`, `USED`, atau `CANCELLED` |
| `originalAmount` | Decimal(10,2) | `NOT NULL` | - | `250000` | Harga asli sebelum diskon (audit trail). |
| `discountAmount` | Decimal(10,2) | `NOT NULL` | - | `25000` | Besaran potongan yang diberikan. |
| `finalAmount` | Decimal(10,2) | `NOT NULL` | - | `225000` | Harga akhir setelah diskon. |
| `bookingId` | String | `nullable`, `@unique`, 🔗 FK | - | `Booking-bootcamp-6907575958` | Terisi kalau dipakai untuk booking mentoring (1:1). |
| `practicePurchaseId` | String | `nullable`, `@unique`, 🔗 FK | - | `cl63a5e66e86c75f26cdc073` | Terisi kalau dipakai untuk pembelian practice (1:1). |
| `eLearningSubscriptionId` | String | `nullable`, `@unique`, 🔗 FK | - | `SUB-EL-1784269281714-57046802102` | Terisi kalau dipakai untuk langganan e-learning (1:1). |
| `ayclBookingId` | String | `nullable`, `@unique`, 🔗 FK | - | `AYCLBook-20260717-BEGEbu` | Terisi kalau dipakai untuk booking AYCL (1:1). |
| `usedAt` | DateTime | `NOT NULL` | `now()` | `2026-03-16T09:00:00Z` | Waktu baris dibuat (bukan berarti sudah pasti `USED` - lihat catatan). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `voucherId` → `vouchers.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` (relasi `"VoucherUsageUser"`) - `onDelete: Cascade`.
- 🔗 **FK 3**: `bookingId` → `bookings.id` (relasi `"VoucherUsageBooking"`), opsional 1:1 - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 4**: `practicePurchaseId` → `practice_purchases.id` (relasi `"VoucherUsagePractice"`), opsional 1:1 - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 5**: `eLearningSubscriptionId` → `e_learning_subscriptions.id` (relasi `"VoucherUsageELearning"`), opsional 1:1 - *(tidak ada `onDelete` eksplisit)*.
- 🔗 **FK 6**: `ayclBookingId` → `aycl_bookings.id` (relasi `"VoucherUsageAYCL"`), opsional 1:1 - *(tidak ada `onDelete` eksplisit)*.
- **Index tambahan**: `@@index([voucherId])`, `@@index([userId])`, `@@index([voucherId, userId])`.

#### 📌 Catatan

Empat kolom target (`bookingId`/`practicePurchaseId`/
`eLearningSubscriptionId`/`ayclBookingId`) memakai pola polimorfik yang
sama seperti `Payment` (5.81) dan `ReferralUsage` (lewat relasi balik,
5.88) - bedanya di sini **semuanya** `@unique` (selalu 1:1, tidak ada
kasus non-unique seperti `bookingInvoiceId` di `Payment`), karena voucher
berlaku sekali per transaksi, tidak per cicilan. Yang unik dari tabel ini
dibanding semua tabel "usage/purchase" lain di skema: statusnya bukan
cuma `String` freetext, tapi **enum sungguhan** dengan makna reservasi -
 alurnya: baris dibuat `RESERVED` begitu voucher dipilih saat
checkout (mengunci kuota supaya tidak direbut transaksi lain), lalu
diubah jadi `USED` setelah pembayaran benar-benar sukses, atau
`CANCELLED` kalau checkout dibatalkan/gagal (supaya kuota voucher tidak
ikut terpotong sia-sia). `usageCount` di `vouchers` (5.95) 
cuma diincrement saat status berubah jadi `USED`, bukan saat `RESERVED`.

---

*(Modul **Affiliator & Referral** dan **Voucher & Redeem Code** sudah
lengkap dengan ini - total 14 tabel (5.83-5.96) dan 3 enum tambahan
(`VoucherDiscountType`, `VoucherProductScope`, `VoucherUsageStatus`).
Tabel `ELearningSubscriptionPlan`/`ELearningSubscription` yang
direferensikan sudah dibahas di 5.62 & 5.63.)*

## Modul: Article

> ℹ️ **Catatan pola untuk seluruh modul ini**: Sesuai komentar developer di
> skema aslinya, arsitektur block/content-block Article ini **sengaja
> dibuat mirror** dari pola E-Learning (`ELearningText` →
> `ELearningTextBlock` → `ELearningContentBlock`) - bedanya di sini
> **tidak ada jenjang SubChapter/SubBab**: `ArticleBlock` nempel langsung
> ke `Article`, karena artikel itu satu halaman konten tunggal, bukan
> kurikulum berjenjang.
>
> Ini juga hasil **revisi** dari rancangan awal (masih tercatat di
> komentar developer di skema):
> - **Dihapus**: tipe konten `ACCORDION`, `CAROUSEL`, `CONTENT_CARD`,
>   `TAB_NAVIGATION`, `SUMMARY` beserta semua model & item pendukungnya -
>   tidak jadi dipakai di Article (beda dari E-Learning yang masih punya
>   ke-8 tipe konten strukturalnya, 5.33-5.46).
> - **Dipertahankan**: `HEADING`, `PARAGRAPH`, `HIGHLIGHT` - strukturnya
>   identik dengan versi E-Learning (5.34-5.36).
> - **Baru**: `TABLE`, `DIVIDER`, `LINK`, `TABLE_OF_CONTENT` - keempatnya
>   didaftarkan sebagai `ArticleContentBlockType` (konten struktural biasa,
>   berdiri sendiri di alur artikel dengan urutannya sendiri), **bukan**
>   `additionalContent` - karena `additionalContent` di modul ini (sama
>   seperti di E-Learning) khusus untuk elemen yang nempel/anchor
>   (before/after/inline) ke sebuah block, seperti gambar/video di
>   sela-sela paragraf. `ArticleAdditionalContent` sendiri jadinya cuma
>   punya **satu** tipe tersisa: `IMAGE_VIDEO` (lihat 5.112).
> - **Baru juga**: `Link` (5.109) dan `Table of Content` (5.110-5.111)
>   sekarang bisa menunjuk ke **dua jenis target** sekaligus - content
>   block (heading/paragraph/table/dll) ATAU additional content
>   (gambar/video) - lewat dua kolom FK nullable
>   (`targetContentBlockId`/`targetAdditionalContentId`). Cuma salah satu
>   yang boleh diisi; tidak ada `CHECK constraint` XOR di Postgres, jadi
>   validasinya murni di level aplikasi.

### 5.97 `articles`

**Fungsi tabel**: Master data satu artikel - induk dari seluruh struktur
konten (blocks), like, dan komentar di modul ini.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (custom) | 🔑 PK, `NOT NULL` | `custom(article-....)` | `article-20260831-af3e89` | ID unik artikel. |
| `authorId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Penulis artikel. |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul artikel. |
| `slug` | String | `NOT NULL`, `@unique` | - | `belajar-python-untuk-pemula` | Slug URL-friendly - **wajib** diisi (`NOT NULL`), beda dari `e_learning_courses.slug` yang nullable. |
| `excerpt` | String | `nullable` | - | `Ringkasan singkat isi artikel dalam satu-dua kalimat.` | Ringkasan singkat artikel. |
| `coverImage` | String | `nullable` | - | `https://cdn.temudataku.com/covers/cover-01.jpg` | Gambar sampul. |
| `categoryId` | String | `nullable`, 🔗 FK | - | `clf053ce0a1762f827d94849` | Kategori artikel. Sesuai komentar developer, ini hasil revisi dari kolom `category String?` freetext lama - sekarang jadi FK relasional ke `article_categories` (5.98). |
| `tags` | VarChar[] | `NOT NULL` | - | `["python", "data-science"]` | Array tag - tetap freetext (tidak direvisi jadi relasional seperti `category`). |
| `status` | Enum `ArticleStatus` | `NOT NULL` | `DRAFT` | `PUBLISHED` | `DRAFT`, `PUBLISHED`, atau `ARCHIVED`. |
| `isRecommended` | Boolean | `NOT NULL` | `false` | `true` | Menandai artikel unggulan/rekomendasi. |
| `publishedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T09:00:00Z` | Waktu artikel benar-benar dipublish - terpisah dari `createdAt`, karena artikel bisa dibuat sebagai draft jauh sebelum dipublikasikan. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | - | `2026-03-16T08:00:00Z` | Manual, tidak `@updatedAt`. |
| `deletedAt` | Timestamp(6) | `nullable` | - | `null` (belum dihapus) | **Soft delete** - diisi kalau artikel "dihapus" tanpa benar-benar menghapus barisnya. Pola ini baru muncul di modul Article.

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `authorId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `categoryId` → `article_categories.id`, opsional - `onDelete: SetNull` (kategori dihapus → `categoryId` artikel jadi `NULL`, artikelnya sendiri tidak ikut terhapus), `onUpdate: Cascade`.
- **Index tambahan**: `@@index([authorId])`, `@@index([status])`, `@@index([isRecommended])`, `@@index([categoryId])`, `@@index([deletedAt])`.

#### Relasi ke Tabel Lain (ringkasan)

`blocks` (→ `article_blocks`), `likes` (→ `article_likes`), `comments` (→
`article_comments`), `tableOfContent` (→
`ct_article_table_of_content_contents`, 1:1 opsional - lihat 5.110, FK-nya
justru ada di sisi tabel TOC, bukan di `articles`).

---

### 5.98 `article_categories`

**Fungsi tabel**: Master data kategori artikel - hasil revisi dari kolom
`category` freetext lama di `Article` menjadi entitas relasional
tersendiri.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl6377279331e1966a0cd98c` | ID unik kategori. |
| `name` | VarChar | `NOT NULL`, `@unique` | - | `Teknologi` | Nama kategori. |
| `createdAt` | Timestamp(6) | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel master.

#### Relasi ke Tabel Lain (ringkasan)

`articles` (→ `articles`, 1:many).

---

### 5.99 `article_blocks`

**Fungsi tabel**: Kontainer urutan konten di dalam satu `Article` - setara
`ELearningTextBlock` (5.32), tapi nempel langsung ke `Article` tanpa
jenjang SubChapter/SubBab/Text di antaranya.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl117c32dd9697860e3c5645` | ID unik block. |
| `articleId` | String | `NOT NULL`, 🔗 FK | - | `article-20260831-0e5a1e` | Artikel induk. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan block dalam artikel. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `articleId` → `articles.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([articleId, orderNumber])`.

#### Relasi ke Tabel Lain (ringkasan)

`contentBlocks` (→ `ct_article_content_blocks`), `additionalContents` (→
`ct_article_additional_contents`).

---

### 5.100 `ct_article_content_blocks`

**Fungsi tabel**: Tabel "router" polimorfik untuk konten struktural
artikel - setara `ct_e_learning_content_blocks` (5.33), tapi dengan 7 tipe
(bukan 8) dan 2 relasi balik tambahan yang tidak ada padanannya di
E-Learning.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl606cde6e3458ea959f81d1` | ID unik. |
| `blockId` | String | `NOT NULL`, 🔗 FK | - | `cld19577ebc9b0f835227bc1` | Article block induk. |
| `type` | Enum `ArticleContentBlockType` | `NOT NULL` | - | `HEADING` | `HEADING`, `PARAGRAPH`, `HIGHLIGHT`, `TABLE`, `DIVIDER`, `LINK`, atau `TABLE_OF_CONTENT`. |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan dalam block. |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `blockId` → `article_blocks.id` - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

Enam relasi "pemilik" 1:1 opsional (satu per tipe, pola sama seperti
E-Learning): `headingContent` (→ 5.101), `paragraphContent` (→ 5.102),
`highlightContent` (→ 5.103), `tableContent` (→ 5.104), `dividerContent`
(→ 5.108), `tableOfContentContent` (→ 5.110). Ditambah relasi ke-7,
`linkContent` (→ 5.109, relasi `"ArticleLinkOwner"`) - kalau `type = LINK`.

Dua relasi **balik** tambahan yang tidak ada di E-Learning: `linkedFromContents`
(→ `ct_article_link_contents`, relasi `"ArticleLinkTarget"`, **1:many** -
content block manapun bisa jadi tujuan lompat banyak `Link` sekaligus) dan
`referencedByTOCItems` (→ `ct_article_table_of_content_items`, relasi
`"ArticleTOCItemTarget"`, **1:many** - bisa jadi tujuan banyak item daftar
isi).

#### 📌 Catatan

Selain jadi "pemilik" salah satu dari 7 tipe konten (pola polimorfik biasa,
sama seperti `ct_e_learning_content_blocks`), satu baris di tabel ini
**juga bisa jadi target** yang ditunjuk oleh `Link`/`TableOfContentItem`
lain di artikel yang sama - dua peran sekaligus (pemilik konten & tujuan
navigasi) yang tidak saling eksklusif. Sebuah heading, misalnya, tetap satu
baris di sini yang "memiliki" `ArticleHeadingContent`-nya sendiri, sekaligus
bisa muncul sebagai tujuan lompat dari beberapa `Link`/item TOC berbeda.

---

### 5.101 `ct_article_heading_contents`

**Fungsi tabel**: Konten tipe heading - struktur identik dengan versi
E-Learning (5.34).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clbd3293b9e5d870872fc1de` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl918d49c47c75fffb63c9f4` | Content block induk (1:1). |
| `level` | Int | `NOT NULL` | - | `2` | Level heading. |
| `text` | Text | `NOT NULL` | - | `Ini adalah contoh isi teks konten.` | Teks heading. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.102 `ct_article_paragraph_contents`

**Fungsi tabel**: Konten tipe paragraf - struktur identik dengan versi
E-Learning (5.35).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl6b13a773440f3bc6e238a3` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl3931c6235d97be5592b8c8` | Content block induk (1:1). |
| `text` | Text | `NOT NULL` | - | `Ini adalah contoh isi teks konten.` | Isi paragraf. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.103 `ct_article_highlight_contents`

**Fungsi tabel**: Konten tipe highlight - struktur identik dengan versi
E-Learning (5.36), termasuk batas panjang teks yang sama.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cle478edc15fb0081e846866` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `clcd4bffbc2fa957c1c073d4` | Content block induk (1:1). |
| `text` | VarChar(1250) | `NOT NULL` | - | `Ini adalah contoh isi teks konten.` | Isi highlight. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.104 `ct_article_table_contents`

**Fungsi tabel**: Wadah konten tipe tabel/grid data - tipe konten baru yang
tidak ada padanannya di E-Learning. Kolom & barisnya masing-masing di tabel
terpisah (5.105, 5.106), isinya per sel di 5.107 - sesuai builder UI
("Add Column" bikin kolom baru + header, "Add Row" bikin baris baru).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clcae8c654fd699f033bb862` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl85de4962fff7839a2acdb1` | Content block induk (1:1). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`columns` (→ `ct_article_table_columns`), `rows` (→ `ct_article_table_rows`).

---

### 5.105 `ct_article_table_columns`

**Fungsi tabel**: Satu kolom (beserta header-nya) di dalam tabel artikel
(5.104).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7507c39fd3b12715571dde` | ID unik. |
| `tableId` | String | `NOT NULL`, 🔗 FK | - | `clcf68a825cc4e928507367d` | Tabel induk. |
| `header` | String | `NOT NULL` | - | `Nama Produk` | Teks header kolom. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan kolom (kiri ke kanan). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `tableId` → `ct_article_table_contents.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([tableId, orderNumber])`.

#### Relasi ke Tabel Lain (ringkasan)

`cells` (→ `ct_article_table_cells`).

---

### 5.106 `ct_article_table_rows`

**Fungsi tabel**: Satu baris di dalam tabel artikel (5.104) - beda dari
kolom, baris tidak punya header sendiri, cuma urutan.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl9d444971499b820caec038` | ID unik. |
| `tableId` | String | `NOT NULL`, 🔗 FK | - | `cl1b67eb021d54711dd2a544` | Tabel induk. |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan baris (atas ke bawah). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `tableId` → `ct_article_table_contents.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([tableId, orderNumber])`.

#### Relasi ke Tabel Lain (ringkasan)

`cells` (→ `ct_article_table_cells`).

---

### 5.107 `ct_article_table_cells`

**Fungsi tabel**: Satu sel data - persimpangan antara satu `ArticleTableRow`
dan satu `ArticleTableColumn`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl9e96cea76246a4925e6334` | ID unik. |
| `rowId` | String | `NOT NULL`, 🔗 FK | - | `clc902437391ad10e73ac0f2` | Baris tempat sel ini berada. |
| `columnId` | String | `NOT NULL`, 🔗 FK | - | `cl71e6baa0ecfa973ddcd5ed` | Kolom tempat sel ini berada. |
| `value` | Text | `nullable` | - | `Rp150.000` | Isi sel (kosong = sel belum diisi). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `rowId` → `ct_article_table_rows.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `columnId` → `ct_article_table_columns.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([rowId, columnId])` - memastikan tepat satu sel per kombinasi baris×kolom (mencegah sel duplikat pada posisi grid yang sama).

---

### 5.108 `ct_article_divider_contents`

**Fungsi tabel**: Konten tipe garis pemisah antar-section - tipe konten
paling sederhana di seluruh skema ini, cuma menyimpan satu pilihan style.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl65ee9276ef44e55795dec2` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl68c62149c54b5e951dca5d` | Content block induk (1:1). |
| `style` | Enum `ArticleDividerStyle` | `NOT NULL` | `SOLID` | `SOLID` | `SOLID` (garis penuh "—") atau `DASHED` (garis putus-putus "----"). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.109 `ct_article_link_contents`

**Fungsi tabel**: Konten tipe link/tautan - teks link + tujuan, yang bisa
berupa URL eksternal ATAU lompatan ke section lain di artikel yang sama
(content block atau media). Punya perilaku `onDelete` yang **asimetris**
antara relasi pemilik dan relasi target - lihat catatan.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clc22dfed8e0a22fb8e54297` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl077fa3bb4197789e2e35a1` | Content block induk (1:1) - baris `ArticleContentBlock` yang **bertipe LINK** ini sendiri. |
| `linkText` | VarChar(150) | `NOT NULL` | - | `Baca selengkapnya` | Teks yang ditampilkan sebagai link. |
| `linkType` | Enum `ArticleLinkType` | `NOT NULL` | - | `EXTERNAL_URL` | `EXTERNAL_URL` atau `ARTICLE_SECTION`. |
| `externalUrl` | String | `nullable` | - | `https://example.com/artikel-referensi` | Dipakai kalau `linkType = EXTERNAL_URL`. |
| `targetContentBlockId` | String | `nullable`, 🔗 FK | - | `clfe9dddfb69147f9678d716` | Dipakai kalau `linkType = ARTICLE_SECTION` dan tujuannya sebuah content block (heading/paragraph/table/dll). |
| `targetAdditionalContentId` | String | `nullable`, 🔗 FK | - | `cl290052ca1316a34a2a1fa8` | Dipakai kalau `linkType = ARTICLE_SECTION` dan tujuannya media (gambar/video). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1** *(pemilik)*: `contentId` → `ct_article_content_blocks.id` (relasi `"ArticleLinkOwner"`), `@unique` (1:1) - `onDelete: Cascade`.
- 🔗 **FK 2** *(target)*: `targetContentBlockId` → `ct_article_content_blocks.id` (relasi `"ArticleLinkTarget"`), opsional - `onDelete: SetNull`.
- 🔗 **FK 3** *(target)*: `targetAdditionalContentId` → `ct_article_additional_contents.id` (relasi `"ArticleLinkTargetMedia"`), opsional - `onDelete: SetNull`.

#### 📌 Catatan

`externalUrl`, `targetContentBlockId`, dan `targetAdditionalContentId`
sengaja semuanya nullable - cuma salah satu yang diisi sesuai `linkType`
(dan kalau `ARTICLE_SECTION`, cuma salah satu dari 2 kolom target itu),
divalidasi di level aplikasi/BE, **tidak ada `CHECK constraint` XOR** di
Postgres.

Perilaku `onDelete` di sini sengaja **asimetris** dan layak diperhatikan:
relasi ke content block **pemilik** (`contentId`) pakai `Cascade` - kalau
content block LINK-nya dihapus, baris `ArticleLinkContent` ini ikut
terhapus (wajar, karena dia bagian dari block itu sendiri). Tapi relasi ke
2 kolom **target** pakai `SetNull` - kalau content block atau media yang
jadi *tujuan* lompatnya dihapus, link-nya **tidak ikut terhapus**,
cuma kolom target yang bersangkutan jadi `NULL` (link jadi "patah"/tidak
menunjuk ke mana-mana, tapi barisnya tetap ada untuk diedit ulang oleh
penulis). Ini kebalikan dari perilaku `ArticleTableOfContentItem` (5.111)
yang justru `Cascade` di kedua kolom targetnya.

---

### 5.110 `ct_article_table_of_content_contents`

**Fungsi tabel**: Wadah daftar isi (table of content) satu artikel -
dibatasi **tepat satu per artikel**, dan ini **ditegakkan di level DB**
(bukan cuma konvensi frontend).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl196d4945dea64df0fe5f07` | ID unik. |
| `contentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl721f2a7763feaa9f2da04b` | Content block induk (1:1) - baris `ArticleContentBlock` bertipe `TABLE_OF_CONTENT`. |
| `articleId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cl4baf9996a4b3b63b23f135` | Artikel yang punya daftar isi ini - **denormalized** dari `block → article` khusus untuk menegakkan aturan "1 artikel cuma boleh 1 Table of Content" lewat `@unique` di level DB (sesuai komentar developer). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `contentId` → `ct_article_content_blocks.id`, `@unique` (1:1) - `onDelete: Cascade`.
- 🔗 **FK 2**: `articleId` → `articles.id`, `@unique` (1:1) - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`items` (→ `ct_article_table_of_content_items`).

#### 📌 Catatan

`articleId` di sini teknisnya **redundan** secara data (bisa didapat lewat
join `contentId → block → article`), tapi sengaja didenormalisasi dan
diberi `@unique` supaya database sendiri yang menolak kalau ada percobaan
membuat Table of Content kedua untuk artikel yang sama - jarang ditemukan
di modul lain di skema ini, yang kebanyakan aturan "cuma boleh satu"-nya
divalidasi di kode aplikasi saja (mis. `RedeemCode` per plan tidak dibatasi
begini).

---

### 5.111 `ct_article_table_of_content_items`

**Fungsi tabel**: Satu item/baris di dalam daftar isi (5.110) - menunjuk
ke satu content block atau satu media sebagai tujuan lompat.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clde0152d2ea4803042ebfa9` | ID unik. |
| `tocId` | String | `NOT NULL`, 🔗 FK | - | `cl57c9e8c8b0db42cad60229` | Table of Content induk. |
| `label` | VarChar(50) | `NOT NULL` | - | `Pengenalan Machine Learning` | Teks item (mis. "Item Name 1"). |
| `orderNumber` | Int | `NOT NULL` | - | `1` | Urutan item dalam daftar isi. |
| `targetContentBlockId` | String | `nullable`, 🔗 FK | - | `cld54f1dcd86c988bc0a53d1` | Tujuan lompat berupa content block (kalau diisi). |
| `targetAdditionalContentId` | String | `nullable`, 🔗 FK | - | `clf43f2479607acd1cc6ce35` | Tujuan lompat berupa media (kalau diisi). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `tocId` → `ct_article_table_of_content_contents.id` - `onDelete: Cascade`.
- 🔗 **FK 2** *(target)*: `targetContentBlockId` → `ct_article_content_blocks.id` (relasi `"ArticleTOCItemTarget"`), opsional - `onDelete: Cascade`.
- 🔗 **FK 3** *(target)*: `targetAdditionalContentId` → `ct_article_additional_contents.id` (relasi `"ArticleTOCItemTargetMedia"`), opsional - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([tocId, orderNumber])`.

#### 📌 Catatan

Isi **salah satu** dari 2 kolom target (app-level validation, sama seperti
`ArticleLinkContent`). Bedanya dari `ArticleLinkContent` (5.109): kedua
relasi target di sini pakai `onDelete: Cascade`, **bukan** `SetNull` -
jadi kalau content block/media yang jadi tujuan sebuah item TOC dihapus,
**item TOC-nya ikut terhapus otomatis** (bukan cuma kolom targetnya jadi
`NULL`). Konsisten dengan sifatnya sebagai daftar isi - item TOC yang
tujuannya sudah tidak ada memang tidak berguna lagi untuk ditampilkan, jadi
lebih masuk akal dihapus otomatis daripada dibiarkan "patah".

---

### 5.112 `ct_article_additional_contents`

**Fungsi tabel**: Tabel "router" untuk konten interaktif/media artikel -
setara `ct_e_learning_additional_contents` (5.47), tapi tipenya menyusut
jadi cuma **satu**: `IMAGE_VIDEO` saja (MATCHING, MULTIPLE_CHOICE,
INTERACTIVE_CODE tidak relevan untuk artikel).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cla284617333302ac6691598` | ID unik. |
| `blockId` | String | `NOT NULL`, 🔗 FK | - | `cl0fab4d9026baa372c02a3e` | Article block induk. |
| `type` | Enum `ArticleAdditionalContentType` | `NOT NULL` | - | `LOGIN` | Cuma ada satu nilai yang mungkin: `IMAGE_VIDEO`. |
| `position` | Enum `AnchorPosition` | `NOT NULL` | - | `BEFORE` | `BEFORE`, `AFTER`, atau `INLINE` (enum yang sama, dipakai bersama dengan E-Learning - lihat 5.47). |
| `orderNumber` | Int | `nullable` | - | `1` | Urutan bila ada beberapa additional content di block yang sama. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `blockId` → `article_blocks.id` - `onDelete: Cascade`.

#### Relasi ke Tabel Lain (ringkasan)

`imageVideo` (→ `ct_article_image_video_contents`, 1:1 opsional - satu
"pemilik" per pola polimorfik, walau cuma ada 1 tipe). Dua relasi balik
(pola sama seperti `ct_article_content_blocks`): `linkedFromContents` (→
`ct_article_link_contents`, relasi `"ArticleLinkTargetMedia"`, 1:many) dan
`referencedByTOCItems` (→ `ct_article_table_of_content_items`, relasi
`"ArticleTOCItemTargetMedia"`, 1:many).

---

### 5.113 `ct_article_image_video_contents`

**Fungsi tabel**: Elemen gambar/video artikel - struktur identik dengan
versi E-Learning (5.52).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl6649789e4ac93fa8217bce` | ID unik. |
| `additionalContentId` | String | `NOT NULL`, `@unique`, 🔗 FK | - | `cle1d5258cd67fa68c7b4316` | Additional content induk (1:1). |
| `title` | String | `nullable` | - | `Belajar Python untuk Pemula` | Judul media. |
| `caption` | String | `nullable` | - | `(freetext)` | Caption media. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi media. |
| `mediaType` | Enum `MediaType` | `NOT NULL` | - | `IMAGE` | `IMAGE` atau `VIDEO` (enum yang sama dengan E-Learning). |
| `url` | String | `NOT NULL` | - | `https://cdn.temudataku.com/files/materi-01.pdf` | URL/path file media. |
| `thumbnailUrl` | String | `nullable` | - | `https://cdn.temudataku.com/thumb/thumb-01.jpg` | URL thumbnail. |
| `durationSeconds` | Int | `nullable` | - | `120` | Durasi video (detik) - relevan kalau `mediaType = VIDEO`. |
| `widthPercent` | Int | `nullable` | `100` | `100` | Lebar tampilan (persen). |
| `createdAt` | DateTime | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `additionalContentId` → `ct_article_additional_contents.id`, `@unique` (1:1) - `onDelete: Cascade`.

---

### 5.114 `article_element_favorites`

**Fungsi tabel**: Preferensi "elemen favorit" seorang user di editor
artikel - **bukan** favorit terhadap sebuah artikel tertentu, melainkan
favorit terhadap satu **jenis/tipe elemen** (mis. selalu menandai `TABLE`
sebagai favorit supaya gampang diakses di toolbar editor).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7701aed8263c47a50be0d7` | ID unik. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User pemilik preferensi. |
| `elementType` | Enum `ArticleElementType` | `NOT NULL` | - | `TABLE` | `HEADING`, `PARAGRAPH`, `IMAGE`, `VIDEO`, `TABLE`, `HIGHLIGHT`, `DIVIDER`, `LINK`, atau `TABLE_OF_CONTENT`. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu ditandai favorit. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([userId, elementType])` - toggle favorite/unfavorite tinggal cek exists atau tidak lewat compound unique ini, tanpa query terpisah (sesuai komentar developer).

#### 📌 Catatan

`enum ArticleElementType` (9 nilai: HEADING/PARAGRAPH/IMAGE/
VIDEO/TABLE/HIGHLIGHT/DIVIDER/LINK/TABLE_OF_CONTENT) **berbeda** dari
`ArticleContentBlockType` (7 nilai, tanpa IMAGE/VIDEO tapi ada di
`ArticleAdditionalContentType` terpisah) - `ArticleElementType` memecah
`IMAGE_VIDEO` yang di `ct_article_additional_contents` cuma satu nilai
gabungan, jadi dua nilai terpisah (`IMAGE`, `VIDEO`) di sini, karena dari
sudut pandang toolbar editor, gambar dan video adalah dua tombol/elemen
berbeda yang masing-masing bisa difavoritkan sendiri-sendiri, walau di
belakangnya sama-sama disimpan sebagai satu `ArticleAdditionalContent`
bertipe `IMAGE_VIDEO`.

---

### 5.115 `article_likes`

**Fungsi tabel**: Like/suka user terhadap satu artikel.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `claaa08369ebc3e5dc264c2d` | ID unik. |
| `articleId` | String | `NOT NULL`, 🔗 FK | - | `article-20260828-240b7d` | Artikel yang di-like. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang nge-like. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu like diberikan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `articleId` → `articles.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([articleId, userId])` - satu user cuma bisa like satu artikel sekali (toggle). `@@index([articleId])`, `@@index([userId])`.

---

### 5.116 `article_comments`

**Fungsi tabel**: Komentar user pada satu artikel - mendukung reply
berjenjang lewat self-relation `parentId`, sama seperti
`e_learning_discussions` (5.70), tapi di sini **ada** soft delete
(`deletedAt`) dan `updatedAt` otomatis, dua hal yang tidak dipunyai
`e_learning_discussions`.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl629b917283c994c8450244` | ID unik. |
| `articleId` | String | `NOT NULL`, 🔗 FK | - | `article-20260828-240b7d` | Artikel tempat komentar ditulis. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | Penulis komentar. |
| `parentId` | String | `nullable`, 🔗 FK | - | `cl96a196d69fba4734d7ae23` | Diisi kalau baris ini balasan (reply) ke komentar lain (self-relation `"ArticleCommentReplies"`). |
| `content` | Text | `NOT NULL` | - | `Saya sangat suka artikel ini` | Isi komentar. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | Timestamp(6) | `nullable` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt` - jadi komentar yang diedit **bisa** dibedakan dari yang asli (beda dari `e_learning_discussions` yang tidak bisa). |
| `deletedAt` | Timestamp(6) | `nullable` | - | `null` (belum dihapus) | Soft delete - konsisten dengan pola `articles` (5.97). |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `articleId` → `articles.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 3**: `parentId` → `article_comments.id` (self-relation `"ArticleCommentReplies"`), opsional - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Index tambahan**: `@@index([articleId])`, `@@index([userId])`, `@@index([parentId])`.

#### Relasi ke Tabel Lain (ringkasan)

`replies` (→ self, balasan-balasan komentar ini), `likes` (→
`article_comment_likes`).

#### 📌 Catatan

Beda dari `parentId` di `e_learning_discussions` yang **tidak** punya
`onDelete` eksplisit, di sini `parentId` pakai `onDelete: Cascade` -
artinya kalau sebuah komentar induk dihapus (hard delete, bukan lewat
`deletedAt`), **seluruh balasannya ikut terhapus** secara berantai.

---

### 5.117 `article_comment_likes`

**Fungsi tabel**: Like/suka user terhadap satu komentar (bukan artikel) -
pasangan `article_likes` (5.115), tapi untuk level komentar.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl7a9c7589a4d5561a81424b` | ID unik. |
| `commentId` | String | `NOT NULL`, 🔗 FK | - | `cld2a8b902d7a7a7542f27b8` | Komentar yang di-like. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User yang nge-like. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu like diberikan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `commentId` → `article_comments.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`, `onUpdate: Cascade`.
- **Constraint tambahan**: `@@unique([commentId, userId])` - satu user cuma bisa like satu komentar sekali. `@@index([commentId])`, `@@index([userId])`.

---

*(Modul **Article** sudah lengkap dengan ini - 21 tabel (5.97-5.117) dan 6
enum baru (`ArticleStatus`, `ArticleContentBlockType`,
`ArticleDividerStyle`, `ArticleLinkType`, `ArticleAdditionalContentType`,
`ArticleElementType`). Enum `AnchorPosition` dan `MediaType` dipakai ulang
dari modul E-Learning (5.47 & 5.52), tidak didefinisikan ulang di sini.)*

## Modul Pendukung (Notifikasi & Utilitas)

> ℹ️ **Catatan**: Tabel-tabel di bagian ini sifatnya **lintas-modul**
> (generik, dipakai di seluruh sistem) - berbeda dari `feedback` (5.18)
> atau `certificates` (5.17) yang walau juga "pendukung", tetap
> ditempatkan tepat setelah tabel-tabel Mentoring karena strukturnya
> menempel spesifik ke situ. Tabel di bawah ini tidak menempel ke satu
> modul tertentu, jadi ditaruh di bagian tersendiri di akhir dokumen ini.
>
> Log aktivitas user (`activity_logs`, `user_activity_logs`,
> `user_behavior`) sudah dibahas duluan di 5.3a-5.3c, tepat setelah `roles`
> - ketiganya sama-sama berputar di sekitar tabel `users`, jadi ditempatkan
> di sana, bukan di sini.

### 5.118 `export_logs`

**Fungsi tabel**: Log setiap kali admin melakukan export data dari sistem
(mis. export daftar user, project, atau sertifikat ke file).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `clc20793f949dff59345600e` | ID unik baris log. |
| `entity` | VarChar | `NOT NULL` | - | `users` | Entitas yang di-export (freetext). Contoh dari komentar developer: `users`, `projects`, `certificates`. |
| `type` | VarChar | `NOT NULL` | - | `LOGIN` | Jenis export (freetext). Contoh dari komentar developer: `all` atau `filter`. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu export dilakukan. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel log berdiri sendiri.

#### 📌 Catatan

Tidak ada kolom `userId` sama sekali di tabel ini - jadi log export tidak
mencatat *siapa* yang melakukan export, cuma *apa* yang di-export dan
*kapan*. Kalau butuh tahu siapa pelakunya,  harus dicari lewat
korelasi waktu dengan `activity_logs` (5.3a), bukan lewat relasi
langsung.

---

### 5.119 `notifications`

**Fungsi tabel**: Master data satu notifikasi yang dikirim sistem - bisa
ditujukan ke satu atau beberapa peran (`targetRole`), dengan status
baca-per-penerima dilacak di tabel terpisah (5.120).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cle1d018c6fffa95adf9aac8` | ID unik notifikasi. |
| `type` | VarChar | `NOT NULL` | - | `Info Program Baru` | Jenis notifikasi (freetext, tidak divalidasi enum). |
| `title` | VarChar | `NOT NULL` | - | `Belajar Python untuk Pemula` | Judul notifikasi. |
| `message` | String | `nullable` | - | `Hai mentor, sesi mentoring kamu akan dimulai besok. Persiapkan materi ya!` | Isi pesan notifikasi. |
| `deliveryMethod` | VarChar | `nullable` | - | `in-app` | Metode pengiriman (freetext, mis. in-app/email/push/both - tidak divalidasi enum). |
| `actionUrl` | VarChar | `nullable` | - | `https://temudataku.com/notifikasi/123` | URL tujuan kalau notifikasi diklik. |
| `sentAt` | Timestamp(6) | `nullable` | - | `2026-03-16T09:00:00Z` | Waktu notifikasi benar-benar dikirim (terpisah dari `createdAt` - bisa dibuat/dijadwalkan lebih dulu, dikirim belakangan). |
| `meta` | JsonB | `nullable` | - | `{"campaign": "ramadan2026"}` | Data tambahan bebas format (payload spesifik per jenis notifikasi). |
| `targetRole` | VarChar[] | `NOT NULL` | - | `["mentor", "admin"]` | Array peran yang dituju. Ada komentar developer `// fix this line` di kolom ini di skema aslinya -  menandakan implementasi/tipe kolom ini belum final dan masih perlu ditinjau ulang oleh tim dev. |
| `createdAt` | Timestamp(6) | `nullable` | `now()` | `2026-03-15T10:30:00Z` | Waktu baris dibuat. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - notifikasi tidak terikat ke satu entitas sumber tertentu; keterkaitannya ke entitas lain (kalau ada)  disimpan di dalam `meta` (Json) atau `actionUrl`, bukan lewat FK relasional.

#### Relasi ke Tabel Lain (ringkasan)

`recipients` (→ `notification_recipients`).

---

### 5.120 `notification_recipients`

**Fungsi tabel**: Status pengiriman & baca satu notifikasi untuk satu user
penerima - satu `Notification` bisa disebar ke banyak `NotificationRecipient`
(satu per user tujuan).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl644ada0ba9088041fcf210` | ID unik baris. |
| `notificationId` | String | `NOT NULL`, 🔗 FK | - | `clc333ed07bd42e91bc34d5a` | Notifikasi terkait. |
| `userId` | String | `NOT NULL`, 🔗 FK | - | `000001` | User penerima. |
| `isRead` | Boolean | `nullable` | `false` | `false` | Status sudah/belum dibaca. |
| `readAt` | Timestamp(6) | `nullable` | - | `2026-03-16T09:05:00Z` | Waktu dibaca. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK 1**: `notificationId` → `notifications.id` - `onDelete: Cascade`.
- 🔗 **FK 2**: `userId` → `users.id` - `onDelete: Cascade`.
- **Constraint tambahan**: `@@unique([notificationId, userId])` - satu user cuma punya satu baris status per notifikasi.

---

### 5.121 `short_links`

**Fungsi tabel**: Utilitas pemendek URL (URL shortener) internal - dipakai
untuk berbagi tautan panjang (mis. link sertifikat, link undangan booking)
dalam bentuk kode pendek.

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (cuid) | 🔑 PK, `NOT NULL` | `cuid()` | `cl996b649acae878692e250c` | ID unik. |
| `shortCode` | String | `NOT NULL`, `@unique` | - | `abc123` | Kode pendek unik (bagian akhir URL pendek). |
| `originalUrl` | VarChar | `NOT NULL` | - | `https://temudataku.com/artikel/belajar-python-untuk-pemula-panjang-sekali` | URL asli/tujuan. |
| `createdById` | String | `nullable`, 🔗 FK | - | `000016` | User pembuat link (opsional). |
| `expiresAt` | DateTime | `nullable` | - | `2026-12-31T23:59:59Z` | Waktu kedaluwarsa link (kosong = tidak pernah kedaluwarsa). |
| `clickCount` | Int | `NOT NULL` | `0` | `42` | Jumlah klik link ini (dinaikkan setiap kali diakses). |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | `false` = link dinonaktifkan manual sebelum kedaluwarsa alami. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `nullable` | - | `2026-03-16T08:00:00Z` | Manual, tidak `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `createdById` → `users.id` (relasi `"UserShortLinks"`), opsional - `onDelete: SetNull` (user dihapus → link tetap ada, cuma `createdById` jadi `NULL`), `onUpdate: Cascade`.

#### 📌 Catatan

`clickCount` disimpan sebagai counter tunggal (bukan tabel log per-klik
terpisah) - jadi tidak ada riwayat *kapan* atau *dari mana* tiap klik
terjadi, cuma totalnya saja. Kalau butuh analitik klik yang lebih rinci
(waktu, IP, dsb.), perlu tabel tambahan yang belum ada di skema ini.

---

## Modul: Job Board *(Dummy)*

> ℹ️ **Catatan**: Sesuai komentar `// WEBSITE DUMMY` langsung di atas model
> `Company` pada skema aslinya, dua tabel ini  besar adalah
> **data contoh/placeholder** untuk fitur lowongan kerja - tidak
> berhubungan dengan modul-modul inti TemuDataku, tapi digunakan untuk penugasan
### 5.122 `companies`

**Fungsi tabel**: Master data perusahaan - induk dari lowongan kerja
(`jobs`, 5.123).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (uuid) | 🔑 PK, `NOT NULL` | `uuid()` | `28c3da27-9c8e-b20e-d2f9-86f93499dca9` | ID unik perusahaan. **Satu-satunya tabel di seluruh skema yang PK-nya pakai `uuid()`**, bukan `cuid()` seperti semua tabel lain - konsisten dengan sifatnya sebagai modul terpisah/dummy yang  dibangun terpisah dari basis kode utama. |
| `companyName` | String | `NOT NULL`, `@unique` | - | `PT Teknologi Nusantara` | Nama perusahaan. |
| `industry` | String | `nullable` | - | `Teknologi Informasi` | Bidang industri. |
| `companySize` | String | `nullable` | - | `51-200 karyawan` | Ukuran perusahaan (freetext). |
| `website` | String | `nullable` | - | `https://ptteknologinusantara.co.id` | Website perusahaan. |
| `logoUrl` | String | `nullable` | - | `https://cdn.temudataku.com/logo/ptn.png` | URL logo. |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi perusahaan. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: *(tidak ada)* - tabel master.

#### Relasi ke Tabel Lain (ringkasan)

`jobs` (→ `jobs`).

---

### 5.123 `jobs`

**Fungsi tabel**: Lowongan kerja yang dibuka oleh satu perusahaan (5.125).

#### Kolom

| Kolom | Tipe Data | Constraint | Default | Contoh Value | Keterangan |
|---|---|---|---|---|---|
| `id` | String (uuid) | 🔑 PK, `NOT NULL` | `uuid()` | `075cc920-9553-ee21-07c3-f46bf648a8c8` | ID unik lowongan. |
| `companyId` | String | `NOT NULL`, 🔗 FK | - | `1317ed29-539b-82da-bc58-47fb2ffc528d` | Perusahaan pembuka lowongan. |
| `jobTitle` | String | `NOT NULL` | - | `Data Analyst` | Judul posisi. |
| `salaryMin` | Int | `nullable` | - | `8000000` | Gaji minimum yang ditawarkan. |
| `salaryMax` | Int | `nullable` | - | `15000000` | Gaji maksimum yang ditawarkan. |
| `city` | String | `nullable` | - | `Surabaya` | Kota penempatan. |
| `country` | String | `nullable` | - | `Indonesia` | Negara penempatan. |
| `workType` | String | `nullable` | - | `remote` | Tipe kerja (freetext, mis. remote/onsite/hybrid). |
| `level` | String | `nullable` | - | `2` | Level posisi (freetext, mis. junior/senior). |
| `experienceRequired` | String | `nullable` | - | `1-3 tahun` | Pengalaman yang dibutuhkan (freetext). |
| `description` | String | `nullable` | - | `Deskripsi singkat mengenai konten ini.` | Deskripsi pekerjaan. |
| `requirements` | String | `nullable` | - | `Menguasai Python dasar` | Persyaratan pelamar. |
| `isActive` | Boolean | `NOT NULL` | `true` | `true` | `false` = lowongan ditutup/tidak ditampilkan. |
| `createdAt` | DateTime | `NOT NULL` | `now()` | `2026-03-15T10:30:00Z` | Waktu dibuat. |
| `updatedAt` | DateTime | `NOT NULL` | *(auto)* | `2026-03-16T08:00:00Z` | Pakai `@updatedAt`. |

#### Primary Key & Foreign Key

- 🔑 **PK**: `id`
- 🔗 **FK**: `companyId` → `companies.id` - `onDelete: Cascade`.
- **Index tambahan**: `@@index([city])`, `@@index([country])`, `@@index([level])`.

---
## 6. Penutup & Catatan Pemeliharaan

Dokumen ini disusun bertahap, modul per modul, mengikuti urutan skema yang
memang dikembangkan bertahap juga - jadi urutan modul di sini tidak selalu
sama dengan urutan "kepentingan" fitur di aplikasi, cuma urutan
pendokumentasiannya. Kalau ada tabel baru atau kolom yang berubah di
`schema.prisma`, cara paling gampang menjaga dokumen ini tetap akurat:

- Tabel yang menempel jelas ke satu modul yang sudah ada (mis. kolom baru
  di `ELearningQuiz`, atau tabel baru turunan `MentoringService`) -
  update/tambahkan section-nya **di lokasi modul terkait**, bukan asal
  ditumpuk di paling bawah. Nomor section baru tinggal disisipkan dengan
  angka desimal tambahan kalau perlu (mis. `5.13a`) supaya tidak perlu
  menomori ulang seluruh dokumen setelahnya.
- Tabel yang sifatnya lintas-modul/generik (log, notifikasi, utilitas) -
  masuk ke bagian **Modul Pendukung** di akhir bagian 5, sesuai pola yang
  sudah dipakai untuk `notifications`, `activity_logs`, dsb.
- Perubahan `onDelete`/`onUpdate`, constraint unik, atau enum yang sudah
  didokumentasikan - cukup edit baris yang relevan, tidak perlu menulis
  ulang seluruh section tabelnya.

Beberapa hal yang sempat kecatat selama proses dokumentasi dan masih
relevan untuk ditindaklanjuti tim, bukan cuma catatan sepintas:

- Beberapa kolom status masih freetext `String`/`VarChar` alih-alih enum
  (mis. `payments.status`, `practice_submissions.status`,
  `e_learning_subscriptions.status`) - nilai yang valid cuma hidup di
  komentar developer atau kode aplikasi, tidak ditegakkan database. Kalau
  suatu saat ada waktu untuk refactor, ini kandidat pertama.
- `notifications.targetRole` masih ada catatan `// fix this line` dari
  developer di skema aslinya - belum final.
- Tiga tabel log aktivitas (`activity_logs`, `user_activity_logs`,
  `user_behavior`, semua di bagian Modul Pendukung) tumpang tindih dan
  tidak saling terhubung - perlu diperjelas mana yang jadi sumber
  kebenaran sebelum dipakai buat dashboard analitik apa pun.
- `companies`/`jobs` (Job Board)  besar cuma data dummy, bukan
  fitur yang sedang berjalan - jangan kaget kalau suatu saat dihapus atau
  malah dibangun serius jadi fitur beneran.

Dokumen ini tidak mencakup hal-hal di luar apa yang tertulis di
`schema.prisma` - trigger, view, stored procedure, atau kebijakan RLS di
level PostgreSQL (kalau ada) berada di luar cakupan, karena tidak
terrepresentasi di Prisma schema.

Terakhir diperbarui mengikuti `schema.prisma` per dokumentasi tabel
`5.123 jobs` - total **126 tabel** dan **24 enum**.