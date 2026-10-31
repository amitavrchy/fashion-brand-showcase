'use client';
import Link from 'next/link';
import { Heart, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { toggleWishlist, useAppDispatch, useAppSelector } from '@/features/store';
import { Photo } from './ui';

export function WishButton({ product, className = '' }: { product: Product; className?: string }) {
  const dispatch = useAppDispatch();
  const wished = useAppSelector(s => s.wishlist.ids.includes(product.id));
  const user = useAppSelector(s => s.auth.user);
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (remove: boolean) => api(`wishlist/${product.id}`, { method: remove ? 'DELETE' : 'PUT' }),
    onError: e => { dispatch(toggleWishlist(product.id)); setError(message(e)); },
  });
  return <><button className={`icon-button wish-button ${wished ? 'is-wished' : ''} ${className}`} aria-label={`${wished ? 'Remove' : 'Save'} ${product.name} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} disabled={mutation.isPending} onClick={() => { setError(''); dispatch(toggleWishlist(product.id)); if (user) mutation.mutate(wished); }}><Heart size={20} strokeWidth={1.3} fill={wished ? 'currentColor' : 'none'} /></button>{error && <span className="card-error" role="alert">{error}</span>}</>;
}
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const colors = [...new Map(product.variants.map(v => [v.colorName, v.colorHex])).entries()];
  return <article className="product-card"><div className="product-image"><Link href={`/product/${product.slug}`} aria-label={`Discover ${product.name}`}><Photo src={product.media[0]?.url || '/images/coat.jpg'} alt={product.media[0]?.alt || product.name} sizes="(max-width: 700px) 50vw, 25vw" className="primary-image" />{product.media[1] && <Photo src={product.media[1].url} alt={product.media[1].alt} sizes="(max-width: 700px) 50vw, 25vw" className="secondary-image" />}<span className="product-discover">Discover piece <ArrowUpRight size={18} /></span></Link><WishButton product={product} />{index < 2 && <span className="product-badge">New season</span>}</div><div className="product-meta"><div><Link href={`/product/${product.slug}`} className="product-name">{product.name}</Link><p className="muted">{product.category}</p></div><span className="price">{money(product.price)}</span></div><div className="color-dots" aria-label={`Available in ${colors.map(([name]) => name).join(', ')}`}>{colors.map(([name, hex]) => <span key={name} style={{ background: hex }} title={name} />)}</div></article>;
}
