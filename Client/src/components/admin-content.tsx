'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpRight, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, message, money } from '@/lib/api';
import type { JournalPost, Product, StoreLocation, Order } from '@/lib/types';
import type { SiteSettings } from '@/lib/site-settings';
import { Photo, Modal, Loading, ErrorState } from './ui';

export type ContentSection = 'journal' | 'lookbooks' | 'stores' | 'settings' | 'subscribers';
type Hotspot = { productId: string; xPct: number; yPct: number };
type Chapter = { imageUrl: string; caption: string; hotspots: Hotspot[] };
type Book = { id: string; title: string; slug: string; coverImage: string; chapters: Chapter[] };
type Content = {
  journal: JournalPost[];
  lookbooks: Book[];
  stores: StoreLocation[];
  settings: SiteSettings;
  subscribers: { id: string; email: string; createdAt: string }[];
};
type Entry = JournalPost | StoreLocation | Book;
type Field = {
  key: string;
  label: string;
  type?: 'number' | 'textarea' | 'image' | 'email';
  min?: number;
  max?: number;
};
const fields: Record<'journal' | 'stores' | 'settings', Field[]> = {
  journal: [
    { key: 'title', label: 'Story title' },
    { key: 'slug', label: 'URL slug' },
    { key: 'category', label: 'Category' },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
    { key: 'coverImage', label: 'Cover image', type: 'image' },
    { key: 'publishedAt', label: 'Publish date (ISO 8601)' },
    {
      key: 'body',
      label: 'Article body (separate paragraphs with a blank line)',
      type: 'textarea',
    },
  ],
  stores: [
    { key: 'name', label: 'Store name' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Street address' },
    { key: 'hours', label: 'Opening hours' },
    { key: 'lat', label: 'Latitude', type: 'number', min: -90, max: 90 },
    { key: 'lng', label: 'Longitude', type: 'number', min: -180, max: 180 },
  ],
  settings: [
    { key: 'announcement', label: 'Announcement bar' },
    { key: 'homeTitle', label: 'Homepage introduction title' },
    { key: 'homeDescription', label: 'Homepage introduction text', type: 'textarea' },
    { key: 'newsletterTitle', label: 'Newsletter heading' },
    { key: 'newsletterDescription', label: 'Newsletter description', type: 'textarea' },
    { key: 'contactEmail', label: 'Contact email', type: 'email' },
  ],
};
export function MediaField({
  label,
  value,
  onChange,
  id,
  required = true,
  error,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  id?: string;
  required?: boolean;
  error?: string;
}) {
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return api<{ url: string; width: number; height: number }>('admin/media', {
        method: 'POST',
        body,
      });
    },
    onSuccess: (result) => onChange(result.url),
  });
  return (
    <div className="field media-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/images/… or https://…"
        required={required}
        aria-invalid={!!error}
      />
      {error && <p className="form-error">{error}</p>}
      <label className="media-upload">
        <Upload size={16} />
        <span>{upload.isPending ? 'Uploading…' : 'Upload photograph'}</span>
        <input
          aria-label={`Upload ${label}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={upload.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
      </label>
      {upload.isError && (
        <p role="alert" className="form-error">
          {message(upload.error)}
        </p>
      )}
      {upload.isSuccess && (
        <p role="status" className="muted">
          Uploaded · {upload.data.width} × {upload.data.height}px
        </p>
      )}
    </div>
  );
}
export function AdminContent({
  section,
  products,
}: {
  section: ContentSection;
  products: Product[];
}) {
  const query = useQuery({
    queryKey: ['admin-content'],
    queryFn: () => api<Content>('admin/content'),
  });
  const client = useQueryClient();
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Entry | null>(null);
  const [notice, setNotice] = useState('');
  const save = useMutation({
    mutationFn: ({ path, method, data }: { path: string; method: string; data?: unknown }) =>
      api(path, { method, ...(data ? { body: JSON.stringify(data) } : {}) }),
    onSuccess: () => {
      setEditing(undefined);
      setRemoving(null);
      setNotice('Your changes are saved.');
      for (const key of ['admin-content', 'settings', 'journal', 'lookbooks', 'lookbook', 'stores'])
        client.invalidateQueries({ queryKey: [key] });
    },
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState retry={() => query.refetch()} />;
  const content = query.data;
  const submit = (data: unknown) =>
    save.mutate({
      path: `admin/${section}${editing ? `/${editing.id}` : ''}`,
      method: section === 'settings' || editing ? 'PUT' : 'POST',
      data,
    });
  if (section === 'settings')
    return (
      <section className="admin-settings">
        <div>
          <p className="eyebrow">Storefront settings</p>
          <h2>The finishing touches.</h2>
          <p className="muted">
            Update the announcement, homepage introduction, newsletter and contact details.
          </p>
        </div>
        <div>
          <SimpleEditor
            key={JSON.stringify(content.settings)}
            section="settings"
            value={content.settings}
            pending={save.isPending}
            onSave={submit}
          />
          {save.isError && (
            <p role="alert" className="form-error">
              {message(save.error)}
            </p>
          )}
          {notice && (
            <p role="status" className="success-text">
              {notice}
            </p>
          )}
        </div>
      </section>
    );
  if (section === 'subscribers')
    return (
      <>
        <div className="admin-toolbar">
          <p className="muted">
            {content.subscribers.length} most recent subscribers. No messages are sent from this
            panel.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
              const csv = [
                'Email,Subscribed at',
                ...content.subscribers.map(
                  (s) =>
                    `${quote(/^[=+\-@]/.test(s.email) ? `'${s.email}` : s.email)},${quote(s.createdAt)}`,
                ),
              ].join('\r\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
              const link = document.createElement('a');
              link.href = url;
              link.download = 'atelier-lune-subscribers.csv';
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download CSV <ArrowDown size={17} />
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email address</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {content.subscribers.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!content.subscribers.length && (
          <p className="admin-empty">Your first subscribers will appear here.</p>
        )}
      </>
    );
  const rows = content[section];
  const noun = section === 'journal' ? 'story' : section === 'lookbooks' ? 'lookbook' : 'store';
  return (
    <>
      <div className="admin-toolbar">
        <p className="muted">
          {section === 'lookbooks'
            ? 'Create shoppable stories, order chapters and place product hotspots.'
            : section === 'journal'
              ? 'Write, photograph and publish stories from your world.'
              : 'Manage your spaces, opening hours and map coordinates.'}
        </p>
        <button
          className="button"
          onClick={() => {
            save.reset();
            setEditing(null);
            setNotice('');
          }}
        >
          <Plus size={17} />
          Add {noun}
        </button>
      </div>
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
      <div className="admin-content-grid">
        {rows.map((entry) => {
          const title = 'title' in entry ? entry.title : entry.name;
          const image = 'coverImage' in entry ? entry.coverImage : undefined;
          return (
            <article key={entry.id} className="admin-content-card">
              {image && (
                <div className="admin-card-photo">
                  <Photo src={image} alt={title} sizes="240px" />
                </div>
              )}
              <div>
                <p className="eyebrow muted">
                  {'category' in entry
                    ? entry.category
                    : 'chapters' in entry
                      ? `${entry.chapters.length} chapters`
                      : entry.city}
                </p>
                <h3>{title}</h3>
                <p className="muted">
                  {'excerpt' in entry
                    ? entry.excerpt
                    : 'address' in entry
                      ? `${entry.address} · ${entry.hours}`
                      : `/${entry.slug}`}
                </p>
                <div className="row-actions">
                  <button
                    className="text-link"
                    onClick={() => {
                      save.reset();
                      setEditing(entry);
                      setNotice('');
                    }}
                    aria-label={`Edit ${title}`}
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  {'slug' in entry && (
                    <Link
                      className="text-link"
                      target="_blank"
                      href={`/${section === 'journal' ? 'journal' : 'lookbook'}/${entry.slug}`}
                    >
                      View <ArrowUpRight size={16} />
                    </Link>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Delete ${title}`}
                    onClick={() => {
                      save.reset();
                      setRemoving(entry);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && <p className="admin-empty">Start with your first {noun}.</p>}
      <Modal
        open={editing !== undefined}
        onClose={() => {
          if (!save.isPending) setEditing(undefined);
        }}
        title={`${editing ? 'Edit' : 'Create'} ${noun}`}
        className="admin-editor"
      >
        {editing !== undefined &&
          (section === 'lookbooks' ? (
            <LookbookEditor
              key={editing?.id || 'new'}
              value={editing as Book | null}
              products={products}
              pending={save.isPending}
              onSave={submit}
            />
          ) : (
            <SimpleEditor
              key={editing?.id || 'new'}
              section={section}
              value={editing || undefined}
              pending={save.isPending}
              onSave={submit}
            />
          ))}
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
        title={`Delete this ${noun}?`}
      >
        <p>
          This entry and its {section === 'lookbooks' ? 'chapters and hotspots' : 'content'} will be
          removed from the storefront.
        </p>
        <div className="admin-confirm-actions">
          <button
            className="button secondary"
            disabled={save.isPending}
            onClick={() => setRemoving(null)}
          >
            Keep it
          </button>
          <button
            className="button"
            disabled={save.isPending}
            onClick={() =>
              removing && save.mutate({ path: `admin/${section}/${removing.id}`, method: 'DELETE' })
            }
          >
            Delete {noun}
          </button>
        </div>
        {save.isError && (
          <p className="form-error" role="alert">
            {message(save.error)}
          </p>
        )}
      </Modal>
    </>
  );
}
function SimpleEditor({
  section,
  value,
  onSave,
  pending,
}: {
  section: 'journal' | 'stores' | 'settings';
  value?: object;
  onSave: (v: unknown) => void;
  pending: boolean;
}) {
  const entry = (value || {}) as Record<string, unknown>;
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    Object.fromEntries(
      fields[section].map((f) => [
        f.key,
        f.type === 'number'
          ? Number(entry[f.key] ?? 0)
          : String(
              entry[f.key] ??
                (f.key === 'publishedAt'
                  ? new Date().toISOString()
                  : f.key === 'coverImage'
                    ? '/images/studio-detail.webp'
                    : ''),
            ),
      ]),
    ),
  );
  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
    >
      <fieldset disabled={pending}>
        <div className="stack">
          {fields[section].map((field) =>
            field.type === 'image' ? (
              <MediaField
                key={field.key}
                id={`content-${field.key}`}
                label={field.label}
                value={String(values[field.key])}
                onChange={(url) => setValues((v) => ({ ...v, [field.key]: url }))}
              />
            ) : (
              <div className="field" key={field.key}>
                <label htmlFor={`content-${field.key}`}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`content-${field.key}`}
                    rows={field.key === 'body' ? 14 : 3}
                    required
                    minLength={field.key === 'body' ? 30 : 10}
                    value={values[field.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`content-${field.key}`}
                    type={field.type || 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    min={field.min}
                    max={field.max}
                    required
                    value={values[field.key]}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [field.key]:
                          field.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ),
          )}
          <button className="button full">{pending ? 'Saving…' : 'Save changes'}</button>
        </div>
      </fieldset>
    </form>
  );
}
function LookbookEditor({
  value,
  products,
  onSave,
  pending,
}: {
  value: Book | null;
  products: Product[];
  onSave: (v: unknown) => void;
  pending: boolean;
}) {
  const [book, setBook] = useState(() =>
    value
      ? {
          title: value.title,
          slug: value.slug,
          coverImage: value.coverImage,
          chapters: value.chapters.map((c) => ({
            caption: c.caption,
            imageUrl: c.imageUrl,
            hotspots: c.hotspots.map((h) => ({
              productId: h.productId,
              xPct: h.xPct,
              yPct: h.yPct,
            })),
          })),
        }
      : {
          title: '',
          slug: '',
          coverImage: '/images/campaign-portrait.webp',
          chapters: [
            { caption: '', imageUrl: '/images/campaign-portrait.webp', hotspots: [] as Hotspot[] },
          ],
        },
  );
  const chapter = (index: number, change: Partial<Chapter>) =>
    setBook((b) => ({
      ...b,
      chapters: b.chapters.map((c, i) => (i === index ? { ...c, ...change } : c)),
    }));
  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(book);
      }}
    >
      <fieldset disabled={pending}>
        <div className="stack">
          <div className="form-grid">
            {(['title', 'slug'] as const).map((key) => (
              <div className="field" key={key}>
                <label htmlFor={`book-${key}`}>
                  {key === 'title' ? 'Lookbook title' : 'URL slug'}
                </label>
                <input
                  id={`book-${key}`}
                  required
                  pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
                  value={book[key]}
                  onChange={(e) => setBook((b) => ({ ...b, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <MediaField
            id="book-cover"
            label="Lookbook cover image"
            value={book.coverImage}
            onChange={(coverImage) => setBook((b) => ({ ...b, coverImage }))}
          />
          <h3>The chapters</h3>
          <p className="muted">
            Use portrait photographs with complete subjects. Add product points, then click the
            photograph to position the selected point.
          </p>
          {book.chapters.map((c, index) => (
            <div className="chapter-editor" key={index}>
              <div className="chapter-editor-heading">
                <strong>Chapter {String(index + 1).padStart(2, '0')}</strong>
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === 0}
                    aria-label={`Move chapter ${index + 1} up`}
                    onClick={() =>
                      setBook((b) => {
                        const chapters = [...b.chapters];
                        [chapters[index - 1], chapters[index]] = [
                          chapters[index],
                          chapters[index - 1],
                        ];
                        return { ...b, chapters };
                      })
                    }
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === book.chapters.length - 1}
                    aria-label={`Move chapter ${index + 1} down`}
                    onClick={() =>
                      setBook((b) => {
                        const chapters = [...b.chapters];
                        [chapters[index + 1], chapters[index]] = [
                          chapters[index],
                          chapters[index + 1],
                        ];
                        return { ...b, chapters };
                      })
                    }
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={book.chapters.length === 1}
                    aria-label={`Remove chapter ${index + 1}`}
                    onClick={() =>
                      setBook((b) => ({ ...b, chapters: b.chapters.filter((_, i) => i !== index) }))
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="field">
                <label htmlFor={`chapter-caption-${index}`}>Chapter {index + 1} caption</label>
                <input
                  id={`chapter-caption-${index}`}
                  required
                  minLength={3}
                  value={c.caption}
                  onChange={(e) => chapter(index, { caption: e.target.value })}
                />
              </div>
              <MediaField
                id={`chapter-image-${index}`}
                label={`Chapter ${index + 1} photograph`}
                value={c.imageUrl}
                onChange={(imageUrl) => chapter(index, { imageUrl })}
              />
              <HotspotEditor
                chapter={c}
                products={products}
                onChange={(hotspots) => chapter(index, { hotspots })}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-link"
            disabled={book.chapters.length >= 30}
            onClick={() =>
              setBook((b) => ({
                ...b,
                chapters: [...b.chapters, { caption: '', imageUrl: b.coverImage, hotspots: [] }],
              }))
            }
          >
            <Plus size={16} />
            Add chapter
          </button>
          <button className="button full">{pending ? 'Saving…' : 'Save lookbook'}</button>
        </div>
      </fieldset>
    </form>
  );
}
function HotspotEditor({
  chapter,
  products,
  onChange,
}: {
  chapter: Chapter;
  products: Product[];
  onChange: (h: Hotspot[]) => void;
}) {
  const [selected, setSelected] = useState(0);
  const update = (index: number, data: Partial<Hotspot>) =>
    onChange(chapter.hotspots.map((h, i) => (i === index ? { ...h, ...data } : h)));
  return (
    <>
      <button
        type="button"
        className="hotspot-preview"
        aria-label="Position selected product point on photograph"
        onClick={(e) => {
          if (!chapter.hotspots[selected]) return;
          const rect = e.currentTarget.getBoundingClientRect();
          update(selected, {
            xPct: Math.round(((e.clientX - rect.left) / rect.width) * 100),
            yPct: Math.round(((e.clientY - rect.top) / rect.height) * 100),
          });
        }}
      >
        <Photo src={chapter.imageUrl} alt={chapter.caption || 'Chapter preview'} sizes="400px" />
        {chapter.hotspots.map((h, i) => (
          <span
            key={i}
            className={selected === i ? 'selected' : ''}
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
          >
            {i + 1}
          </span>
        ))}
      </button>
      {chapter.hotspots.map((h, i) => (
        <div className="hotspot-editor-row" key={i}>
          <button
            type="button"
            className={`hotspot-number ${selected === i ? 'selected' : ''}`}
            onClick={() => setSelected(i)}
            aria-label={`Select product point ${i + 1}`}
          >
            {i + 1}
          </button>
          <label>
            Product
            <select
              aria-label={`Product point ${i + 1}`}
              value={h.productId}
              onChange={(e) => update(i, { productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.published ? ' (unpublished)' : ''}
                </option>
              ))}
            </select>
          </label>
          {(['xPct', 'yPct'] as const).map((key) => (
            <label key={key}>
              {key === 'xPct' ? 'X %' : 'Y %'}
              <input
                aria-label={`${key === 'xPct' ? 'X' : 'Y'} position for point ${i + 1}`}
                type="number"
                min={0}
                max={100}
                required
                value={h[key]}
                onChange={(e) => update(i, { [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <button
            className="icon-button"
            type="button"
            aria-label={`Remove point ${i + 1}`}
            onClick={() => {
              onChange(chapter.hotspots.filter((_, index) => index !== i));
              setSelected(0);
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-link"
        disabled={!products.length || chapter.hotspots.length >= 20}
        onClick={() => {
          setSelected(chapter.hotspots.length);
          onChange([...chapter.hotspots, { productId: products[0].id, xPct: 50, yPct: 50 }]);
        }}
      >
        <Plus size={16} />
        Add product point
      </button>
    </>
  );
}
export function AdminOrders({ orders }: { orders: Order[] }) {
  const client = useQueryClient();
  const [status, setStatus] = useState('ALL');
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [confirm, setConfirm] = useState<'ship' | 'cancel' | null>(null);
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ship' | 'cancel' }) =>
      api(`admin/orders/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin'] });
      client.invalidateQueries({ queryKey: ['catalog'] });
      setSelected(null);
      setConfirm(null);
    },
  });
  const filtered = orders.filter(
    (o) =>
      (status === 'ALL' || o.status === status) &&
      `${o.email} ${o.id}`.toLowerCase().includes(email.toLowerCase()),
  );
  return (
    <>
      <div className="admin-toolbar">
        <label className="field">
          Find an order
          <input
            type="search"
            placeholder="Email or order reference"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Payment / fulfilment
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['ALL', 'PENDING', 'PAID', 'SHIPPED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All orders' : s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Reference', 'Customer', 'Total', 'Status', 'Date', 'Details'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td>{o.id.slice(-8).toUpperCase()}</td>
                <td>{o.email}</td>
                <td>{money(o.total)}</td>
                <td>
                  <span className={`status-tag status-${o.status.toLowerCase()}`}>{o.status}</span>
                </td>
                <td>{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <button
                    className="text-link"
                    aria-label={`View order ${o.id.slice(-8).toUpperCase()}`}
                    onClick={() => {
                      setSelected(o);
                      setConfirm(null);
                      mutation.reset();
                    }}
                  >
                    View order <ArrowUpRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && <p className="admin-empty">No orders match this view.</p>}
      <Modal
        open={!!selected}
        onClose={() => {
          if (!mutation.isPending) setSelected(null);
        }}
        title="Order details"
      >
        {selected && (
          <>
            <p className="eyebrow">{selected.id}</p>
            <h3>{selected.shippingJson.name}</h3>
            <p>{selected.email}</p>
            <p className="muted">
              {selected.shippingJson.address}, {selected.shippingJson.city},{' '}
              {selected.shippingJson.postalCode}, {selected.shippingJson.country}
            </p>
            <div className="admin-order-items">
              {selected.itemsJson.map((i) => (
                <div key={i.variantId}>
                  <span>
                    {i.name} · {i.color} / {i.size} × {i.quantity}
                  </span>
                  <strong>{money(i.price * i.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <strong>{money(selected.total)}</strong>
            </div>
            <p className="muted">
              Payment status: {selected.status.toLowerCase()}
              {selected.paidAt
                ? ` · Confirmed ${new Date(selected.paidAt).toLocaleDateString('en-GB')}`
                : ''}
            </p>
            {selected.status === 'PAID' && (
              <button className="button full" onClick={() => setConfirm('ship')}>
                Mark as shipped
              </button>
            )}
            {selected.status === 'PENDING' && selected.paymentProvider === 'STRIPE' && (
              <button className="button secondary full" onClick={() => setConfirm('cancel')}>
                Cancel unpaid reservation
              </button>
            )}
            {confirm && (
              <div className="admin-action-confirm">
                <p>
                  {confirm === 'ship'
                    ? 'Confirm that this paid order has been dispatched.'
                    : 'Expire this unpaid payment and return reserved stock? The customer’s bag is preserved.'}
                </p>
                <div className="row-actions">
                  <button
                    className="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: selected.id, action: confirm })}
                  >
                    {mutation.isPending ? 'Updating…' : 'Confirm update'}
                  </button>
                  <button
                    className="text-link"
                    disabled={mutation.isPending}
                    onClick={() => setConfirm(null)}
                  >
                    Keep current status
                  </button>
                </div>
              </div>
            )}
            {mutation.isError && (
              <p role="alert" className="form-error">
                {message(mutation.error)}
              </p>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
