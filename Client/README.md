# Atelier Lune storefront

Next.js 16 App Router, React 19, Redux Toolkit, React Query, React Hook Form / Zod, Framer Motion, GSAP, Lenis and Embla.

See [the root README](../README.md) for complete setup, environment variables, database preparation and verification.

From this directory:

```sh
npm run dev
npm run build
npm start
npm run lint
npm run test:e2e
npm run audit
```

The API is reached through a same-origin `/api` proxy configured by `API_URL`. Never put secrets in `NEXT_PUBLIC_*` variables. Runtime product and editorial photographs live in `public/images`; asset provenance is documented in [ASSETS.md](docs/ASSETS.md).

Checkout redirects to Stripe-hosted test payment. The return page retrieves an authorized server-verified receipt and only removes purchased quantities from the bag after successful payment. Cancellation keeps the bag. A Stripe publishable key is unnecessary for this hosted redirect flow; secret keys belong exclusively on the API.

Photography uses native proportions, dedicated desktop/mobile hero compositions and a hotspot overlay measured against the complete image bounds. The content seed supplies 24 distinct product photographs, eight collections, twelve journal posts and three lookbooks. Run `node scripts/image-manifest.mjs` after adding bundled photographs to record their intrinsic dimensions.

`/admin` provides nine protected management sections, including image uploads, journal scheduling, chapter/product-point editing, stores, fulfilment, audience export and storefront copy. Uploads use multipart requests through the same-origin proxy. See the root README for the generated local administrator access file.
