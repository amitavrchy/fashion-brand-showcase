export type Variant = {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
};
export type Media = { id: string; url: string; alt: string; sortOrder: number };
export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  season: string;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  fabric: string;
  care: string;
  price: string | number;
  published: boolean;
  collectionId: string | null;
  collection: Collection | null;
  media: Media[];
  variants: Variant[];
};
export type Campaign = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  accent: string;
  active: boolean;
};
export type Catalog = { products: Product[]; collections: Collection[]; campaigns: Campaign[] };
export type User = { id: string; email: string; name: string; role: 'CUSTOMER' | 'ADMIN' };
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  stock: number;
};
export type Order = {
  paymentProvider?: string;
  stripeSessionId?: string | null;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  id: string;
  email: string;
  status: string;
  total: string | number;
  itemsJson: CartLine[];
  shippingJson: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    shippingCost: number;
  };
  createdAt: string;
};
export type CheckoutSession = Order & { sessionId: string; checkoutUrl: string; paymentMode: 'test' };
export type JournalPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: string;
  coverImage: string;
  publishedAt: string;
};
export type StoreLocation = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
};
export type Lookbook = {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  chapters: {
    id: string;
    caption: string;
    imageUrl: string;
    hotspots: { id: string; xPct: number; yPct: number; product: Product }[];
  }[];
};
export type AdminData = {
  products: Product[];
  collections: Collection[];
  campaigns: Campaign[];
  orders: Order[];
  subscriberCount: number;
};
