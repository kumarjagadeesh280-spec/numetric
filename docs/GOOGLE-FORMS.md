# Saving form submissions, and showing reviews live

The site is static — Vercel serves files and nothing else. There is no server
to receive a form post, which is why the contact and review forms originally
only wrote to the visitor's own browser: **nobody at NUMETRIC ever received
them.**

This is the fix. Google Forms becomes the receiver, Google Sheets becomes the
database, and the published sheet is read straight back into the reviews
section. No backend, no build step, no monthly cost.

```
visitor fills the site's own form
        │  POST (no-cors)
        ▼
   Google Form  ──────────►  Google Sheet   ◄── you tick "Approved"
                                  │
                                  │  published as CSV
                                  ▼
              numetricinc.com reads it and renders live reviews
```

The site's own styled forms stay exactly as they are. Visitors never see a
Google Form.

---

## One-time setup (about 10 minutes)

### 1. Create the forms

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the placeholder code, paste in all of `tools/google-forms-setup.gs`.
3. Click **Run**, choose the `setUpNumetricForms` function.
4. Approve the permission prompt (it is your own account creating your own
   forms — "Advanced → Go to project" if Google shows an unverified-app warning).
5. Open **Execution log**. It prints a finished config block.

That creates two forms and one spreadsheet called
**NUMETRIC — Website Submissions** in your Drive.

### 2. Paste the config

Copy the printed `reviewForm` and `contactForm` blocks into the `CONFIG`
object at the top of `assets/site.js`, replacing the empty ones.

### 3. Publish the review sheet

Apps Script cannot do this step — it needs a human click.

1. Open the spreadsheet (its URL is in the log).
2. **File → Share → Publish to web**.
3. Left dropdown: the **Client Reviews** sheet — *not* "Entire document".
4. Right dropdown: **Comma-separated values (.csv)**.
5. **Publish**, copy the URL.
6. Paste it into `CONFIG.reviewSheetCsv` in `assets/site.js`.

### 4. Commit

`assets/site.js` is the only file that changed. Push it, and Vercel deploys.

---

## Moderating reviews

Open the **Client Reviews** sheet. Every submission arrives with the
**Approved** checkbox unticked, and an unticked row is invisible on the
website.

Tick the box → the review appears on numetricinc.com within a minute or two
(the CSV is cached briefly by Google). Untick it → it disappears again.

There is no publish step and nothing to commit. The sheet *is* the control.

> An empty Approved column is read as "this sheet was set up without
> moderation" and every row shows. Do not delete the column.

---

## What each config value does

| Key | What it is | Where it comes from |
|---|---|---|
| `googleReviewUrl` | Destination of the **Write a Google review** button next to the QR card | Scan the QR on your phone once and copy the address it opens |
| `reviewForm.action` | Google Form endpoint for reviews | Printed by the script — ends in `/formResponse` |
| `reviewForm.fields` | Maps site field → `entry.NNNN` | Printed by the script |
| `contactForm.*` | Same, for the contact form | Printed by the script |
| `reviewSheetCsv` | Published CSV of the review responses | Step 3 above |

Every one of these is optional. Leave a value blank and that feature falls
back to the old browser-local behaviour rather than breaking — which is how
the site behaves right now, before setup.

---

## Known limitations, stated plainly

**Submissions are fire-and-forget.** Google does not send CORS headers on
`/formResponse`, so the browser posts the form blind and cannot read the
reply. The site reports "sent", and the sheet is the actual proof. In
practice this is reliable; it is simply not *confirmable* from the page.

**The contact form is honest when unconfigured.** Until
`contactForm.action` is filled in, submitting shows an amber notice asking the
visitor to email `info@numetricinc.com` instead. It does not pretend a message
was delivered when it was not.

**Google reviews are not pulled in.** The QR card sends people *to* Google;
their reviews stay on Google. Displaying them on the site needs the Google
Places API — an API key, a billing account, and a cap of five reviews per
request. The live reviews on the page are the ones submitted through the site's
own form. Worth doing later if the Google profile builds up reviews, but it is
a different piece of work with a running cost.

**Spam.** A public Google Form has no captcha here. Moderation is the defence:
nothing appears until you tick Approved. If spam volume ever becomes annoying,
turn on "Limit to 1 response" or "Collect email addresses" in the form
settings.
