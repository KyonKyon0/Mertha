import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role for seeding if available, otherwise fallback to anon key with RLS bypassed (if possible) or just anon key. Wait, the instructions say "Frontend tidak boleh menggunakan service-role key", but for seeding it's okay if we have it in `.env.local`. I'll just use anon if service role isn't provided, but actually I need to bypass RLS to insert. 
// Let's see if Supabase provides the service role key in .env.local.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_MERCHANTS = [
  {
    name: 'Bakery Lezat Srengseng',
    slug: 'bakery-lezat-srengseng',
    description: 'Toko roti lezat dan nikmat dengan sisa pastry harian.',
    address: 'Area Srengseng Sawah, Jagakarsa, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3450,
    longitude: 106.8210,
    image_url: '/assets/merchants/asset_1.png',
    rating: 4.5,
    active: true
  },
  {
    name: 'Toko Roti Makmur 12640',
    slug: 'toko-roti-makmur-12640',
    description: 'Toko roti tertua di Srengseng dengan berbagai macam kue.',
    address: 'Area Srengseng Sawah, Jagakarsa, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3475,
    longitude: 106.8230,
    image_url: '/assets/merchants/asset_2.png',
    rating: 4.8,
    active: true
  },
  {
    name: 'Roti Senja Jagakarsa',
    slug: 'roti-senja-jagakarsa',
    description: 'Bakehouse dengan keahlian sourdough.',
    address: 'Area Jagakarsa, Jakarta Selatan',
    postal_code: '12620',
    latitude: -6.3315,
    longitude: 106.8180,
    image_url: '/assets/merchants/asset_3.png',
    rating: 4.2,
    active: true
  },
  {
    name: 'Pastry Hijau Lenteng Agung',
    slug: 'pastry-hijau-lenteng-agung',
    description: 'Pastry vegan dan bahan organik sehat.',
    address: 'Area Lenteng Agung, Jakarta Selatan',
    postal_code: '12610',
    latitude: -6.3245,
    longitude: 106.8350,
    image_url: '/assets/merchants/asset_4.png',
    rating: 4.9,
    active: true
  },
  {
    name: 'Kedai Surplus Cipedak',
    slug: 'kedai-surplus-cipedak',
    description: 'Penyelamat makanan berlebih di Cipedak.',
    address: 'Area Cipedak, Jagakarsa, Jakarta Selatan',
    postal_code: '12630',
    latitude: -6.3510,
    longitude: 106.8105,
    image_url: '/assets/merchants/asset_5.png',
    rating: 4.4,
    active: true
  },
  {
    name: 'Rumah Roti Setu Babakan',
    slug: 'rumah-roti-setu-babakan',
    description: 'Menyajikan roti khas betawi dekat danau.',
    address: 'Area Setu Babakan, Jagakarsa, Jakarta Selatan',
    postal_code: '12640',
    latitude: -6.3420,
    longitude: 106.8255,
    image_url: '/assets/merchants/asset_6.png',
    rating: 4.7,
    active: true
  },
  {
    name: 'Dapur Hemat Universitas',
    slug: 'dapur-hemat-universitas',
    description: 'Dekat kampus, makanan lezat dan murah meriah.',
    address: 'Area Kampus Srengseng Sawah, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3565,
    longitude: 106.8280,
    image_url: '/assets/merchants/asset_7.png',
    rating: 4.6,
    active: true
  },
  {
    name: 'Pangan Baik Tanjung Barat',
    slug: 'pangan-baik-tanjung-barat',
    description: 'Koleksi makanan berlebih wilayah Tanjung Barat.',
    address: 'Area Tanjung Barat, Jagakarsa, Jakarta Selatan',
    postal_code: '12530',
    latitude: -6.3050,
    longitude: 106.8400,
    image_url: '/assets/merchants/asset_8.png',
    rating: 4.3,
    active: true
  }
];

function generateProductsForMerchant(merchant) {
  const products = [];
  
  if (merchant.slug === 'toko-roti-makmur-12640') {
    products.push({
      name: 'Surprise Bag - Pastry Sisa Hari Ini',
      slug: `${merchant.slug}-surprise-bag`,
      description: 'Surprise bag berisi aneka pastry manis dan gurih yang belum terjual hari ini. Produk masih dalam kondisi baik dan layak konsumsi. Isi paket dapat berbeda setiap hari.',
      category: 'Pastry',
      original_price: 75000,
      sale_price: 25000,
      price: 25000, // For old constraint
      stock: 2,
      initial_stock: 12,
      // Date relative to today, fixed hours in WIB (UTC+7) -> UTC = WIB - 7
      pickup_start: new Date(new Date().setUTCHours(12, 0, 0, 0)).toISOString(), // 19:00 WIB
      pickup_end: new Date(new Date().setUTCHours(14, 0, 0, 0)).toISOString(), // 21:00 WIB
      consume_before: new Date(new Date(Date.now() + 86400000).setUTCHours(17, 0, 0, 0)).toISOString(),
      image_url: '/assets/products/asset_9.png',
      gallery_urls: [
        '/assets/products/asset_9.png',
        '/assets/products/asset_10.png',
        '/assets/products/asset_11.png'
      ],
      allergens: ['Gandum', 'Susu', 'Telur'],
      quality_score: 94,
      quality_status: 'Skor kualitas demo',
      active: true
    });
  }

  // Generate generic products
  for (let i = 1; i <= 3; i++) {
    if (merchant.slug === 'toko-roti-makmur-12640' && i === 1) continue; // Already added main product

    products.push({
      name: `Paket Hemat ${i} - ${merchant.name}`,
      slug: `${merchant.slug}-paket-hemat-${i}`,
      description: `Paket sisa harian spesial dari ${merchant.name}. Sangat menguntungkan!`,
      category: 'Campuran',
      original_price: 50000 + (i * 10000),
      sale_price: 15000 + (i * 5000),
      price: 15000 + (i * 5000), // For old constraint
      stock: Math.floor(Math.random() * 5) + 1,
      initial_stock: 10,
      pickup_start: new Date(new Date().setUTCHours(12, 0, 0, 0)).toISOString(),
      pickup_end: new Date(new Date().setUTCHours(14, 0, 0, 0)).toISOString(),
      consume_before: new Date(new Date(Date.now() + 86400000).setUTCHours(17, 0, 0, 0)).toISOString(),
      image_url: `/assets/products/asset_${(i % 10) + 10}.png`,
      gallery_urls: [
        `/assets/products/asset_${(i % 10) + 10}.png`,
        `/assets/products/asset_${(i % 10) + 11}.png`,
        `/assets/products/asset_${(i % 10) + 12}.png`
      ],
      allergens: ['Gandum'],
      quality_score: 85 + i,
      quality_status: 'Skor kualitas demo',
      active: true
    });
  }
  
  return products;
}

async function seed() {
  console.log('Seeding demo data...');

  try {
    for (const merchant of DEMO_MERCHANTS) {
      console.log(`Upserting merchant: ${merchant.name}`);
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .upsert(merchant, { onConflict: 'slug' })
        .select()
        .single();
        
      if (merchantError) {
        console.error('Merchant Error:', merchantError);
        continue;
      }

      const products = generateProductsForMerchant(merchant);
      const productsWithMerchantId = products.map(p => ({ ...p, merchant_id: merchantData.id }));

      for (const product of productsWithMerchantId) {
        console.log(`  Upserting product: ${product.name}`);
        const { error: productError } = await supabase
          .from('products')
          .upsert(product, { onConflict: 'slug' });
          
        if (productError) {
          console.error('  Product Error:', productError);
        }
      }
    }
    
    console.log('Seeding complete!');
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

seed();
