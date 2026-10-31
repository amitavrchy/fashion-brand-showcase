# Editorial assets

All runtime photographs are served from `Client/public/images`. Fonts are self-hosted by `next/font` (Manrope and Cormorant Garamond). Interface icons use Lucide; the monogram is repository-native SVG.

The current visual redesign adds **28 generated photographs**, including separate coastal desktop/mobile campaigns and 24 distinct product views. Saved paths and complete prompt sets are recorded in [DESIGN_ASSETS.md](DESIGN_ASSETS.md). These replace the unrelated starter product images. Photographs now flow at their native proportions, with no letterbox backgrounds; curated product frames use matching 3:4 photographs.

## Generated campaign

- Asset: `Client/public/images/campaign-editorial.webp`
- Tool: built-in `image_gen` (imagegen skill), then WebP encoding with Sharp.
- Purpose: wide autumn/winter campaign with space for live HTML typography. The photograph is a fictional editorial reference for this concept storefront.
- Final prompt:

> Use case: photorealistic-natural. Asset type: a real wide 16:9 fashion campaign photograph for ATELIER LUNE, a contemporary luxury ready-to-wear concept brand. A beautiful cinematic European fashion editorial. On the right third of the composition, a stylish adult woman in a long sculptural camel-beige double faced wool coat, dark espresso tailored trousers, ivory knit, natural undone dark hair, walking slowly beside monumental warm limestone architecture and rough plaster. Full body including head, graceful believable anatomy, candid restrained pose, looking slightly away. The left half of the frame is quiet textured warm taupe stone wall and soft deep shadow with abundant uncluttered space for an HTML heading that will be added later. Overcast autumn daylight, tactile wool, rich film grain, realistic analog medium format photography, high-end understated editorial art direction. Colors warm stone, dark chocolate, soft ivory, muted olive. Photographic image only. No text, no lettering, no logos, no collage, no borders. Keep model clearly in right half, visible head, architectural wall in left half. Landscape composition.

## Stock editorial references

The second responsive campaign also uses `Client/public/images/campaign-portrait.webp` and its 900px delivery version, `campaign-portrait-optimized.webp`. The portrait was edited from the generated wide campaign with built-in `image_gen` and encoded to WebP with Sharp. Full composition is preserved through intrinsic image proportions, and hover zoom cropping is disabled.

Portrait edit prompt:

> Edit this ATELIER LUNE fashion editorial into a portrait 4:5 campaign photograph for a mobile website. Preserve the woman, her camel wool coat, ivory knit and espresso trousers, the limestone architecture, natural light and photographic texture. Recompose and extend the environment as needed. Show her complete body from the entire top of her hair to the soles of her shoes. Leave generous 10% clear headroom above the hair and 8% breathing room below the feet, no person or garment touching an edge. Calm full-length editorial portrait, subject centered in the full composition, beautiful natural proportions. No text, no logos, no borders. This will be displayed with object-fit contain so the entire photograph remains visible.

Unsplash source image IDs (downloaded with width 1600 and quality 85):

| Local asset      | Source                                                       |
| ---------------- | ------------------------------------------------------------ |
| coat.jpg         | https://images.unsplash.com/photo-1539109136881-3be0616acf4b |
| dress.jpg        | https://images.unsplash.com/photo-1539008835657-9e8e9680c956 |
| knit.jpg         | https://images.unsplash.com/photo-1434389677669-e08b4cac3105 |
| tailoring.jpg    | https://images.unsplash.com/photo-1591047139829-d91aecb6caea |
| bag.jpg          | https://images.unsplash.com/photo-1548036328-c9fa89d128fa    |
| detail.jpg       | https://images.unsplash.com/photo-1598554747436-c9293d6a588f |
| landscape.jpg    | https://images.unsplash.com/photo-1470770841072-f978cf4d019e |
| atelier.jpg      | https://images.unsplash.com/photo-1441986300917-64674bd600d8 |
| linen.jpg        | https://images.unsplash.com/photo-1596755094514-f87e34085b2c |
| shirts.jpg       | https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf |
| leather.jpg      | https://images.unsplash.com/photo-1551028719-00167b16eac5    |
| studio.jpg       | https://images.unsplash.com/photo-1497366811353-6870744d04b2 |
| architecture.jpg | https://images.unsplash.com/photo-1600210492486-724fe5c67fb0 |

The five expanded editorial references were downloaded at width 1400 and quality 85. Human subjects were checked for complete heads; a cropped-head reference was rejected and is not included.

Before a commercial launch, replace illustrative product and boutique photography with the brand’s actual catalog and location assets.
