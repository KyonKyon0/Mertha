import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductClientComponent from '@/components/buyer/ProductClientComponent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function generateMetadata({ params }: { params: { productId: string } }): Promise<Metadata> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product } = await supabase
    .from('products')
    .select('*, merchants(*)')
    .eq('slug', params.productId)
    .single();

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan - Too Good To Be Waste',
      description: 'Produk yang Anda cari tidak tersedia.'
    };
  }

  return {
    title: `${product.name} - ${product.merchants.name} | Too Good To Be Waste`,
    description: product.description,
    openGraph: {
      images: [product.image_url],
      title: `${product.name} - ${product.merchants.name}`,
      description: product.description
    }
  };
}

export default async function ProductDetail({ params }: { params: { productId: string } }) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product, error } = await supabase
    .from('products')
    .select('*, merchants(*)')
    .eq('slug', params.productId)
    .single();

  if (error || !product) {
    notFound();
  }

  // Format dates to WIB (UTC+7)
  const formatWIB = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pickupTime = `${formatWIB(product.pickup_start)} - ${formatWIB(product.pickup_end)}`;

  return (
    <ProductClientComponent 
      product={{
        id: product.id,
        name: product.name,
        merchantId: product.merchants.id,
        merchantName: product.merchants.name,
        merchantSlug: product.merchants.slug,
        rating: product.merchants.rating,
        reviews: product.merchants.reviews_count || 124,
        address: product.merchants.address,
        latitude: product.merchants.latitude,
        longitude: product.merchants.longitude,
        pickupTime: pickupTime,
        price: product.sale_price,
        originalPrice: product.original_price,
        stock: product.stock,
        description: product.description,
        allergens: product.allergens || [],
        imageUrl: product.image_url,
        galleryUrls: product.gallery_urls || []
      }}
    />
  );
}
