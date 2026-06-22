# 🏗️ ARSITEKTUR SISTEM — Gotong Royong PWA

**Standar:** C4 Model (Context → Container → Component → Code)
**Tujuan:** Menjembatani visi atasan (SuperApp enterprise) dengan realitas implementasi v1
**Status:** 22 Jun 2026 — v1 aktif, biaya operasional $0/bulan

---

## LEVEL 0 — VISI ARSITEKTUR (ATASAN)

Diagram ini adalah **visi 5 tahun** yang atasan ingin tuju. Semua item ditandai status
realitas kita saat ini.

```mermaid
flowchart TD
    subgraph CLIENT["CLIENT LAYER"]
        A[Mobile App<br/>Flutter]
        B[Web App<br/>PWA]
        C[Admin Panel]
    end

    subgraph GATEWAY["API GATEWAY"]
        D[API Gateway<br/>Kong / Cloudflare]
    end

    subgraph SERVICES["MICROSERVICES"]
        M1[Auth Service<br/>Register, Login, OTP, Profile]
        M2[Community Service<br/>Masjid, Gereja, RT/RW, Event]
        M3[Donation Service<br/>QRIS, Verifikasi, Status]
        M4[Point & Voucher Service<br/>Karma, Reward, Redeem]
        M5[Admin Service<br/>Dashboard, Approval, Audit]
        M6[AI Service<br/>Recommendation, Fraud, Early Warning]
        M7[Disaster Service<br/>Lapor, Relawan, BMKG]
        M8[Social Service<br/>Panti, Yatim, Bansos]
    end

    subgraph EVENT_BUS["EVENT BUS"]
        K[Kafka / N8N]
    end

    subgraph EXTERNAL["EXTERNAL INTEGRATION"]
        T[Twilio OTP]
        Q[BI SNAP / QRIS]
        BM[BMKG]
        DS[Dinas Sosial]
    end

    A --> D
    B --> D
    C --> D

    D --> M1
    D --> M2
    D --> M3
    D --> M4
    D --> M5
    D --> M6
    D --> M7
    D --> M8

    M3 --> K
    M7 --> K
    M4 --> K
    K --> M2
    K --> M4
    K --> M5

    M1 --> T
    M3 --> Q
    M7 --> BM
    M8 --> DS

    %% Status overlay
    style A fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style C fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style D fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M1 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M3 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M4 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M5 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M6 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M7 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style M8 fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style K fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style T fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style Q fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style BM fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5
    style DS fill:#f0f0f0,stroke:#999,stroke-dasharray: 5 5

    style M2 fill:#bbf7d0,stroke:#16a34a,stroke-width:3px
    style B fill:#bbf7d0,stroke:#16a34a,stroke-width:3px
```

**Legenda:**
- 🟩 **Hijau tebal** = sudah diimplementasikan di v1 (Community Service, Web App/PWA)
- ⬜ **Abu-abu putus-putus** = visi atasan, belum/tidak dibangun di v1 karena alasan biaya/scope

---

## LEVEL 1 — SYSTEM CONTEXT DIAGRAM

Apa yang user lihat dan sistem external yang terlibat.

```mermaid
flowchart LR
    subgraph USERS["PENGGUNA"]
        U1[Warga Komunitas<br/>RT / RW / Masjid]
        U2[Pengurus / DKM<br/>Admin Komunitas]
        U3[Pengunjung<br/>Belum Login]
    end

    subgraph PLATFORM["PLATFORM GOTONG ROYONG"]
        PWA[PWA Web App<br/>installable di HP]
    end

    subgraph EXTERNAL_SERVICES["LAYANAN EKSTERNAL"]
        A1[Aladhan API<br/>Jadwal Sholat<br/>Kemenag RI]
        A2[Supabase<br/>Auth + DB + Storage]
        A3[Cloudflare<br/>Workers + CDN]
        A4[Email Provider<br/>Magic Link Login]
    end

    U1 --> PWA
    U2 --> PWA
    U3 --> PWA

    PWA --> A1
    PWA --> A2
    PWA --> A3
    PWA --> A4

    style A1 fill:#dbeafe,stroke:#2563eb
    style A2 fill:#dbeafe,stroke:#2563eb
    style A3 fill:#dbeafe,stroke:#2563eb
    style A4 fill:#dbeafe,stroke:#2563eb
```

**Catatan Context:**
- Tidak ada API Gateway terpisah — Next.js Server Actions + Supabase langsung
- Tidak ada Twilio — pakai magic link email (gratis)
- Tidak ada BI SNAP/QRIS — donasi via transfer manual + foto bukti
- Tidak ada BMKG/DINSOS — fitur kebencanaan & sosial diparkir ke Fase 3+

---

## LEVEL 2 — CONTAINER DIAGRAM

Arsitektur teknis implementasi v1.

```mermaid
flowchart TB
    subgraph CLIENT["CLIENT — PWA (Browser/HP)"]
        SW[Service Worker<br/>Serwist]
        IDB[IndexedDB<br/>Antrian Offline]
        APP[Next.js App<br/>RSC + Server Actions]
        PWA_CACHE[Cache Storage<br/>Precache 39 URL]
    end

    subgraph CLOUD["CLOUD — Cloudflare Workers"]
        WORKER[Next.js Server<br/>OpenNext]
        STATIC[Static Assets<br/>_next/static, public/]
        PROXY[proxy.ts<br/>Refresh Sesi Supabase]
    end

    subgraph SUPABASE["SUPABASE — Backend Serverless"]
        AUTH[Auth<br/>Email Magic Link]
        PG[Postgres + RLS<br/>21 tabel · 54 policy]
        STORAGE[Storage<br/>4 bucket · publik/privat]
    end

    subgraph EXTERNAL["LAYANAN EKSTERNAL"]
        ALADHAN[Aladhan API<br/>Jadwal Sholat]
        EMAIL[Resend<br/>Email Transaksional]
    end

    %% Connections
    APP -- HTTP/2 --> WORKER
    APP -- manifest + SW --> SW
    SW -- precache + runtime --> PWA_CACHE
    IDB -- queue pending --> APP

    WORKER -- SQL via RLS --> PG
    WORKER -- JWT Auth --> AUTH
    WORKER -- Upload/Read --> STORAGE

    APP -- Fetch API --> ALADHAN
    AUTH -- Email --> EMAIL

    style SW fill:#fef3c7,stroke:#d97706
    style IDB fill:#fef3c7,stroke:#d97706
    style WORKER fill:#dbeafe,stroke:#2563eb
    style PROXY fill:#dbeafe,stroke:#2563eb
    style STATIC fill:#dbeafe,stroke:#2563eb
    style AUTH fill:#bbf7d0,stroke:#16a34a
    style PG fill:#bbf7d0,stroke:#16a34a
    style STORAGE fill:#bbf7d0,stroke:#16a34a
```

### Detail Container

| Container | Teknologi | Fungsi |
|---|---|---|
| **Next.js App** | React 19 + Server Components | UI + Server Actions + data fetching |
| **Service Worker** | Serwist | Offline cache, navigation preload |
| **IndexedDB** | idb library | Antrian aksi saat offline |
| **Next.js Server** | OpenNext + Cloudflare Workers | Server-side rendering + Server Actions |
| **proxy.ts** | Next 16 middleware pattern | Refresh cookie sesi Supabase |
| **Postgres** | Supabase + RLS | 21 tabel, semua akses lewat RLS |
| **Auth** | Supabase Auth | Email magic link, sesi JWT |
| **Storage** | Supabase Storage | 4 bucket: publik & privat |

---

## LEVEL 3 — COMPONENT / SERVICE DIAGRAM

Domain bisnis di dalam monolith.

```mermaid
flowchart TB
    subgraph MONOLITH["NEXT.JS MONOLITH (Cloudflare Workers)"]
        direction TB

        subgraph APP_ROUTES["APP ROUTES"]
            BERANDA["/ — Beranda<br/>Kas, Sholat, Kegiatan"]
            AUTH_PAGES["/masuk, /onboarding<br/>Auth Flow"]
            KOMUNITAS["/komunitas, /kegiatan<br/>Feed + Event"]
            DONASI["/donasi, /laporan-kas<br/>Donasi + Kas"]
            AKSI["/lapor, /polling, /pengumuman<br/>Buat Aksi"]
            PROFIL["/profil, /pesan<br/>Profile + Notifikasi"]
            PUBLIK["/k/[slug]<br/>Halaman Publik"]
        end

        subgraph ACTIONS["SERVER ACTIONS"]
            SA_AUTH[Auth Actions<br/>signIn, signOut]
            SA_POST[Post Actions<br/>buatPost, like, komentar]
            SA_KAS[Kas Actions<br/>catatKas]
            SA_DONASI[Donasi Actions<br/>buatDonasi, verifikasi]
            SA_EVENT[Event Actions<br/>buatKegiatan, RSVP]
            SA_POLL[Poll Actions<br/>buatPolling, vote]
            SA_LAPOR[Lapor Actions<br/>buatLapor]
        end

        subgraph LIB["LIBRARY LAYER"]
            L_AUTH[lib/auth.ts<br/>getUser, getActiveCommunity]
            L_SUPABASE[lib/supabase/<br/>server.ts + client.ts]
            L_KAS[lib/kas.ts<br/>getKasSummary]
            L_POSTS[lib/posts.ts<br/>getFeed]
            L_PRAYER[lib/prayer.ts<br/>Aladhan API]
            L_STORAGE[lib/storage.ts<br/>Upload + Signed URL]
            L_IDB[lib/idb.ts<br/>Offline Queue]
        end
    end

    subgraph DB_LAYER["DATABASE LAYER (Supabase)"]
        TB_AUTH[Tabel Auth<br/>profiles, user_devices]
        TB_KOMUNITAS[Tabel Komunitas<br/>communities, members]
        TB_FEED[Tabel Feed<br/>posts, comments, reactions]
        TB_DONASI[Tabel Donasi<br/>donations, kas_entries]
        TB_EVENT[Tabel Event<br/>events, event_rsvp]
        TB_AKSI[Tabel Aksi<br/>reports, polls, votes]
        TB_NOTIF[Tabel Notifikasi<br/>notifications]
    end

    %% Routes ke Actions
    BERANDA --> SA_KAS
    BERANDA --> SA_EVENT
    KOMUNITAS --> SA_POST
    DONASI --> SA_DONASI
    AKSI --> SA_POLL
    AKSI --> SA_LAPOR
    AUTH_PAGES --> SA_AUTH
    PROFIL --> SA_AUTH

    %% Actions ke Lib
    SA_KAS --> L_KAS
    SA_POST --> L_POSTS
    SA_DONASI --> L_STORAGE
    SA_EVENT --> L_SUPABASE

    %% Lib ke DB
    L_KAS --> TB_KAS
    L_POSTS --> TB_FEED
    L_AUTH --> TB_AUTH
    L_STORAGE --> TB_DONASI

    style MONOLITH fill:#f0f9ff,stroke:#2563eb,stroke-width:2px
    style DB_LAYER fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
```

### Domain Map — Visi Atasan vs Implementasi Kita

| Domain Atasan | Implementasi Kita | Keterangan |
|---|---|---|
| **Auth Service** (M1) | `actions/auth.ts`, `lib/auth.ts`, `profil/` | ✅ Login magic link (bukan OTP Twilio) |
| **Community Service** (M2) | `actions/community.ts`, `actions/events.ts`, `/kegiatan/` | ✅ RSVP, member, event |
| **Donation Service** (M3) | `actions/donations.ts`, `actions/kas.ts`, `/donasi/` | ✅ Manual + bukti foto (bukan QRIS) |
| **Point & Voucher** (M4) | — | ❌ Parkir Fase 2 (ROADMAP) |
| **Admin Service** (M5) | Admin fitur menyatu di PWA | ⚠️ Dashboard khusus `/admin` rencana P5 |
| **AI Service** (M6) | — | ❌ Butuh budget GPU/API |
| **Disaster Service** (M7) | `actions/reports.ts`, `/lapor/` (terbatas) | ⚠️ Hanya lapor RT/RW, belum BMKG |
| **Social Service** (M8) | — | ❌ Parkir Fase 3+ |

---

## LEVEL 4 — EVENT FLOW DIAGRAM

Walaupun teknisnya menggunakan **Postgres trigger + notifikasi** (bukan Kafka),
kita dokumentasikan dengan nama event standar seperti arsitektur event-driven.

```mermaid
flowchart LR
    subgraph PRODUCERS["EVENT PRODUCERS"]
        P_DONASI[Donasi<br/>donation.submitted<br/>donation.verified]
        P_EVENT[Event<br/>event.rsvp<br/>event.completed]
        P_POST[Post<br/>post.created<br/>post.reacted]
        P_LAPOR[Laporan<br/>report.submitted<br/>report.status_changed]
        P_PENGUMUMAN[Pengumuman<br/>announcement.published]
    end

    subgraph CHANNEL["EVENT CHANNEL<br/>(Postgres Trigger + Notifikasi)"]
        TRIGGER[Trigger AFTER INSERT/UPDATE<br/>pg_notify + tabel notifications]
    end

    subgraph CONSUMERS["EVENT CONSUMERS"]
        C_NOTIF[Notification Service<br/>Notifikasi in-app]
        C_EMAIL[Email Service<br/>Resend]
        C_KAS[Kas Service<br/>auto kas_entry]
    end

    P_DONASI --> TRIGGER
    P_EVENT --> TRIGGER
    P_POST --> TRIGGER
    P_LAPOR --> TRIGGER
    P_PENGUMUMAN --> TRIGGER

    TRIGGER --> C_NOTIF
    TRIGGER --> C_EMAIL
    TRIGGER --> C_KAS

    style TRIGGER fill:#fef3c7,stroke:#d97706,stroke-width:2px
```

### Event Catalog Lengkap

| Event | Producer | Consumer | Trigger Source | Status |
|---|---|---|---|---|
| `post.created` | Post Action | Notif (anggota lain) | `0004` ✅ | Live |
| `post.reacted` | Post Action | Notif (penulis post) | `0004` ✅ | Live |
| `announcement.published` | Pengumuman Action | Notif (anggota lain) | `0004` ✅ | Live |
| `report.submitted` | Lapor Action | Notif (pengurus) | `0004` ✅ | Live |
| `report.status_changed` | Lapor Action | Notif (pelapor) | `0004` ✅ | Live |
| `donation.verified` | Donasi Action | Notif + auto kas_entry | `0006` ✅ | Live |
| `donation.submitted` | Donasi Action | Notif (pengurus) | `0006` ✅ | Live |
| `event.rsvp` | Event Action | — | 🔜 trigger baru | Planned |
| `event.completed` | Cron/Scheduler | — | 🔜 | Parkir |

### Perbandingan: Postgres Trigger vs Kafka

| Aspek | Kafka (Visi Atasan) | Postgres Trigger (Kita) |
|---|---|---|
| Biaya | $30-100+/bln (cluster) | **$0** (built-in Supabase) |
| Kompleksitas | Butuh运维 + monitoring | ✅ Satu setup, auto jalan |
| Skalabilitas | Jutaan event/detik | ✅ Cukup untuk puluhan ribu user |
| Durability | Disk + replikasi | ✅ Dalam transaksi yang sama |
| Observability | Kafka UI + metrics | ⚠️ Terbatas (bisa ditambah logging) |
| Multi-service | ✅ Wajib untuk microservices | ⚠️ Monolith tidak butuh |

**Keputusan:** Postgres trigger benar untuk v1. Migrasi ke Kafka hanya jika:
(1) monolith dipecah jadi microservices, ATAU (2) volume event > 10.000/hari.

---

## LEVEL 5 — DATABASE ERD

21 tabel dikelompokkan per domain visual.
Detail kolom di `src/db/schema.ts`.

```mermaid
erDiagram
    %% AUTH DOMAIN
    profiles {
        uuid id PK
        text full_name
        text phone
        text avatar_url
        timestamptz created_at
    }

    user_devices {
        uuid id PK
        uuid user_id FK
        text device_name
        text push_token
    }

    %% COMMUNITY DOMAIN
    communities {
        uuid id PK
        text name
        text slug UK
        text description
        text type
        text address
        jsonb metadata
    }

    memberships {
        uuid id PK
        uuid community_id FK
        uuid user_id FK
        text role
        text status
    }

    contacts {
        uuid id PK
        uuid community_id FK
        text label
        text value
    }

    %% EVENT DOMAIN
    events {
        uuid id PK
        uuid community_id FK
        text title
        text description
        timestamptz event_date
        text location
        text event_type
    }

    event_rsvp {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        text status
    }

    %% DONATION DOMAIN
    donations {
        uuid id PK
        uuid community_id FK
        uuid user_id FK
        bigint amount
        text proof_url
        text status
        uuid verified_by FK
    }

    kas_entries {
        uuid id PK
        uuid community_id FK
        text description
        bigint amount
        text type
        text hash_self
        text hash_prev
    }

    %% FEED DOMAIN
    announcements {
        uuid id PK
        uuid community_id FK
        uuid author_id FK
        text title
        text content
        boolean is_pinned
    }

    posts {
        uuid id PK
        uuid community_id FK
        uuid author_id FK
        text content
        text image_url
    }

    post_reactions {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text emoji
    }

    post_comments {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        text content
    }

    %% REPORT DOMAIN
    reports {
        uuid id PK
        uuid community_id FK
        uuid user_id FK
        text title
        text description
        text image_url
        text latitude
        text longitude
        text status
    }

    %% POLL DOMAIN
    polls {
        uuid id PK
        uuid community_id FK
        uuid creator_id FK
        text question
        timestamptz expires_at
    }

    poll_options {
        uuid id PK
        uuid poll_id FK
        text label
    }

    poll_votes {
        uuid id PK
        uuid option_id FK
        uuid user_id FK
    }

    %% NOTIFICATION DOMAIN
    notifications {
        uuid id PK
        uuid user_id FK
        text title
        text body
        text link
        boolean dibaca
    }

    push_subscriptions {
        uuid id PK
        uuid user_id FK
        text endpoint
        jsonb keys
    }

    audit_log {
        uuid id PK
        uuid table_id
        text table_name
        text operation
        jsonb old_data
        jsonb new_data
    }

    %% IBADAH DOMAIN
    mutabaah_items {
        uuid id PK
        text name
        text icon
    }

    mutabaah_logs {
        uuid id PK
        uuid user_id FK
        uuid item_id FK
        date log_date
        boolean done
    }

    %% RELATIONS
    profiles ||--o{ user_devices : "has"
    profiles ||--o{ memberships : "has"
    communities ||--o{ memberships : "has"
    communities ||--o{ contacts : "has"
    communities ||--o{ events : "has"
    communities ||--o{ donations : "has"
    communities ||--o{ kas_entries : "has"
    communities ||--o{ announcements : "has"
    communities ||--o{ posts : "has"
    communities ||--o{ reports : "has"
    communities ||--o{ polls : "has"
    events ||--o{ event_rsvp : "has"
    posts ||--o{ post_reactions : "has"
    posts ||--o{ post_comments : "has"
    polls ||--o{ poll_options : "has"
    poll_options ||--o{ poll_votes : "has"
    profiles ||--o{ notifications : "receives"
    profiles ||--o{ mutabaah_logs : "logs"
    mutabaah_items ||--o{ mutabaah_logs : "tracked_by"
```

### Domain Clusters

| Cluster | Tabel | Keterangan |
|---|---|---|
| **Auth** | `profiles`, `user_devices` | Identitas & perangkat |
| **Community** | `communities`, `memberships`, `contacts` | Multi-tenant utama |
| **Event** | `events`, `event_rsvp` | Kegiatan & kehadiran |
| **Donation** | `donations`, `kas_entries` | Transparansi keuangan |
| **Feed** | `announcements`, `posts`, `post_reactions`, `post_comments` | Konten komunitas |
| **Report** | `reports` | Laporan RT/RW |
| **Poll** | `polls`, `poll_options`, `poll_votes` | Voting |
| **Notification** | `notifications`, `push_subscriptions` | Notifikasi in-app |
| **Audit** | `audit_log` | Riwayat perubahan |
| **Ibadah** | `mutabaah_items`, `mutabaah_logs` | Tracking ibadah harian |

**Catatan:** Semua tabel data punya kolom `community_id` untuk isolasi multi-tenant.
RLS (Row Level Security) aktif di 21/21 tabel — lihat `src/db/migrations/0001_auth_and_rls.sql`.

---

## ALUR END-TO-END UTAMA

### Alur Donasi (yang sudah jalan)

```mermaid
sequenceDiagram
    participant User as Warga
    participant PWA as PWA App
    participant SA as Server Action
    participant DB as Supabase
    participant Notif as Notifikasi

    User->>PWA: Klik "Donasi"
    PWA->>User: Form nominal + upload bukti
    User->>PWA: Isi nominal, upload foto bukti transfer
    PWA->>SA: buatDonasi(data)
    SA->>DB: INSERT donations (status=PENDING)
    DB-->>SA: ✅ sukses
    SA->>Notif: Notif ke pengurus "Donasi baru perlu verifikasi"
    PWA->>User: "Donasi tercatat, menunggu verifikasi"

    Note over User,Notif: Pengurus verifikasi

    User->>PWA: Login sebagai Pengurus
    PWA->>SA: verifikasiDonasi(id)
    SA->>DB: UPDATE donations (status=VERIFIED)
    DB->>DB: INSERT kas_entries (auto via trigger 0006)
    SA->>Notif: Notif ke warga "Donasi diverifikasi"
    PWA->>User: ✅ Saldo kas bertambah
```

### Alur Kegiatan + RSVP (yang sudah jalan)

```mermaid
sequenceDiagram
    participant Pengurus as Pengurus
    participant PWA as PWA App
    participant SA as Server Action
    participant DB as Supabase

    Pengurus->>PWA: Buka /kegiatan/baru
    PWA->>Pengurus: Form kegiatan
    Pengurus->>PWA: Isi judul, jenis, waktu WIB, lokasi
    PWA->>SA: buatKegiatan(data)
    SA->>DB: INSERT events
    DB-->>SA: ✅ sukses
    PWA->>Pengurus: Redirect ke /kegiatan

    Note over Pengurus,DB: Warga melihat & RSVP

    Warga->>PWA: Buka /kegiatan
    PWA->>Warga: Daftar kegiatan + tombol "Saya Hadir"
    Warga->>PWA: Klik "Saya Hadir"
    PWA->>SA: toggleRsvp(eventId)
    SA->>DB: INSERT event_rsvp (status=HADIR)
    DB-->>SA: ✅
    PWA->>Warga: ✅ "1 hadir" / klik lagi → batal
```

### Alur Polling (yang sudah jalan)

```mermaid
sequenceDiagram
    participant Pengurus as Pengurus
    participant PWA as PWA App
    participant SA as Server Action
    participant DB as Supabase

    Pengurus->>PWA: /polling/baru
    PWA->>Pengurus: Form polling + opsi dinamis
    Pengurus->>PWA: Pertanyaan + 3 opsi + batas waktu
    PWA->>SA: buatPolling(data)
    SA->>DB: INSERT polls + poll_options
    DB-->>SA: ✅
    PWA->>Pengurus: Redirect ke /polling

    Warga->>PWA: /polling, klik opsi 1
    PWA->>SA: vote(optionId)
    SA->>DB: INSERT poll_votes (1x/user)
    DB-->>SA: ✅
    PWA->>Warga: ✅ "100% · 1 suara"
    Warga->>PWA: klik opsi lain → ditolak
```

---

## DEPLOYMENT ARCHITECTURE

```mermaid
flowchart LR
    subgraph DEV["DEVELOPMENT"]
        LOCAL[localhost:6789<br/>npm run dev]
        SUPADEV[Supabase Project<br/>nqlazrjcywyltewsxgmx<br/>Singapore]
    end

    subgraph CI["CI/CD"]
        GH[GitHub<br/>backendgr02-wim/gotong-royong-pwa]
    end

    subgraph PROD["PRODUCTION — Cloudflare Workers"]
        WORKER[Next.js Worker<br/>Server + API]
        STATIC[Static Assets<br/>CDN Cache]
        ENV[Environment Variables<br/>Supabase keys + secrets]
    end

    subgraph EXTERNAL_PROD["EXTERNAL PRODUCTION"]
        SUPAPROD[Supabase Production<br/>Auth + DB + Storage]
        ALADHAN[Aladhan API<br/>Jadwal Sholat]
    end

    LOCAL --> SUPADEV
    GH --> |git push| WORKER
    WORKER --> SUPAPROD
    WORKER --> ALADHAN
    WORKER --> STATIC

    style DEV fill:#fef3c7,stroke:#d97706
    style CI fill:#dbeafe,stroke:#2563eb
    style PROD fill:#f0fdf4,stroke:#16a34a
```

**Catatan Deployment:**
- **Vercel Hobby melanggar ToS untuk komersial** → kita pakai Cloudflare Workers (legal, gratis)
- **OpenNext** (`@opennextjs/cloudflare`) sebagai adapter Next.js → Workers
- **Supabase Production** = project yang sama (tidak ada separation dev/prod di free tier)
- **Keep-alive** diperlukan karena Supabase free "tidur" setelah 7 hari tidak aktif

---

## PERBANDINGAN: VISI ATASAN vs IMPLEMENTASI KITA

| Lapisan | Visi Atasan (Enterprise) | Implementasi Kita (v1) | Selisih |
|---|---|---|---|
| **Client** | Flutter + Web + Admin | **PWA saja** (installable) | Flutter = produk baru |
| **Gateway** | Kong/Cloudflare | **Next.js langsung** | Tidak perlu untuk monolith |
| **Auth** | Twilio OTP | **Magic link email (gratis)** | $0 vs $20-50/bln |
| **Payment** | QRIS/BI SNAP | **Transfer manual + foto** | Tanpa lisensi OJK |
| **AI** | Recommendation + Fraud | **Belum ada** | Butuh budget GPU |
| **Event Bus** | Kafka cluster | **Postgres trigger** | $0 vs $30-100+/bln |
| **Database** | 8 DB terpisah | **1 Supabase Postgres** | Cukup untuk 100rb user |
| **Deploy** | K8s cluster | **Cloudflare Workers** | $0 vs $50-200+/bln |
| **Biaya/bln** | $200-1000+ | **$0** | Klien cuma bayar domain |

---

## CARA MEMBACA DOKUMEN INI

1. **Atasan/Investor** → Mulai dari Level 0 (Visi) + Level 1 (Context)
2. **Developer** → Level 2 (Container) + Level 4 (Event Flow) + ERD
3. **DevOps** → Level 2 (Deployment) + Catatan Infrastruktur

---

## REFERENSI

- Kode: `src/db/schema.ts` (definisi tabel Drizzle), `src/db/migrations/` (SQL + RLS)
- Dokumentasi: `docs/PRD.md`, `docs/RENCANA_DATA.md`, `docs/DESIGN.md`, `docs/ROADMAP.md`
- Perbandingan visi: `docs/RESPON_ATASAN.md`
- Tracking: `docs/PERENCANAAN_V1.md`
- Aturan proyek: `AGENTS.md`

---

*Dokumen arsitektur C4 — 22 Jun 2026. Diagram Mermaid bisa di-import ke Excalidraw.*
