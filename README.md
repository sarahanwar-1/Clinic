# Nova Clinic — responsive website demo

A premium, editable static HTML/CSS/JavaScript website concept featuring:

- Full-screen clinic hero and fixed translucent navigation
- Services cards using the five photos supplied by the user
- Team section with text-only role placeholders (no fictional doctor names, photos, or credentials)
- Feedback slider with **clearly labelled illustrative copy**, not real reviews
- Contact call-to-action and footer
- Mobile menu, scroll reveals, reduced-motion support, keyboard controls and accessible dialog

## Preview

Open `index.html` in a web browser. For the most reliable local preview, serve the folder using a local web server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Customize

Edit `index.html` for content, `styles.css` for styling, and `script.js` for interactions.
All photos are in `assets/` and are bundled locally; fonts use Google Fonts when online with offline fallbacks.

## Important before publishing

This is a **design demo**, not a working booking or feedback collection system. Appointment buttons explain that booking is unconnected. Team descriptions, services and quote examples are placeholders, not verified real-world information. Replace with the clinic's confirmed details. Never publish the illustrative quotes as genuine patient reviews.

The four service images and the original reception photo are the user's supplied low-resolution clinic images. The hero uses a cropped portion of the **previously created Nova Clinic concept image** (not a real photograph of the clinic). Replace this hero with a licensed or approved high-resolution actual clinic image for production. Images `reception-original.webp`, `waiting-area.webp`, `consultation-room.webp`, `treatment-room.webp` and `clinical-suite.webp` are included as supplied reference photos.

## Palette

- Navy: `#071B2B`
- Teal: `#167D8D`
- Pale Aqua: `#B9E4E8`
- Light Grey: `#EEEEEE`
