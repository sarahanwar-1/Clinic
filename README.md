# Meridian Family Clinic website

Plain HTML, CSS and JavaScript. No build step. Works on GitHub Pages as is.

```
index.html      page content, SEO tags, structured data
style.css       all styling (light and dark themes are tokens at the top)
script.js       theme toggle, open-now badge, booking form, animations
robots.txt      keep this name lowercase
sitemap.xml     keep this name lowercase
assets/         favicon.svg, og-image.png (social preview, 1200 x 630)
```

## Make it yours

Search `index.html` for these and replace them. Each appears in more than one place
(page text, structured data, and the meta tags in the head).

| Replace | With |
| --- | --- |
| `Meridian Family Clinic`, `Meridian` | your clinic name |
| `(555) 010-0123`, `+15550100123`, `+1-555-010-0123` | your phone number |
| `hello@meridianclinic.example` | your email |
| `123 Main Street`, `Your City`, `ST`, `A1A 1A1` | your address |
| `https://www.meridianclinic.example/` | your real website address (also in `robots.txt` and `sitemap.xml`) |

Also replace the sample content: the four doctors, the three numbers in "What you can
count on", the visit lengths in Services, and the FAQ answers. Only publish claims that
are true for your clinic.

## Opening hours

Edit the rows in the hours table in `index.html` (`data-open` and `data-close` use 24-hour
time, an empty value means closed). The booking form, the open-now badge and the highlighted
"Today" row all read from that table. Update the `openingHoursSpecification` block in the
structured data at the top of `index.html` to match.

## Receive booking requests

The form works as a demo until you give it somewhere to send requests. Set the endpoint on the
form in `index.html`:

```html
<form id="booking-form" ... data-endpoint="https://formspree.io/f/your-id">
```

Any service that accepts a JSON POST works (Formspree, Getform, a Google Apps Script web app,
or your own server). With the endpoint empty, the form shows a confirmation that says nothing
was sent. Once an endpoint is set, that note disappears.

The form asks visitors not to share medical details. Keep it that way unless your form
service is approved for health information in your region.

## Clock and time zone

In `script.js`, set `CONFIG.timeZone` (for example `'America/Edmonton'`) so open-now and
available times follow the clinic's clock instead of each visitor's.

## Map

The map in the Hours section is a placeholder drawing. To use a real map, replace the
`<div class="map">` block with your embed from Google Maps (Share, then Embed a map).

## Colors

Palette from Color Hunt: `#071B2B` navy, `#167D8D` teal, `#B9E4E8` aqua, `#EEEEEE` mist.
Darker and lighter shades are derived from these for text contrast. Change them in the `:root`
blocks at the top of `style.css`.

## Publish on GitHub Pages

1. Upload every file, keeping the `assets` folder.
2. Repository Settings, Pages, deploy from the `main` branch.
3. Wait a minute, then hard refresh (Ctrl+F5).
