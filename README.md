# Living Oils store website + Android app starter

## Included
- Responsive mobile-first store inspired by the supplied screenshots
- Telugu product names, editable products/prices in `app.js`
- Cart quantity controls and estimated total
- WhatsApp checkout with a prefilled itemised order message
- Installable PWA manifest and basic offline cache
- SVG product illustrations and brand mark

## 1. Configure the WhatsApp order number
Open `app.js` and replace:
`const WHATSAPP_NUMBER = "919676274545";`
with the shop's WhatsApp number in international digits-only format. Example for an Indian number: `919876543210` (91 + 10-digit mobile number). Do not include `+`, spaces, or hyphens.

## 2. Update products and prices
Edit the `products` array at the top of `app.js`. Prices are based on the supplied screenshot for coconut, groundnut, white sesame, and sunflower; verify them before publishing. Black sesame and generic cold-pressed edible oil are set to 'Price on request' because their prices were not provided. Real product photos supplied by you are now included for coconut, black sesame, white sesame, sunflower, and generic cold-pressed edible oil. Groundnut still uses the placeholder illustration.

## 3. Preview locally
A service worker requires HTTP/HTTPS. From this folder run:
- `python -m http.server 8000`
- Open `http://localhost:8000`
Or use VS Code Live Server. WhatsApp checkout requires a real WhatsApp number and internet access.

## 4. Publish the website on Netlify
The project includes `netlify.toml`. Drag the extracted project folder into Netlify's manual deploy area, or connect a Git repository and set the publish directory to `.`. Use HTTPS so PWA installation works reliably.

## 5. Convert to an Android app with Capacitor
Install Node.js LTS and Android Studio first. In this project folder run:
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```
The project already includes `package.json` and `capacitor.config.json`. The app ID is `com.livingoils.store`; keep it unchanged after publishing. In Android Studio, wait for Gradle sync, test on a real device, then use **Build > Generate Signed Bundle / APK** to create a signed Android App Bundle (AAB) for Play Console. Do not change the app ID after publishing.

### Important
- Set the actual WhatsApp number before release.
- Replace sample SVG art with your real product photos and approved logo.
- Confirm prices, delivery terms, store address and privacy policy before publishing.
- This is a front-end starter. It does not store orders in a database or provide an admin dashboard.

## Brand assets added
- `assets/living-oils-logo.jpg`: official Living Oils logo supplied by the store owner; used in the site header and footer.
- `assets/living-oils-store.jpg`: supplied shop photo used in a new store showcase section.

## Cart access
A cart button is visible in the header on desktop and mobile. Its badge updates as items are added. Selecting it opens the cart panel to review product, pack size, quantity, estimated price, and WhatsApp checkout. The mobile bottom navigation also retains a Cart shortcut.

## Pack-size price display fix
Changing the pack-size dropdown now immediately updates the visible product price: 250 ml, 500 ml, or 1 litre. The cart line price and WhatsApp checkout continue to use the selected pack size and quantity.


## Storefront update (13 October 2026)
- Added customer name, phone, and delivery address form before WhatsApp checkout.
- Updated product pack sizes and fixed prices as specified in the implementation report.
- Cart totals and WhatsApp order lines use the selected pack size and quantity.
- Product image fitting and service-worker cache version updated.
