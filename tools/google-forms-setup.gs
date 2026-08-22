/**
 * NUMETRIC — one-shot Google Forms + Sheet setup
 * ---------------------------------------------------------------------------
 * Run this ONCE in Google Apps Script (script.google.com) and it will:
 *
 *   1. create the "Client Reviews" and "Contact Enquiries" forms,
 *   2. link both to a single spreadsheet,
 *   3. add an Approved column to the reviews tab so nothing reaches the
 *      website unmoderated,
 *   4. print the finished CONFIG block for assets/site.js into the log.
 *
 * The only thing it cannot do for you is publish the sheet to the web —
 * Apps Script has no API for that. Step 5 of docs/GOOGLE-FORMS.md is that
 * click, and it takes about fifteen seconds.
 *
 * HOW TO RUN
 *   script.google.com → New project → paste this file over the placeholder
 *   → Run → `setUpNumetricForms` → approve the permission prompt
 *   → View → Logs (or Execution log) → copy what it printed.
 *
 * Safe to re-run: it creates NEW forms each time, so run it once and keep
 * the output. Delete the extras from Drive if you run it twice.
 */

/* Sentinel values let us recover each field's `entry.NNNN` id by prefilling
   the form and reading the ids back out of the resulting URL. There is no
   direct getter for them in the Apps Script API. */
var SENTINEL = '__NM_FIELD__';

function setUpNumetricForms() {
  var ss = SpreadsheetApp.create('NUMETRIC — Website Submissions');

  var reviews = buildForm_({
    title: 'NUMETRIC — Client Reviews',
    description: 'Worked with NUMETRIC? Your review helps other professionals decide. '
               + 'Reviews are published on numetricinc.com after moderation.',
    spreadsheet: ss,
    items: [
      { key: 'name',    title: 'Your Name',      type: 'text',      required: true },
      { key: 'company', title: 'Firm / Company', type: 'text',      required: true },
      { key: 'rating',  title: 'Rating',         type: 'scale',     required: true },
      { key: 'text',    title: 'Your Review',    type: 'paragraph', required: true }
    ]
  });

  var contact = buildForm_({
    title: 'NUMETRIC — Contact Enquiries',
    description: 'Enquiries submitted from numetricinc.com.',
    spreadsheet: ss,
    items: [
      { key: 'name',    title: 'Full Name',      type: 'text',      required: true },
      { key: 'email',   title: 'Email Address',  type: 'text',      required: true },
      { key: 'company', title: 'Firm / Company', type: 'text',      required: false },
      { key: 'country', title: 'Country',        type: 'text',      required: false },
      { key: 'message', title: 'Message',        type: 'paragraph', required: true }
    ]
  });

  addApprovedColumn_(ss, reviews.form);

  Logger.log(renderConfig_(reviews, contact, ss));
  return ss.getUrl();
}

/* ── form construction ──────────────────────────────────────────────────── */

function buildForm_(spec) {
  var form = FormApp.create(spec.title);
  form.setDescription(spec.description);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);

  /* Only meaningful on a Workspace account; throws on consumer Gmail, where
     forms are already open to anyone. Either way the visitor must not be
     asked to sign in to leave a review. */
  try { form.setRequireLogin(false); } catch (e) {}

  var built = spec.items.map(function (item) {
    if (item.type === 'paragraph') {
      var p = form.addParagraphTextItem().setTitle(item.title).setRequired(item.required);
      return { spec: item, item: p };
    }
    if (item.type === 'scale') {
      var s = form.addScaleItem().setTitle(item.title)
                  .setBounds(1, 5).setLabels('Poor', 'Excellent')
                  .setRequired(item.required);
      return { spec: item, item: s };
    }
    var t = form.addTextItem().setTitle(item.title).setRequired(item.required);
    return { spec: item, item: t };
  });

  form.setDestination(FormApp.DestinationType.SPREADSHEET, spec.spreadsheet.getId());

  return {
    form: form,
    action: form.getPublishedUrl().replace(/viewform.*$/, 'formResponse'),
    fields: resolveEntryIds_(form, built)
  };
}

/**
 * Recovers the `entry.NNNN` name of every field.
 *
 * Text fields get a unique sentinel string, so they can be matched by value.
 * A scale field only accepts a number, so it is matched by elimination —
 * whatever entry id is left over once the sentinels are accounted for.
 */
function resolveEntryIds_(form, built) {
  var response = form.createResponse();
  var sentinels = {};

  built.forEach(function (b, i) {
    if (b.spec.type === 'scale') {
      response.withItemResponse(b.item.asScaleItem().createResponse(3));
    } else if (b.spec.type === 'paragraph') {
      var pv = SENTINEL + i;
      sentinels[pv] = b.spec.key;
      response.withItemResponse(b.item.asParagraphTextItem().createResponse(pv));
    } else {
      var tv = SENTINEL + i;
      sentinels[tv] = b.spec.key;
      response.withItemResponse(b.item.asTextItem().createResponse(tv));
    }
  });

  var url = response.toPrefilledUrl();
  var fields = {};
  var claimed = {};

  /* entry.123456=__NM_FIELD__0 → { name: '123456' } */
  var re = /entry\.(\d+)=([^&]*)/g;
  var m;
  var leftovers = [];
  while ((m = re.exec(url)) !== null) {
    var id = m[1];
    var value = decodeURIComponent(m[2].replace(/\+/g, ' '));
    if (sentinels[value] && !claimed[id]) {
      fields[sentinels[value]] = 'entry.' + id;
      claimed[id] = true;
    } else {
      leftovers.push('entry.' + id);
    }
  }

  built.forEach(function (b) {
    if (!fields[b.spec.key] && leftovers.length) fields[b.spec.key] = leftovers.shift();
  });

  return fields;
}

/* ── moderation column ──────────────────────────────────────────────────── */

/**
 * Adds "Approved" to the right of the review response columns. A blank cell
 * means not approved, so a new review is invisible on the site until someone
 * types TRUE next to it. The website treats a missing column as "no
 * moderation configured", which is why this must exist.
 */
function addApprovedColumn_(ss, reviewForm) {
  var sheet = null;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getFormUrl() === reviewForm.getEditUrl().replace(/\/edit.*$/, '/viewform')
        || /Client Reviews/i.test(sheets[i].getName())) {
      sheet = sheets[i];
      break;
    }
  }
  if (!sheet) sheet = sheets[0];

  var lastCol = sheet.getLastColumn();
  sheet.getRange(1, lastCol + 1).setValue('Approved').setFontWeight('bold');
  sheet.setName('Client Reviews');

  /* A checkbox is far less error-prone than asking someone to type TRUE. */
  sheet.getRange(2, lastCol + 1, Math.max(sheet.getMaxRows() - 1, 1), 1)
       .insertCheckboxes();
}

/* ── output ─────────────────────────────────────────────────────────────── */

function renderConfig_(reviews, contact, ss) {
  var f = function (map) {
    return Object.keys(map).map(function (k) {
      return "            " + k + ": '" + map[k] + "'";
    }).join(',\n');
  };

  return [
    '',
    '════════════════════════════════════════════════════════════════════',
    ' PASTE THIS INTO assets/site.js — replace the CONFIG block near the top',
    '════════════════════════════════════════════════════════════════════',
    '',
    "    reviewForm: {",
    "        action: '" + reviews.action + "',",
    "        fields: {",
    f(reviews.fields),
    "        }",
    "    },",
    '',
    "    contactForm: {",
    "        action: '" + contact.action + "',",
    "        fields: {",
    f(contact.fields),
    "        }",
    "    },",
    '',
    '════════════════════════════════════════════════════════════════════',
    ' STILL TO DO BY HAND (Apps Script cannot publish a sheet):',
    '   1. Open: ' + ss.getUrl(),
    '   2. File → Share → Publish to web',
    '   3. Choose the "Client Reviews" sheet, format "Comma-separated values"',
    '   4. Publish, copy the URL, and paste it into CONFIG.reviewSheetCsv',
    '',
    ' Live review forms (for your own reference):',
    '   Reviews: ' + reviews.form.getPublishedUrl(),
    '   Contact: ' + contact.form.getPublishedUrl(),
    '════════════════════════════════════════════════════════════════════'
  ].join('\n');
}
