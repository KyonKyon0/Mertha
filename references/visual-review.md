# Visual Review - Mertha Mobile Buyer Application

This document cross-references the original Stitch designs with our implementation.

## Beranda (Home / Landing Page)
- **Original:** `references/stitch/screenshots/landing-page.png` (Stitch: 3b892b47dc634d9f905b469bd30bd486)
- **Implementation:** `src/app/page.js`
- **Notes:** Features the first-entry Landing Page experience with food-image promotional carousel, location search, and map actions. Matches the Stitch Landing screen.

## Jelajahi (List)
- **Original:** `references/stitch/screenshots/home-refined.png` (Stitch: 3d060edc14694a33a824a44c95ca3fa5)
- **Implementation:** `src/app/jelajahi/page.js`
- **Notes:** This is the main product list/discovery experience. Includes categories, product grid, and filter chips.

## Jelajahi (Peta / Map)
- **Original:** `references/stitch/screenshots/explore.png` (Stitch: 60fc9cd4a135466fa2dee5553042e1af)
- **Implementation:** `src/app/jelajahi/peta/page.js`
- **Notes:** Map-oriented Jelajahi screen. Includes map provider fallback, search, filters, and merchant markers.

## Detail Produk
- **Original:** `references/stitch/screenshots/product-detail.png`
- **Implementation:** `src/app/produk/[productId]/page.js`
- **Notes:** Implements full image, sticky header, rating, pickup time, location, and sticky bottom checkout bar.

## Pesanan Berhasil
- **Original:** `references/stitch/screenshots/order-success.png`
- **Implementation:** `src/app/pesanan/berhasil/page.js`
- **Notes:** Showcases the generated unique pickup code (e.g., MR-82X9) and navigation actions.

## Checkout
- **Original:** (Failed retrieval from MCP but implemented via Prompt)
- **Implementation:** `src/app/checkout/page.js`
- **Notes:** Multi-step review with location summary and Qris/GoPay toggles.

## Detail Pesanan & Refund
- **Original:** `references/stitch/screenshots/active-order.png`
- **Implementation:** `src/app/pesanan/[orderId]/page.js` & `src/app/refund/[orderId]/page.js`
- **Notes:** Implements the live tracking and entry to the AI-assisted Refund flow.

## Profil
- **Original:** `references/stitch/screenshots/profile.png`
- **Implementation:** `src/app/profil/page.js`
- **Notes:** Interactive preferences, settings, and user details summary.
