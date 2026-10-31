export const metadata = { title: 'Terms' };
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">A clear understanding</p>
        <h1>Terms of use.</h1>
        <p>Last updated 31 October 2026</p>
      </div>
      <div className="legal-content">
        <h2>A concept, brought to life</h2>
        <p>
          Atelier Lune is a demonstration of a contemporary fashion storefront. The brand narrative,
          boutique locations, product descriptions and commercial policies are illustrative.
          Photographs are used as editorial references and may differ from product descriptions.
        </p>
        <h2>Orders and Stripe test payments</h2>
        <p>
          Checkout creates an order and reserves available inventory before redirecting to Stripe’s
          secure test payment page. An order is marked paid only after server-side payment
          verification. Cancelled or expired payments release reserved stock. Test payments do not
          move real funds, create a binding sale or arrange physical delivery.
        </p>
        <h2>Pricing and availability</h2>
        <p>
          Prices are displayed in euros, inclusive of illustrative VAT. Delivery is €15 below €300
          and complimentary at or above €300. The server confirms prices and stock when an order is
          submitted; items in a bag are not reserved.
        </p>
        <h2>Your account</h2>
        <p>
          Use a unique password and keep your sign-in details private. Please use sample shipping
          information when exploring test checkout. Administrative access is restricted to accounts
          provisioned by the project operator.
        </p>
        <h2>Using the site</h2>
        <p>
          Please use the storefront respectfully. Do not attempt to access another person’s account,
          interfere with the service, or submit information you do not have permission to use.
        </p>
      </div>
    </>
  );
}
