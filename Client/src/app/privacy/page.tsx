export const metadata = { title: 'Privacy' };
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Your information, considered</p>
        <h1>Privacy.</h1>
        <p>Last updated 31 October 2026</p>
      </div>
      <div className="legal-content">
        <h2>About this storefront</h2>
        <p>
          Atelier Lune is a concept fashion storefront connected to Stripe test mode. Account,
          wishlist, newsletter and order features store data in this project’s database. No real
          funds are charged and no physical fulfilment takes place.
        </p>
        <h2>What is stored</h2>
        <p>
          Creating an account stores your name, email and a securely hashed password. An order
          stores your selection and the contact and shipping details you provide. Newsletter signup
          stores your email address; this application does not send marketing emails.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          A strictly necessary, HTTP-only session cookie keeps you signed in for up to seven days.
          Your bag and guest wishlist use browser local storage. This application does not include
          advertising cookies or analytics trackers.
        </p>
        <h2>Your choices</h2>
        <p>
          You can sign out at any time and remove individual saved pieces or bag items. Clearing
          browser storage removes your local bag and guest wishlist. Account and order records
          remain in the project database; contact the operator of the deployment for data access or
          deletion requests.
        </p>
        <h2>Third-party services</h2>
        <p>
          Stripe processes test payments on its hosted checkout page. We send Stripe the order
          reference, email, product names, quantities and prices. Card details are handled by Stripe
          and are never stored in our database. We retain the checkout session reference, payment
          status and payment reference so an order can be verified and reconciled. Stripe’s own
          privacy policy applies to information entered on its payment page.
        </p>
        <p>
          Product photographs are served from this application. Selecting store directions opens
          Google Maps, which has its own privacy terms. The application uses self-hosted fonts and
          does not share your shopping data with map services.
        </p>
      </div>
    </>
  );
}
