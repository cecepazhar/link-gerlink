# Gerlink Drive Hub

Kumpulan link repositori dokumen dan tautan internal RND Gerlink.

## Persiapan Pengembangan (Local Dev)

### 1. Setup Domain Local (`drivegerlink.test`)
Tambahkan baris berikut ke file `/etc/hosts` Anda (butuh akses sudo/root):
```sh
echo "127.0.0.1 drivegerlink.test" | sudo tee -a /etc/hosts
```

### 2. Konfigurasi Environment (.env)
Salin contoh environment:
```sh
cp .env.example .env
```
Variabel default:
- `PUBLIC_PIN`: `gerlinkjuara` (PIN untuk membuka halaman utama)
- `ADMIN_PIN`: `123456` (PIN untuk halaman `/admin`)
- `TURSO_DATABASE_URL`: `file:local.db` (database lokal SQLite) atau URL database Turso

### 3. Instalasi Dependensi (menggunakan pnpm)
```sh
pnpm install
```

### 4. Menjalankan Server Pengembangan
```sh
pnpm dev
```
Buka browser di: [http://drivegerlink.test:5173](http://drivegerlink.test:5173)

### 5. Build & Typecheck
```sh
# Typecheck
pnpm check

# Build produksi
pnpm build

# Preview build
pnpm preview
```
