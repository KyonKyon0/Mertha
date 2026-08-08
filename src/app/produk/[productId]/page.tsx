import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ProductClientComponent from '@/components/buyer/ProductClientComponent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { productId } = await params;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product, error } = await supabase
    .from('products')
    .select('*, merchants(*), product_images(image_url)')
    .eq('slug', productId)
    .maybeSingle();

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan - Too Good To Be Waste',
      description: 'Produk yang Anda cari tidak tersedia.'
    };
  }

  const imageUrl = product.product_images?.[0]?.image_url || '/images/placeholder.jpg';

  return {
    title: `${product.name} - ${product.merchants?.name} | Too Good To Be Waste`,
    description: product.description,
    openGraph: {
      images: [imageUrl],
      title: `${product.name} - ${product.merchants?.name}`,
      description: product.description
    }
  };
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const { productId } = await params;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product, error } = await supabase
    .from('products')
    .select('*, merchants(*), product_images(image_url)')
    .eq('slug', productId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product detail:", error);
    throw new Error("Terjadi kesalahan saat memuat data produk.");
  }
  
  console.log("Querying slug:", productId, "Result:", product ? "FOUND" : "NOT FOUND");

  if (!product) {
    notFound();
  }

  const pickupTime = `${product.pickup_time_start?.substring(0,5)} - ${product.pickup_time_end?.substring(0,5)}`;
  const imageUrls = product.product_images?.map((img: any) => img.image_url) || [];
  const primaryImage = imageUrls.length > 0 ? imageUrls[0] : '/images/placeholder.jpg';

  return (
    <ProductClientComponent 
      product={{
        id: product.id,
        name: product.name,
        merchantId: product.merchants?.id || '',
        merchantName: product.merchants?.name || 'Unknown',
        merchantSlug: product.merchants?.slug || '',
        rating: product.merchants?.rating || 4.8,
        reviews: product.merchants?.reviews_count || 124,
        address: product.merchants?.address || '',
        latitude: product.merchants?.latitude || 0,
        longitude: product.merchants?.longitude || 0,
        pickupTime: pickupTime,
        price: product.price || 0,
        originalPrice: product.original_price || 0,
        stock: product.stock || 0,
        description: product.description || '',
        allergens: product.allergens || [],
        imageUrl: primaryImage,
        galleryUrls: imageUrls
      }}
    />
  );
}
