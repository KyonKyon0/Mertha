# Stitch Screen Map

This document maps the retrieved Stitch screens to their Next.js routes and downloaded assets.

| Screen Name | Stitch Screen ID | Route | Status | Notes |
|---|---|---|---|---|
| Daftar - Mertha | 10ecde6c5d1546749e0fd1dfa405abe7 | `/daftar` | Assets Downloaded | Registration page |
| Lupa Kata Sandi - Mertha | fe786b31ed9a430dbbbd4de3ea42e771 | `/lupa-kata-sandi` | Assets Downloaded | Password recovery |
| Login - Mertha | cd613ac61ca04b909ba609e291ef02bf | `/login` | Assets Downloaded | Login page |
| Index | 3b892b47dc634d9f905b469bd30bd486 | `/` | Assets Downloaded | Landing page |
| Jelajahi | 3d060edc14694a33a824a44c95ca3fa5 | `/jelajahi` | Assets Downloaded | Browse / search |
| Detail Produk Teroptimasi | 48687593ecae45b6a72c6512f5d46d1b | `/produk/[id]` | Assets Downloaded | Product detail page |
| Maps | 60fc9cd4a135466fa2dee5553042e1af | `/maps` | Assets Downloaded | Merchant map |
| Pesanan Berhasil | a8df5f1e97784165b90528e7e8109076 | `/pesanan/berhasil` | Assets Downloaded | Success confirmation |
| Pesanan Gagal - Mertha | b3d773cd577441bdbc41d8e6ba72f792 | `/pesanan/gagal` | Assets Downloaded | Failure state |
| Checkout | c0c2e5081faa467e92f60817718edb95 | `/checkout/[id]` | Assets Downloaded | Checkout process |
| Profil Carmen | 661ec171f7ff4013809008136da21d60 | `/profil` | Assets Downloaded | User profile |
| Detail Pesanan Aktif & Refund | 48d888cc15ac476fab6b6bd720b6ebca | `/pesanan/[id]` | Assets Downloaded | Order tracking and refund |

## Assets
All remote assets have been downloaded to `public/assets/` and mapped correctly. HTML code is saved in `docs/stitch-screens/`.

## Reusable Components
Based on the designs, we need to extract:
- Buttons (Primary, Outline, Ghost)
- Inputs (Text, Password, Search)
- Cards (Product Card, Merchant Card, Order Card)
- Badges (Status, Category)
- Navigation (Bottom Navigation, Header)
- Carousels (Image galleries)
