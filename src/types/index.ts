export type Coordinates = {
  lat: number;
  lng: number;
};

export type LocationError = {
  type:
    | "unsupported"
    | "denied"
    | "unavailable"
    | "timeout"
    | "offline"
    | "insecure"
    | "unknown";
  message: string;
};

export type GeocodingResult = {
  placeId: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  imageUrl: string;
  rating: number;
  distance?: number;
};

export type Product = {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  initialStock: number;
  pickupStart: string;
  pickupEnd: string;
  consumeBefore: string | null;
  imageUrl: string;
  galleryUrls: string[];
  allergens: string[];
  qualityScore: number | null;
  qualityStatus: string | null;
  active: boolean;
  merchant: Merchant;
};
