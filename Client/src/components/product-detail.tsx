'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, PackageCheck, Ruler, Truck, ZoomIn } from 'lucide-react';
import { api, ApiError, money } from '@/lib/api';
import type { Catalog, Product } from '@/lib/types';
import { addItem, useAppDispatch } from '@/features/store';
import { ProductCard, WishButton } from './product-card';
import { EmptyState, ErrorState, Loading, Modal, Photo } from './ui';

export function SizeGuide() {
  return (
    <>
      <p className="muted">
        Body measurements in centimetres. Our pieces have a considered, relaxed fit. Choose your
        usual size; size down for a closer silhouette.
      </p>
      <table className="size-table">
        <caption className="sr-only">
          International clothing size conversion and body measurements in centimetres
        </caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">EU</th>
            <th scope="col">Bust</th>
            <th scope="col">Waist</th>
            <th scope="col">Hip</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['XS', '34', '80–84', '62–66', '86–90'],
            ['S', '36', '84–88', '66–70', '90–94'],
            ['M', '38', '88–92', '70–74', '94–98'],
            ['L', '40', '92–98', '74–80', '98–104'],
            ['XL', '42', '98–104', '80–86', '104–110'],
          ].map((row) => (
            <tr key={row[0]}>
              <th scope="row">{row[0]}</th>
              {row.slice(1).map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Measure around the fullest part of your bust and hips, and the narrowest point of your
        waist. Keep the tape comfortably level.
      </p>
      <Link className="text-link" href="/client-care">
        Need a little guidance? Client care
      </Link>
    </>
  );
}
export function ProductPage({ slug, initialProduct }: { slug: string; initialProduct?: Product }) {
  const product = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<Product>(`products/${slug}`),
    initialData: initialProduct,
  });
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<Catalog>('catalog') });
  if (product.isPending) return <Loading label="A closer look…" />;
  if (product.isError)
    return product.error instanceof ApiError && product.error.status === 404 ? (
      <EmptyState
        title="This piece has moved on."
        text="Discover other considered additions to your wardrobe."
      />
    ) : (
      <ErrorState retry={() => product.refetch()} />
    );
  return (
    <ProductContent
      key={product.data.id}
      product={product.data}
      related={catalog.data?.products.filter((p) => p.id !== product.data.id).slice(0, 4) || []}
    />
  );
}
function ProductContent({ product, related }: { product: Product; related: Product[] }) {
  const dispatch = useAppDispatch();
  const [color, setColor] = useState(product.variants[0]?.colorName || '');
  const [size, setSize] = useState('');
  const [image, setImage] = useState(0);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [error, setError] = useState('');
  const colors = [...new Map(product.variants.map((v) => [v.colorName, v.colorHex])).entries()];
  const variants = product.variants.filter((v) => v.colorName === color);
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'One size'].filter((s) =>
    variants.some((v) => v.size === s),
  );
  const otherSizes = variants.map((v) => v.size).filter((s) => !sizes.includes(s));
  const variant = variants.find((v) => v.size === size);
  const available = variants.some((v) => v.stock > 0);
  function add() {
    if (!variant) {
      setError('Please choose your size.');
      document.getElementById('size-picker')?.focus();
      return;
    }
    if (variant.stock < 1) {
      setError('This size is currently out of stock.');
      return;
    }
    setError('');
    dispatch(
      addItem({
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        name: product.name,
        image: product.media[0].url,
        price: Number(product.price),
        color: variant.colorName,
        size: variant.size,
        quantity: 1,
        stock: variant.stock,
      }),
    );
  }
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/collections">The collection</Link>
        <span aria-hidden>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="product-layout">
        <div className="product-gallery">
          <button
            className="gallery-main"
            onClick={() => setZoom(true)}
            aria-label={`Zoom ${product.name} image ${image + 1}`}
          >
            <Photo
              src={product.media[image]?.url || product.media[0].url}
              alt={product.media[image]?.alt || product.name}
              priority
              sizes="(max-width: 600px) 100vw, 55vw"
            />
            <span className="zoom-icon">
              <ZoomIn size={19} />
            </span>
          </button>
          {product.media.map((m, i) => (
            <button
              className={`gallery-thumbnail ${image === i ? 'selected' : ''}`}
              key={m.id}
              onClick={() => setImage(i)}
              aria-label={`View ${m.alt}`}
              aria-pressed={image === i}
            >
              <Photo src={m.url} alt={m.alt} sizes="25vw" />
            </button>
          ))}
        </div>
        <div className="product-info">
          <p className="eyebrow">
            {product.collection?.season || 'The considered wardrobe'} · {product.category}
          </p>
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <WishButton product={product} />
          </div>
          <p className="product-price">
            {money(product.price)} <span className="muted">/ VAT included</span>
          </p>
          <p className="product-description">{product.description}</p>
          <div className="color-picker">
            <p className="picker-label">Color: {color}</p>
            <div className="color-options" role="group" aria-label="Choose color">
              {colors.map(([name, hex]) => (
                <button
                  className={`color-swatch ${name === color ? 'selected' : ''}`}
                  key={name}
                  style={{ backgroundColor: hex }}
                  aria-label={name}
                  aria-pressed={name === color}
                  onClick={() => {
                    setColor(name);
                    setSize('');
                    setError('');
                  }}
                />
              ))}
            </div>
          </div>
          <div className="size-picker" id="size-picker" tabIndex={-1}>
            <div className="picker-label">
              <span>Select size{size && `: ${size}`}</span>
              <button className="text-link" onClick={() => setSizeGuide(true)}>
                <Ruler size={15} style={{ display: 'inline', marginRight: 6 }} />
                Size guide
              </button>
            </div>
            <div className="size-options" role="group" aria-label="Choose size">
              {[...sizes, ...otherSizes].map((s) => {
                const inStock = (variants.find((v) => v.size === s)?.stock || 0) > 0;
                return (
                  <button
                    key={s}
                    className={`size-option ${s === size ? 'selected' : ''}`}
                    aria-label={`Size ${s}${!inStock ? ', out of stock' : ''}`}
                    aria-pressed={size === s}
                    disabled={!inStock}
                    onClick={() => {
                      setSize(s);
                      setError('');
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="stock-note" aria-live="polite">
            {!available
              ? 'This color is currently out of stock.'
              : variant
                ? `${variant.stock <= 3 ? `Only ${variant.stock} remaining` : 'In stock'} · Ready for your everyday`
                : 'Thoughtfully made. Ready to make yours.'}
          </p>
          <button className="button product-add-button" onClick={add} disabled={!available}>
            Add to bag{' '}
            <span>
              {money(product.price)}{' '}
              <ArrowRight size={18} style={{ display: 'inline', marginLeft: 16 }} />
            </span>
          </button>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="product-service">
            <span>
              <Truck size={17} strokeWidth={1.3} />
              Free delivery over €300
            </span>
            <span>
              <PackageCheck size={17} strokeWidth={1.3} />
              30-day returns
            </span>
          </div>
          <div className="accordion">
            <details open>
              <summary>Fabric & composition</summary>
              <div>{product.fabric}. Chosen for its exceptional feel and enduring quality.</div>
            </details>
            <details>
              <summary>A little care goes a long way</summary>
              <div>{product.care}</div>
            </details>
            <details>
              <summary>Delivery & returns</summary>
              <div>
                Standard delivery within 3–5 working days. Complimentary on orders over €300,
                otherwise €15. Returns accepted within 30 days, unworn and with original tags.{' '}
                <Link href="/client-care#shipping" className="text-link">
                  Read our delivery policy
                </Link>
              </div>
            </details>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section-pad recommendations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">In good company</p>
              <h2>
                Complete the <em>feeling.</em>
              </h2>
            </div>
          </div>
          <div className="catalog-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} index={5} />
            ))}
          </div>
        </section>
      )}
      <Modal open={sizeGuide} onClose={() => setSizeGuide(false)} title="Finding your fit">
        <SizeGuide />
      </Modal>
      <Modal
        open={zoom}
        onClose={() => setZoom(false)}
        title={product.name}
        className="zoom-dialog"
      >
        <div className="zoom-photo">
          <Photo
            src={product.media[image]?.url || product.media[0].url}
            alt={product.name}
            sizes="90vw"
          />
        </div>
      </Modal>
    </>
  );
}
