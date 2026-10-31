# Photography for the visual redesign

The original 28 new photographs were generated with the built-in `image_gen` tool, using the imagegen skill. The homepage revision adds the three compositions below. Final files are saved in `Client/public/images/`, encoded as WebP with Sharp without cropping. These are illustrative concept photographs, not evidence of real commercial products or locations.

The frontend uses intrinsic image dimensions and native aspect ratios. Desktop and mobile campaigns have separate compositions; product photographs use 3:4 portrait compositions. No artificial letterbox backgrounds are added. Generated garment photographs show complete silhouettes. Unrelated starter gallery images were removed; administrators can upload additional genuine product views.

## Homepage photography and proportions

Photography follows its native proportions inside a shared 90% page container. The campaign uses panoramic desktop, landscape tablet and portrait mobile versions. All eight collection cards share a 3:4 composition and distinct covers; the city and soft edits reuse `studio-tailoring.webp` and `studio-cardigan.webp`. The two added edits, After hours and Tailored ease, use `studio-dress.webp` and `studio-blazer.webp`. The lookbook pairs its original landscape photograph with an evergreen text panel. Materials pair a landscape study with three linked fabric stories, and the atelier pairs a full interior photograph with a six-city invitation. Image corners are subtly rounded throughout the site. Homepage section padding is 88px on desktop, 72px on tablet and 56px on mobile. Primary type sizes remain 72 / 44px on desktop and 44 / 34px on mobile, with all interface text at least 14px.

All three additional assets use the built-in `image_gen` tool; WebP encoding preserves the complete generated compositions.

- `Client/public/images/hero-coast-wide.webp` — edited from `hero-coast.webp`.
- `Client/public/images/campaign-editorial-wide.webp` — edited from `campaign-editorial.webp`.

Exact prompt for both panoramic edits:

> Edit this exact fashion photograph into an ultra-wide premium website banner with EXACT aspect ratio 8:3 (approximately 2400 by 900). Preserve this same woman, face, hair, clothing, full pose, photographic environment and refined natural light. Extend the setting horizontally and slightly recompose the camera view to make a graceful panoramic composition. Show the COMPLETE woman from the entire top of her hair to the soles of both shoes, with at least 12 percent clear headroom and 10 percent floor below the feet. Person placed in rightmost third, body no more than 75 percent of image height. Left 50 percent contains only the existing quiet architecture for live HTML typography, no text in the photo. Keep the image richly photographic and cinematic, no blank padding, no borders, no letterboxing, no artificial blur, no distorted anatomy. Do not crop any part of her body. Do not add lettering, logos or watermarks.

- `Client/public/images/home-material-study.webp` — edited from `studio-detail.webp`.

Exact material-study prompt:

> Edit this exact photograph into a LANDSCAPE 3:2 luxury fashion material-library editorial. Preserve the same complete stack of ivory cashmere, camel wool and cream silk, olive twig, wooden thread spool, tactile fabric textures and warm natural lighting. Recompose as a beautiful landscape tabletop still-life, with the entire stack centered and completely visible, every edge clear, generous 12 percent breathing room around all sides. Rich fine detail, elegant real plaster backdrop, gentle directional morning light and natural photographic shadows. The actual setting fills the image edge to edge. No words, no logos, no collage, no borders, no blank artificial padding. Full photographic composition, do not crop the stack.

## Campaign

- `Client/public/images/hero-coast.webp`

> Use case: photorealistic-natural. Asset type: gorgeous premium fashion website hero photograph, wide landscape exactly 16:9. A cinematic high-end contemporary fashion campaign for the fictional ATELIER LUNE. A beautiful adult woman with dark hair wearing a long softly structured rich espresso-brown wool coat, ivory silk shirt, stone tailored trousers and dark loafers walks on a sunlit travertine terrace overlooking a pale blue Mediterranean sea. Large sculptural curved pale limestone wall on the LEFT half with elegant sunlight and shadows, an olive branch shadow, refined sophisticated warm film color. The woman is in the RIGHT third, fully visible from the top of her hair to both complete shoes, at least 14% headroom and 12% floor below shoes; entire body stays in rightmost 35% of frame. Her body is no more than 68% of photo height. Wide architecture and subtle ocean horizon. Clear open bright stone space on left 48% for black editorial typography that will be added in HTML. Expensive analog medium format photography, tactile fabric, natural candid relaxed pose, fashion magazine quality, quiet cinematic grandeur and luminosity. No text, no collage, no typography, no watermarks, no border. Image must go edge to edge, natural real photographic environment with no blank padding. Do not crop head or feet.

- `Client/public/images/hero-coast-mobile.webp`

> Use case: photorealistic-natural. Asset type: portrait mobile premium fashion campaign, exact 3:4 aspect ratio. Fictional ATELIER LUNE autumn fashion editorial. A beautiful adult woman with dark brown hair in a long softly structured rich espresso-brown wool coat, ivory silk shirt, warm stone tailored trousers, dark leather loafers. She is walking naturally beside a magnificent sunlit curved pale travertine wall with glimpses of pale turquoise Mediterranean sea. Airy luminous expensive editorial atmosphere, gentle breeze, authentic natural proportions, full body from entire top of hair to both complete shoes. Model centered, complete body only 65 percent of image height, generous 18 percent headroom and 14 percent floor below shoes. Entire setting photographic and edge-to-edge. Warm pale stone, espresso coat and sea blue palette. Photorealistic medium format fashion magazine photography. No words, no logo, no text, no border, no collage.

## First studio series

The following exact template was used once per subject, substituting SUBJECT:

> Use case: product-mockup. Asset type: luxury fashion e-commerce product photography. A single editorial studio photograph of SUBJECT. Portrait composition exactly 3:4. The entire garment or object is centered and occupies only the middle 66% width and 70% height, generous breathing room on every side. Seamless pale warm off-white plaster photography backdrop filling the entire image edge to edge, gentle directional daylight from upper left and natural soft shadows, realistic tactile premium fabric, warm neutral editorial color, expensive contemporary Parisian fashion brand style. Crisp photographic detail. No people, no mannequins, no words, no labels, no logos, no watermarks, no borders, no collage, no blank artificial padding. One single photograph, one product.

- `Client/public/images/studio-coat.webp`: A beautifully structured camel wool long coat with wide lapels, full front view on an understated dark wooden hanger, coat fully visible including collar and lower hem.
- `Client/public/images/studio-knit.webp`: An ivory cashmere crewneck sweater with beautiful ribbed collar and cuffs, front view laid flat with natural soft folds, full sweater including both sleeves visible.
- `Client/public/images/studio-dress.webp`: A flowing dark espresso silk midi dress with thin straps, full dress on an understated wooden hanger, entire neckline and lower hem visible.
- `Client/public/images/studio-tailoring.webp`: A pair of elegant deep charcoal wide-leg tailored trousers, flat lay from the full waistband to both complete cuffs, beautifully pressed wool creases.
- `Client/public/images/studio-bag.webp`: A small sculptural cognac-brown leather shoulder bag with fine brass hardware and beautiful softly rounded shape, full strap and bag entirely visible.
- `Client/public/images/studio-linen.webp`: A beautiful ivory linen relaxed long-sleeve button-down shirt, neatly arranged flat lay with open collar, every sleeve and hem fully visible.
- `Client/public/images/studio-leather.webp`: An espresso brown leather jacket with a simple elegant collar, complete front view on a dark wooden hanger, all sleeves and hem visible.
- `Client/public/images/studio-detail.webp`: A beautiful folded stack of cream cashmere, warm camel wool and ivory silk, considered closeup of tactile fabrics with a small wooden spool and delicate dried olive branch.

## Extended product series

The following exact template was used once per subject, substituting SUBJECT:

> Use case: product-mockup. Asset type: premium fashion product photograph. One single photograph of SUBJECT. Portrait exactly 3:4 aspect ratio. The entire garment or object fully visible including all sleeves, collar, hems, straps or edges; centered in the middle 64% of image width and 72% of image height. Plenty of breathing room. Seamless light warm off-white plaster studio backdrop filling edge to edge, soft directional daylight from upper left with delicate olive branch shadows. Extremely realistic tactile material, considered restrained Parisian luxury e-commerce art direction, warm natural tones, crisp expensive photographic detail. No person, no mannequin, no text, no brand labels, no logos, no watermark, no borders, no collage. Do not crop any part of the object.

- `Client/public/images/studio-blazer.webp`: an elegantly tailored warm charcoal wool single-breasted blazer with notch lapels and two pockets on a wooden hanger.
- `Client/public/images/studio-cardigan.webp`: a beautifully soft oatmeal cashmere button-front cardigan with a V neckline, front view laid flat.
- `Client/public/images/studio-wrap.webp`: a long soft double-face warm stone wool wrap coat with a loose matching belt, on a wooden hanger.
- `Client/public/images/studio-trench.webp`: a long classic sand cotton-gabardine trench coat with a belt, storm flap and double-breasted buttons, on a wooden hanger.
- `Client/public/images/studio-merino.webp`: a fine-gauge dark espresso merino wool crewneck sweater, arranged flat.
- `Client/public/images/studio-rib.webp`: a fine ivory rib-knit fitted long-sleeve top with simple round neckline, arranged flat.
- `Client/public/images/studio-oxford.webp`: a relaxed pale blue cotton Oxford shirt with a point collar and delicate white buttons, arranged flat.
- `Client/public/images/studio-silk.webp`: a refined cream silk blouse with a soft open collar and a quiet luminous fluid drape, on a wooden hanger.
- `Client/public/images/studio-daydress.webp`: a fluid dark navy long-sleeved midi day dress with an understated waist seam and full length skirt, on a wooden hanger.
- `Client/public/images/studio-wrapdress.webp`: a beautiful warm dark chocolate wrap midi dress with a V neckline and slender matching waist tie, on a wooden hanger.
- `Client/public/images/studio-scarf.webp`: a long warm oatmeal cashmere scarf loosely folded into an elegant curve, both ends and small fringes fully visible.
- `Client/public/images/studio-belt.webp`: a slim dark brown smooth leather belt arranged in an elegant oval with a simple brushed brass buckle, complete belt visible.
- `Client/public/images/studio-pouch.webp`: a small espresso leather zip pouch with beautiful fine stitching and a simple brass zip, complete object visible.
- `Client/public/images/studio-knitvest.webp`: a soft oatmeal V-neck sleeveless wool knit vest with beautiful ribbed edges, front view laid flat.
- `Client/public/images/studio-mockneck.webp`: an ivory fine merino wool long-sleeve mock-neck top, beautiful knitted neck and cuffs, front view laid flat.
- `Client/public/images/studio-tee.webp`: a thick ivory organic cotton short-sleeve crew-neck T-shirt with beautifully structured shoulders, arranged flat.
- `Client/public/images/studio-overshirt.webp`: a relaxed olive-green wool overshirt with a simple point collar, two patch chest pockets and dark buttons, on a wooden hanger.
- `Client/public/images/studio-poplin.webp`: a crisp pure white cotton poplin button-down shirt with a neat point collar and beautiful clean seams, arranged flat.
