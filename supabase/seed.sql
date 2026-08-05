-- Sample categories
INSERT INTO categories (id, name, icon_name) VALUES
('11111111-1111-1111-1111-111111111111', 'Semua', 'grid'),
('22222222-2222-2222-2222-222222222222', 'Roti & Pastry', 'croissant'),
('33333333-3333-3333-3333-333333333333', 'Nasi & Lauk', 'utensils'),
('44444444-4444-4444-4444-444444444444', 'Minuman', 'coffee'),
('55555555-5555-5555-5555-555555555555', 'Sayur & Buah', 'leaf')
ON CONFLICT DO NOTHING;

-- Sample merchants
INSERT INTO merchants (id, name, description, address, lat, lng, rating, reviews_count) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Toko Roti Makmur', 'Menyediakan aneka roti dan pastry kualitas terbaik.', 'Jl. Melati No. 12, Senayan, Jakarta Selatan', -6.2272, 106.8023, 4.8, 124),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Warung Bu Nani', 'Masakan rumahan dengan cita rasa nusantara.', 'Jl. Sudirman No. 45, Jakarta Pusat', -6.2088, 106.8229, 4.5, 89)
ON CONFLICT DO NOTHING;

-- Sample products
INSERT INTO products (id, merchant_id, category_id, name, description, allergens, price, original_price, stock, pickup_time_start, pickup_time_end) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Surprise Bag - Pastry Sisa Hari Ini', 'Surprise bag ini berisi aneka pastry manis dan gurih yang tidak terjual hari ini. Kondisi masih sangat baik dan layak konsumsi. Isi bag mungkin berbeda setiap harinya.', ARRAY['Gandum', 'Susu', 'Telur'], 25000, 75000, 2, '19:00', '21:00'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Nasi Campur Ayam (Porsi Besar)', 'Nasi campur ayam dengan sayur dan sambal sisa hari ini.', ARRAY['Kacang'], 15000, 35000, 5, '20:00', '22:00')
ON CONFLICT DO NOTHING;
