'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { AdminData, Campaign, Collection, Product } from '@/lib/types';
import { useAppSelector } from '@/features/store';
import { EmptyState, ErrorState, Loading, Modal } from './ui';

type Editor =
  | { kind: 'products'; value?: Product }
  | { kind: 'collections'; value?: Collection }
  | { kind: 'campaigns'; value?: Campaign };
type MutationInput = { path: string; method: string; data?: unknown };
export function AdminPage() {
  const { user, ready } = useAppSelector((s) => s.auth);
  if (!ready) return <Loading />;
  if (!user)
    return (
      <EmptyState
        title="The atelier, behind the scenes."
        text="Sign in with your administrator account to manage the collection."
        href="/account"
        link="Sign in"
      />
    );
  if (user.role !== 'ADMIN')
    return (
      <EmptyState
        title="A space for the atelier team."
        text="This area is reserved for administrators. Your wardrobe is waiting in your account."
        href="/account"
        link="Return to your account"
      />
    );
  return <AdminDashboard />;
}
function AdminDashboard() {
  const query = useQuery({ queryKey: ['admin'], queryFn: () => api<AdminData>('admin') });
  const client = useQueryClient();
  const [tab, setTab] = useState<'products' | 'collections' | 'campaigns' | 'orders'>('products');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [removing, setRemoving] = useState<{ path: string; title: string; kind: string } | null>(
    null,
  );
  const save = useMutation({
    mutationFn: ({ path, method, data }: MutationInput) =>
      api(path, { method, ...(data ? { body: JSON.stringify(data) } : {}) }),
    onSuccess: () => {
      setEditor(null);
      setRemoving(null);
      client.invalidateQueries({ queryKey: ['admin'] });
      client.invalidateQueries({ queryKey: ['catalog'] });
      client.invalidateQueries({ queryKey: ['product'] });
    },
  });
  function open(value: Editor) {
    save.reset();
    setEditor(value);
  }
  const submit = (data: unknown) => {
    if (editor)
      save.mutate({
        path: `admin/${editor.kind}${editor.value ? `/${editor.value.id}` : ''}`,
        method: editor.value ? 'PUT' : 'POST',
        data,
      });
  };
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  const data = query.data;
  return (
    <div className="admin-page">
      <div className="account-heading">
        <div>
          <p className="eyebrow">Behind the collection</p>
          <h1>
            The <em>atelier.</em>
          </h1>
        </div>
        <Link className="arrow-link" href="/">
          Visit storefront <ArrowRight size={17} />
        </Link>
      </div>
      <div className="admin-stats">
        <div>
          <span>{data.products.filter((p) => p.published).length}</span>
          <p>Published pieces</p>
        </div>
        <div>
          <span>{data.collections.length}</span>
          <p>Collections</p>
        </div>
        <div>
          <span>{data.orders.length}</span>
          <p>Recent orders</p>
        </div>
        <div>
          <span>{data.subscriberCount}</span>
          <p>Newsletter subscribers</p>
        </div>
      </div>
      <nav className="account-tabs" aria-label="Admin sections">
        {(['products', 'collections', 'campaigns', 'orders'] as const).map((t) => (
          <button className={tab === t ? 'selected' : ''} key={t} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      {tab !== 'orders' && (
        <div className="admin-toolbar">
          <p className="muted">
            {tab === 'products'
              ? 'Manage pieces, variants, stock and publishing.'
              : tab === 'collections'
                ? 'Shape the wardrobe into considered collections.'
                : 'Curate the campaigns in the homepage carousel.'}
          </p>
          <button className="button" onClick={() => open({ kind: tab } as Editor)}>
            <Plus size={17} />
            Add {tab === 'products' ? 'piece' : tab === 'collections' ? 'collection' : 'campaign'}
          </button>
        </div>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {(tab === 'products'
                ? ['Piece', 'Category', 'Price', 'Stock', 'Status', 'Actions']
                : tab === 'collections'
                  ? ['Collection', 'Season', 'Pieces', 'Actions']
                  : tab === 'campaigns'
                    ? ['Campaign', 'Destination', 'Status', 'Actions']
                    : ['Reference', 'Customer', 'Total', 'Status', 'Date']
              ).map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab === 'products' &&
              data.products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <span className="muted">/{p.slug}</span>
                  </td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>
                  <td>
                    <span className="status-tag">{p.published ? 'Published' : 'Unpublished'}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        onClick={() => open({ kind: 'products', value: p })}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={!p.published}
                        onClick={() => {
                          save.reset();
                          setRemoving({
                            path: `admin/products/${p.id}`,
                            title: p.name,
                            kind: 'products',
                          });
                        }}
                        aria-label={`Unpublish ${p.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {tab === 'collections' &&
              data.collections.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.title}</strong>
                    <span className="muted">/{c.slug}</span>
                  </td>
                  <td>{c.season}</td>
                  <td>{data.products.filter((p) => p.collectionId === c.id).length}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        onClick={() => open({ kind: 'collections', value: c })}
                        aria-label={`Edit ${c.title}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => {
                          save.reset();
                          setRemoving({
                            path: `admin/collections/${c.id}`,
                            title: c.title,
                            kind: 'collections',
                          });
                        }}
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {tab === 'campaigns' &&
              data.campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.title.replaceAll('\n', ' ')}</strong>
                    <span className="muted">{c.subtitle}</span>
                  </td>
                  <td>{c.link}</td>
                  <td>
                    <span className="status-tag">{c.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        onClick={() => open({ kind: 'campaigns', value: c })}
                        aria-label={`Edit ${c.title}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => {
                          save.reset();
                          setRemoving({
                            path: `admin/campaigns/${c.id}`,
                            title: c.title,
                            kind: 'campaigns',
                          });
                        }}
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {tab === 'orders' &&
              data.orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id.slice(-8).toUpperCase()}</td>
                  <td>{o.email}</td>
                  <td>{money(o.total)}</td>
                  <td>{o.status}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {tab === 'orders' && !data.orders.length && (
        <EmptyState
          title="A quiet start."
          text="Orders will appear here as customers begin and complete checkout."
        />
      )}
      <Modal
        open={!!editor}
        onClose={() => {
          if (!save.isPending) setEditor(null);
        }}
        title={`${editor?.value ? 'Edit' : 'Create'} ${editor?.kind === 'products' ? 'piece' : editor?.kind === 'collections' ? 'collection' : 'campaign'}`}
        className="admin-editor"
      >
        {editor?.kind === 'products' && (
          <ProductEditor
            key={editor.value?.id || 'new-product'}
            product={editor.value}
            collections={data.collections}
            onSave={submit}
            pending={save.isPending}
          />
        )}
        {editor?.kind === 'collections' && (
          <CollectionEditor
            key={editor.value?.id || 'new-collection'}
            value={editor.value}
            onSave={submit}
            pending={save.isPending}
          />
        )}
        {editor?.kind === 'campaigns' && (
          <CampaignEditor
            key={editor.value?.id || 'new-campaign'}
            value={editor.value}
            onSave={submit}
            pending={save.isPending}
          />
        )}
        {save.isError && (
          <p className="form-error" role="alert">
            {message(save.error)}
          </p>
        )}
      </Modal>
      <Modal
        open={!!removing}
        onClose={() => {
          if (!save.isPending) setRemoving(null);
        }}
        title={removing?.kind === 'products' ? 'Unpublish this piece?' : 'Remove this entry?'}
      >
        <p className="muted">
          {removing?.kind === 'products'
            ? `“${removing?.title}” will leave the public catalog. You can publish it again by editing the piece.`
            : `“${removing?.title}” will be deleted.${removing?.kind === 'collections' ? ' Its pieces will remain in the catalog without a collection.' : ''}`}
        </p>
        <div className="admin-confirm-actions">
          <button
            className="button secondary"
            onClick={() => setRemoving(null)}
            disabled={save.isPending}
          >
            Keep it
          </button>
          <button
            className="button"
            onClick={() => removing && save.mutate({ path: removing.path, method: 'DELETE' })}
            disabled={save.isPending}
          >
            {save.isPending
              ? 'Saving…'
              : removing?.kind === 'products'
                ? 'Unpublish piece'
                : 'Remove entry'}
          </button>
        </div>
        {save.isError && (
          <p className="form-error" role="alert">
            {message(save.error)}
          </p>
        )}
      </Modal>
    </div>
  );
}
const imageSchema = z
  .string()
  .regex(
    /^(\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s]+)$/,
    'Use a local /images/ path or an HTTPS image URL.',
  );
const productSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.')
    .max(100),
  description: z.string().min(10).max(3000),
  category: z.enum(['Outerwear', 'Knitwear', 'Dresses', 'Tailoring', 'Accessories', 'Essentials']),
  fabric: z.string().min(3).max(500),
  care: z.string().min(3).max(1000),
  price: z
    .number()
    .min(1)
    .max(100000)
    .refine(
      (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001,
      'Use at most two decimal places.',
    ),
  collectionId: z.string(),
  published: z.boolean(),
  media: z
    .array(z.object({ url: imageSchema, alt: z.string().min(3).max(200) }))
    .min(1)
    .max(8),
  variants: z
    .array(
      z.object({
        colorName: z.string().min(1).max(40),
        colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color.'),
        size: z.string().min(1).max(20),
        stock: z.number().int().min(0).max(100000),
      }),
    )
    .min(1)
    .max(50),
});
type ProductValues = z.infer<typeof productSchema>;
type EditorProps = { onSave: (value: unknown) => void; pending: boolean };
function ProductEditor({
  product,
  collections,
  onSave,
  pending,
}: { product?: Product; collections: Collection[] } & EditorProps) {
  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category as ProductValues['category'],
          fabric: product.fabric,
          care: product.care,
          price: Number(product.price),
          collectionId: product.collectionId || '',
          published: product.published,
          media: product.media.map((m) => ({ url: m.url, alt: m.alt })),
          variants: product.variants.map((v) => ({
            colorName: v.colorName,
            colorHex: v.colorHex,
            size: v.size,
            stock: v.stock,
          })),
        }
      : {
          name: '',
          slug: '',
          description: '',
          category: 'Essentials',
          fabric: '',
          care: '',
          price: 100,
          collectionId: '',
          published: false,
          media: [{ url: '/images/coat.jpg', alt: '' }],
          variants: [{ colorName: 'Sand', colorHex: '#C7B79E', size: 'M', stock: 10 }],
        },
  });
  const variants = useFieldArray({ control: form.control, name: 'variants' });
  const media = useFieldArray({ control: form.control, name: 'media' });
  return (
    <form className="admin-form" onSubmit={form.handleSubmit(onSave)} noValidate>
      <fieldset disabled={pending}>
        <div className="form-grid">
          {(['name', 'slug'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`product-${key}`}>{key === 'name' ? 'Piece name' : 'URL slug'}</label>
              <input id={`product-${key}`} {...form.register(key)} />
              {form.formState.errors[key] && (
                <p className="form-error">{form.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
          <div className="field">
            <label htmlFor="product-price">Price in EUR</label>
            <input
              id="product-price"
              type="number"
              min="1"
              step="0.01"
              {...form.register('price', { valueAsNumber: true })}
            />
            {form.formState.errors.price && (
              <p className="form-error">{form.formState.errors.price.message}</p>
            )}
          </div>
          <div className="field">
            <label htmlFor="product-category">Category</label>
            <select id="product-category" {...form.register('category')}>
              {['Outerwear', 'Knitwear', 'Dresses', 'Tailoring', 'Accessories', 'Essentials'].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </div>
          <div className="field span-2">
            <label htmlFor="product-collection">Collection</label>
            <select id="product-collection" {...form.register('collectionId')}>
              <option value="">Without a collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {(['description', 'fabric', 'care'] as const).map((key) => (
            <div className="field span-2" key={key}>
              <label htmlFor={`product-${key}`}>{key[0].toUpperCase() + key.slice(1)}</label>
              <textarea
                id={`product-${key}`}
                rows={key === 'description' ? 3 : 2}
                {...form.register(key)}
              />
              {form.formState.errors[key] && (
                <p className="form-error">{form.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
        </div>
        <h3>Photography</h3>
        <p className="muted">
          Use a local image or an HTTPS URL. The first image appears in the catalog; the second
          appears on hover.
        </p>
        {media.fields.map((field, i) => (
          <div className="admin-media-row" key={field.id}>
            <div className="field">
              <label htmlFor={`media-url-${i}`}>Image {i + 1} URL</label>
              <input id={`media-url-${i}`} {...form.register(`media.${i}.url`)} />
              {form.formState.errors.media?.[i]?.url && (
                <p className="form-error">{form.formState.errors.media[i]?.url?.message}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor={`media-alt-${i}`}>Image description</label>
              <input id={`media-alt-${i}`} {...form.register(`media.${i}.alt`)} />
              {form.formState.errors.media?.[i]?.alt && (
                <p className="form-error">{form.formState.errors.media[i]?.alt?.message}</p>
              )}
            </div>
            <button
              type="button"
              className="icon-button"
              disabled={media.fields.length <= 1}
              onClick={() => media.remove(i)}
              aria-label={`Remove image ${i + 1}`}
            >
              <X size={17} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-link"
          disabled={media.fields.length >= 8}
          onClick={() => media.append({ url: '', alt: '' })}
        >
          Add image
        </button>
        <h3>Color, size & stock</h3>
        {variants.fields.map((field, i) => (
          <div className="admin-variant-row" key={field.id}>
            <div className="field">
              <label htmlFor={`variant-color-${i}`}>Color</label>
              <input id={`variant-color-${i}`} {...form.register(`variants.${i}.colorName`)} />
            </div>
            <div className="field">
              <label htmlFor={`variant-hex-${i}`}>Hex</label>
              <input id={`variant-hex-${i}`} {...form.register(`variants.${i}.colorHex`)} />
            </div>
            <div className="field">
              <label htmlFor={`variant-size-${i}`}>Size</label>
              <input id={`variant-size-${i}`} {...form.register(`variants.${i}.size`)} />
            </div>
            <div className="field">
              <label htmlFor={`variant-stock-${i}`}>Stock</label>
              <input
                id={`variant-stock-${i}`}
                type="number"
                min="0"
                {...form.register(`variants.${i}.stock`, { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              className="icon-button"
              disabled={variants.fields.length <= 1}
              onClick={() => variants.remove(i)}
              aria-label={`Remove variant ${i + 1}`}
            >
              <X size={17} />
            </button>
            {form.formState.errors.variants?.[i] && (
              <p className="form-error variant-error">
                Each variant needs a color name, #RRGGBB color, size and a non-negative integer
                stock.
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-link"
          disabled={variants.fields.length >= 50}
          onClick={() =>
            variants.append({ colorName: '', colorHex: '#C7B79E', size: 'M', stock: 0 })
          }
        >
          Add variant
        </button>
        <label className="checkbox-field">
          <input type="checkbox" {...form.register('published')} />
          Publish this piece in the storefront
        </label>
        <button className="button full" type="submit">
          {pending ? 'Saving…' : 'Save piece'}
          <ArrowRight size={17} />
        </button>
      </fieldset>
    </form>
  );
}
const collectionSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  description: z.string().min(10).max(1000),
  heroImage: imageSchema,
  season: z.string().min(2).max(40),
});
function CollectionEditor({ value, onSave, pending }: { value?: Collection } & EditorProps) {
  const form = useForm<z.infer<typeof collectionSchema>>({
    resolver: zodResolver(collectionSchema),
    defaultValues: value
      ? {
          title: value.title,
          slug: value.slug,
          description: value.description,
          heroImage: value.heroImage,
          season: value.season,
        }
      : { title: '', slug: '', description: '', heroImage: '/images/coat.jpg', season: 'AW 2026' },
  });
  return (
    <form className="admin-form" onSubmit={form.handleSubmit(onSave)} noValidate>
      <fieldset disabled={pending}>
        <div className="stack">
          {(['title', 'slug', 'description', 'heroImage', 'season'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`collection-${key}`}>
                {
                  {
                    title: 'Collection title',
                    slug: 'URL slug',
                    description: 'Description',
                    heroImage: 'Cover image URL',
                    season: 'Season',
                  }[key]
                }
              </label>
              {key === 'description' ? (
                <textarea id={`collection-${key}`} rows={3} {...form.register(key)} />
              ) : (
                <input id={`collection-${key}`} {...form.register(key)} />
              )}
              {form.formState.errors[key] && (
                <p className="form-error">{form.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
          <button className="button full">
            {pending ? 'Saving…' : 'Save collection'}
            <ArrowRight size={17} />
          </button>
        </div>
      </fieldset>
    </form>
  );
}
const campaignSchema = z.object({
  title: z.string().min(3).max(100),
  subtitle: z.string().min(3).max(100),
  image: imageSchema,
  link: z
    .string()
    .regex(
      /^\/(collections|lookbook|journal|about)(\/[a-z0-9-]+)?$/,
      'Use an internal collection, lookbook, journal or about link.',
    ),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  active: z.boolean(),
});
function CampaignEditor({ value, onSave, pending }: { value?: Campaign } & EditorProps) {
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: value
      ? {
          title: value.title,
          subtitle: value.subtitle,
          image: value.image,
          link: value.link,
          accent: value.accent,
          active: value.active,
        }
      : {
          title: '',
          subtitle: 'AUTUMN / WINTER 2026',
          image: '/images/coat.jpg',
          link: '/collections',
          accent: '#5C1F1F',
          active: true,
        },
  });
  return (
    <form className="admin-form" onSubmit={form.handleSubmit(onSave)} noValidate>
      <fieldset disabled={pending}>
        <div className="stack">
          {(['title', 'subtitle', 'image', 'link', 'accent'] as const).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={`campaign-${key}`}>
                {
                  {
                    title: 'Campaign title (new lines supported)',
                    subtitle: 'Season or subtitle',
                    image: 'Campaign image URL',
                    link: 'Destination path',
                    accent: 'Accent color (#RRGGBB)',
                  }[key]
                }
              </label>
              {key === 'title' ? (
                <textarea id={`campaign-${key}`} rows={2} {...form.register(key)} />
              ) : (
                <input id={`campaign-${key}`} {...form.register(key)} />
              )}
              {form.formState.errors[key] && (
                <p className="form-error">{form.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
          <label className="checkbox-field">
            <input type="checkbox" {...form.register('active')} />
            Show this campaign on the homepage
          </label>
          <button className="button full">
            {pending ? 'Saving…' : 'Save campaign'}
            <ArrowRight size={17} />
          </button>
        </div>
      </fieldset>
    </form>
  );
}
