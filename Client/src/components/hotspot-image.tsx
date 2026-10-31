'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Photo } from './ui';
import type { Lookbook, Product } from '@/lib/types';

export function HotspotImage({
  chapter,
  onSelect,
}: {
  chapter: Lookbook['chapters'][number];
  onSelect: (product: Product) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const natural = useRef({ width: 1, height: 1 });
  const [bounds, setBounds] = useState({ width: 0, height: 0, left: 0, top: 0 });
  function measure() {
    const element = frame.current;
    if (!element) return;
    const scale = Math.min(
      element.clientWidth / natural.current.width,
      element.clientHeight / natural.current.height,
    );
    const width = natural.current.width * scale;
    const height = natural.current.height * scale;
    setBounds({
      width,
      height,
      left: (element.clientWidth - width) / 2,
      top: (element.clientHeight - height) / 2,
    });
  }
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="look-chapter-image" ref={frame}>
      <Photo
        src={chapter.imageUrl}
        alt={chapter.caption}
        sizes="(max-width: 700px) 100vw, 65vw"
        onLoad={(event) => {
          natural.current = {
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          };
          measure();
        }}
      />
      <div className="hotspot-plane" style={bounds}>
        {chapter.hotspots.map((h) => (
          <button
            className="hotspot"
            key={h.id}
            style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
            onClick={() => onSelect(h.product)}
            aria-label={`Shop ${h.product.name}`}
          >
            <Plus size={20} strokeWidth={1.3} />
          </button>
        ))}
      </div>
    </div>
  );
}
