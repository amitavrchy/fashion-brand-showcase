'use client';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Photo({
  src,
  alt,
  className = '',
  priority = false,
  sizes = '(max-width: 700px) 100vw, 50vw',
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      style={src.includes('campaign-editorial') ? { objectPosition: '78% center' } : undefined}
      unoptimized={src.startsWith('https:') && !src.startsWith('https://images.unsplash.com/')}
      className={`photo ${className}`}
    />
  );
}
export function ArrowLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`arrow-link ${className}`}>
      <span>{children}</span>
      <ArrowRight size={19} strokeWidth={1.4} />
    </Link>
  );
}
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-35px' }}
      transition={{
        duration: reduce ? 0 : 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
    if (open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target instanceof Element && e.target.closest('a[href]'))
        )
          onClose();
      }}
      data-lenis-prevent
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={23} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Loading({ label = 'A moment, please…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-mark">L</span>
      <p>{label}</p>
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">A small interruption</p>
      <h2>Let’s try that again.</h2>
      <p>We couldn’t connect to the atelier. Please try again in a moment.</p>
      <button className="button" onClick={retry}>
        Try again <ArrowRight size={18} />
      </button>
    </div>
  );
}
export function EmptyState({
  title,
  text,
  href = '/collections',
  link = 'Explore the collection',
}: {
  title: string;
  text: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="empty-state">
      <span className="atelier-symbol">✳</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <ArrowLink href={href}>{link}</ArrowLink>
    </div>
  );
}
