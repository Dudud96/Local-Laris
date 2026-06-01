# Local Laris - Marketplace UMKM Brebes

## Konsep Aplikasi
Local Laris adalah platform marketplace modern khusus UMKM Kabupaten Brebes yang membantu pelaku usaha lokal menjual produk secara online. Di desain dengan arsitektur modern yang ringan dan cepat untuk perangkat mobile.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, React Router DOM, React Hook Form
- **Backend & Database**: Express.js, Firebase Firestore (Production-ready ABAC rules)
- **Auth**: Firebase Authentication (Role-based: Buyer, Seller, Admin)

## Arsitektur & Deployment Guide
1. **Setup Environment**:
   Platform sudah menginjeksi Firebase secara server-side dan client-side via `firebase-applet-config.json`.
2. **Setup Script**:
   Jalankan `npm install`, lalu `npm run dev` untuk local development.
3. **Deployment**:
   Gunakan `npm run build` yang mana mengkompilasi file statis React, serta melakukan bundling server menggunakan ESBuild menuju `dist/server.cjs`.

## Flow Transaksi
1. Pembeli memilih produk `(Products/ProductDetail)` -> menambah ke keranjang `(Cart)`
2. Checkout mengelompokkan pesanan per-toko dan menyimpan ke `orders` dengan status `menunggu_pembayaran`.
3. Pembeli melakukan upload bukti manual.
4. Seller/Admin menerima notifikasi, mengubah status pesanan dari `menunggu_pembayaran` -> `diproses` -> `dikirim`.
5. Transaksi selesai.

## Struktur Database Firestore (ERD Konseptual)
- **`users`**: `{ uid (PK), name, email, role, createdAt, updatedAt }`
- **`stores`**: `{ storeId (PK/uid), ownerId, storeName, description, isVerified, status }`
- **`products`**: `{ productId, ownerId, storeId, name, price, stock, description, category, images[], status }`
- **`orders`**: `{ orderId, buyerId, sellerId, items[], totalAmount, status, shippingAddress }`

## Data Dummy Realistis UMKM Brebes:
Untuk menambah data, Anda dapat mendaftarkan akun baru lalu memilih Role "Toko UMKM". Beberapa contoh:
- **Toko**: "Telur Asin Jaya Abadi", **Produk**: Telur Asin Bakar (Isi 10), Harga: Rp 45.000
- **Toko**: "Bawang Merah Segar Wanasari", **Produk**: Bawang Merah Kering 1KG, Harga: Rp 35.000
- **Toko**: "Batik Salem Khas Brebes", **Produk**: Kain Batik Tulis Motif Bebek, Harga: Rp 150.000

## API Endpoint List (Node.js Express)
- `GET /api/health` -> Monitoring status server
- `POST /api/admin/validate-store` -> Webhook/Admin helper untuk verifikasi validitas toko UMKM (simulasi)
*(Mayoritas transaksi CRUD data dilakukan langsung dan aman melalui Client SDK dengan Firebase Security Rules v2).*
