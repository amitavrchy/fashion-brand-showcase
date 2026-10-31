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

The API is reached through a same-origin `/api` proxy configured by `API_URL`. Never put secrets in `NEXT_PUBLIC_*` variables. Runtime product and editorial photographs live in `public/images`; asset provenance is documented in [ASSETS.md](../ASSETS.md).
