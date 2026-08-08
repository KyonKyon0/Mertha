import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_CATEGORIES = [
  { name: 'Mystery Bag', icon_name: 'gift' },
  { name: 'Roti & Pastry', icon_name: 'croissant' },
  { name: 'Nasi & Lauk', icon_name: 'utensils' },
  { name: 'Sayur & Buah', icon_name: 'apple' },
  { name: 'Minuman', icon_name: 'coffee' }
];

const DEMO_MERCHANTS = [
  {
    name: 'Bakery Lezat Srengseng',
    slug: 'bakery-lezat-srengseng',
    description: 'Toko roti lezat dan nikmat dengan sisa pastry harian.',
    address: 'Area Srengseng Sawah, Jagakarsa, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3450,
    longitude: 106.8210,
    logo_url: '/assets/merchants/asset_1.png',
    rating: 4.5,
    is_active: true
  },
  {
    name: 'Toko Roti Makmur 12640',
    slug: 'toko-roti-makmur-12640',
    description: 'Toko roti tertua di Srengseng dengan berbagai macam kue.',
    address: 'Area Srengseng Sawah, Jagakarsa, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3475,
    longitude: 106.8230,
    logo_url: '/assets/merchants/asset_2.png',
    rating: 4.8,
    is_active: true
  },
  {
    name: 'Roti Senja Jagakarsa',
    slug: 'roti-senja-jagakarsa',
    description: 'Bakehouse dengan keahlian sourdough.',
    address: 'Area Jagakarsa, Jakarta Selatan',
    postal_code: '12620',
    latitude: -6.3315,
    longitude: 106.8180,
    logo_url: '/assets/merchants/asset_3.png',
    rating: 4.2,
    is_active: true
  },
  {
    name: 'Pastry Hijau Lenteng Agung',
    slug: 'pastry-hijau-lenteng-agung',
    description: 'Pastry vegan dan bahan organik sehat.',
    address: 'Area Lenteng Agung, Jakarta Selatan',
    postal_code: '12610',
    latitude: -6.3245,
    longitude: 106.8350,
    logo_url: '/assets/merchants/asset_4.png',
    rating: 4.9,
    is_active: true
  },
  {
    name: 'Kedai Surplus Cipedak',
    slug: 'kedai-surplus-cipedak',
    description: 'Penyelamat makanan berlebih di Cipedak.',
    address: 'Area Cipedak, Jagakarsa, Jakarta Selatan',
    postal_code: '12630',
    latitude: -6.3510,
    longitude: 106.8105,
    logo_url: '/assets/merchants/asset_5.png',
    rating: 4.4,
    is_active: true
  },
  {
    name: 'Rumah Roti Setu Babakan',
    slug: 'rumah-roti-setu-babakan',
    description: 'Menyajikan roti khas betawi dekat danau.',
    address: 'Area Setu Babakan, Jagakarsa, Jakarta Selatan',
    postal_code: '12640',
    latitude: -6.3420,
    longitude: 106.8255,
    logo_url: '/assets/merchants/asset_6.png',
    rating: 4.7,
    is_active: true
  },
  {
    name: 'Dapur Hemat Universitas',
    slug: 'dapur-hemat-universitas',
    description: 'Dekat kampus, makanan lezat dan murah meriah.',
    address: 'Area Kampus Srengseng Sawah, Jakarta Selatan 12640',
    postal_code: '12640',
    latitude: -6.3565,
    longitude: 106.8280,
    logo_url: '/assets/merchants/asset_7.png',
    rating: 4.6,
    is_active: true
  },
  {
    name: 'Pangan Baik Tanjung Barat',
    slug: 'pangan-baik-tanjung-barat',
    description: 'Koleksi makanan berlebih wilayah Tanjung Barat.',
    address: 'Area Tanjung Barat, Jagakarsa, Jakarta Selatan',
    postal_code: '12530',
    latitude: -6.3050,
    longitude: 106.8400,
    logo_url: '/assets/merchants/asset_8.png',
    rating: 4.3,
    is_active: true
  }
];

function generateProductsForMerchant(merchant, categoryMap) {
  const products = [];
  
  if (merchant.slug === 'toko-roti-makmur-12640') {
    products.push({
      name: 'Surprise Bag - Pastry Sisa Hari Ini',
      slug: `${merchant.slug}-surprise-bag`,
      description: 'Surprise bag berisi aneka pastry manis dan gurih yang belum terjual hari ini. Produk masih dalam kondisi baik dan layak konsumsi. Isi paket dapat berbeda setiap hari.',
      category_id: categoryMap['Roti & Pastry'] || categoryMap['Mystery Bag'],
      original_price: 75000,
      price: 25000,
      stock: 2,
      pickup_time_start: '19:00:00',
      pickup_time_end: '21:00:00',
      allergens: ['Gandum', 'Susu', 'Telur'],
      is_active: true
    });
  }

  // Generate generic products
  for (let i = 1; i <= 3; i++) {
    if (merchant.slug === 'toko-roti-makmur-12640' && i === 1) continue; // Already added main product

    let catName = 'Nasi & Lauk';
    if (i === 1) catName = 'Sayur & Buah';
    if (i === 2) catName = 'Roti & Pastry';
    if (i === 3) catName = 'Mystery Bag';

    products.push({
      name: `Paket Hemat ${i} - ${merchant.name}`,
      slug: `${merchant.slug}-paket-hemat-${i}`,
      description: `Paket sisa harian spesial dari ${merchant.name}. Sangat menguntungkan!`,
      category_id: categoryMap[catName],
      original_price: 50000 + (i * 10000),
      price: 15000 + (i * 5000),
      stock: Math.floor(Math.random() * 5) + 1,
      pickup_time_start: '12:00:00',
      pickup_time_end: '14:00:00',
      allergens: ['Gandum'],
      is_active: true
    });
  }
  
  return products;
}

async function seed() {
  console.log('Seeding demo data...');

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    const categoryMap = {};
    for (const cat of DEMO_CATEGORIES) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', cat.name)
        .single();
      
      if (!data) {
        const { data: newCat, error: insertError } = await supabase
          .from('categories')
          .insert(cat)
          .select()
          .single();
        if (newCat) categoryMap[newCat.name] = newCat.id;
      } else {
        categoryMap[data.name] = data.id;
      }
    }

    // 2. Seed Merchants
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

      // 3. Seed Products
      const products = generateProductsForMerchant(merchant, categoryMap);
      const productsWithMerchantId = products.map(p => ({ ...p, merchant_id: merchantData.id }));

      for (const product of productsWithMerchantId) {
        console.log(`  Upserting product: ${product.name}`);
        const { data: productData, error: productError } = await supabase
          .from('products')
          .upsert(product, { onConflict: 'slug' })
          .select()
          .single();
          
        if (productError) {
          console.error('  Product Error:', productError);
        } else {
          // 4. Seed Product Image
          const imgUrl = `/assets/products/asset_${Math.floor(Math.random() * 5) + 9}.png`;
          await supabase.from('product_images').insert({
            product_id: productData.id,
            image_url: imgUrl,
            is_primary: true
          });
        }
      }
    }
    
    console.log('Seeding complete!');
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

seed();
