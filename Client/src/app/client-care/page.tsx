import Link from 'next/link';
import { SizeGuide } from '@/components/product-detail';
export const metadata = {
  title: 'Client care',
  description:
    'A little guidance on delivery, returns, sizing and caring for your Atelier Lune pieces.',
};
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Here to help</p>
        <h1>
          A little <em>guidance.</em>
        </h1>
        <p>Everything you need to feel at home in your wardrobe.</p>
      </div>
      <div className="care-layout">
        <nav className="care-nav" aria-label="Client care topics">
          <a href="#shipping">Delivery & returns</a>
          <a href="#sizing">Finding your fit</a>
          <a href="#care">Caring for your pieces</a>
          <a href="#orders">Your orders</a>
        </nav>
        <div className="care-content">
          <section id="shipping">
            <h2>Delivery & returns</h2>
            <p>
              Our illustrative standard delivery takes 3–5 working days. Delivery is complimentary
              on orders of €300 or more; a €15 flat rate applies below €300. All displayed prices
              are in euros and include VAT.
            </p>
            <p>
              Our concept return policy allows 30 days from delivery for pieces that are unworn,
              unwashed, with their original tags and packaging.
            </p>
            <p>
              This is a concept storefront. Checkout records a mock order and updates stock; no
              payment is collected and no physical delivery is arranged.
            </p>
          </section>
          <section id="sizing">
            <h2>Finding your fit</h2>
            <SizeGuide />
          </section>
          <section id="care">
            <h2>A little care goes a long way</h2>
            <p>
              Natural materials appreciate a gentle approach. Air your pieces between wears, avoid
              overwashing, and always follow the care instructions on the garment.
            </p>
            <div className="accordion">
              <details>
                <summary>Wool & cashmere</summary>
                <div>
                  Store folded to protect the shape. Use a soft garment brush and remove pilling
                  gently with a cashmere comb. Professional dry cleaning is recommended for
                  structured pieces.
                </div>
              </details>
              <details>
                <summary>Cotton & poplin</summary>
                <div>
                  Wash on a gentle, cool cycle with similar colours. Reshape while damp, air dry,
                  and iron on a moderate setting if needed.
                </div>
              </details>
              <details>
                <summary>Leather objects</summary>
                <div>
                  Keep away from prolonged sunlight, heat and moisture. Wipe with a soft, dry cloth
                  and store in a breathable dust bag. Natural variations are part of the material’s
                  character.
                </div>
              </details>
            </div>
          </section>
          <section id="orders">
            <h2>Your considered selections</h2>
            <p>
              Sign in before placing your mock order to see it in your account. Your wishlist is
              saved to your account when signed in, so you can return to it on another device.
            </p>
            <Link className="text-link" href="/account">
              Visit your account
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
