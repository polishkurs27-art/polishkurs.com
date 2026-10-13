// Page layout shared by all three language versions.
// t = content/<lang>.json, shared = content/shared.json, ctx = build-time values.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// In content files ==text== becomes a marker highlight and **text** becomes bold.
const rich = (s) =>
  esc(s).replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const icons = {
  logo: `<svg class="brand__icon" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#5B3FD0"/><path fill="#fff" d="M22 13H42A9 9 0 0 1 51 22V35A9 9 0 0 1 42 44H31L19 54V43.5A9 9 0 0 1 13 35V22A9 9 0 0 1 22 13Z"/><path fill="#DC143C" d="M13 28.5H51V35A9 9 0 0 1 42 44H31L19 54V43.5A9 9 0 0 1 13 35Z"/></svg>`,
  arrowDown: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 4v15m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tick: `<svg class="tick" viewBox="0 0 34 30" aria-hidden="true"><path pathLength="1" d="M4 15.5c3.4 3 5.8 6.200 7.800 10C16.200 16.500 22.500 8.500 31 3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4.200l2.600 1.600M5 4.500 2.800 6.700M19 4.500l2.200 2.200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  video: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="2.500" y="6" width="13" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15.500 10.500 6-3v9l-6-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.200v13.600a1 1 0 0 0 1.500.86l11.300-6.800a1 1 0 0 0 0-1.720L9.500 4.340A1 1 0 0 0 8 5.200z" fill="currentColor"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="1.500" y="5" width="21" height="14" rx="4.500" fill="currentColor"/><path d="m10 9 5.200 3-5.200 3z" fill="var(--icon-cut, #fff)"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.500" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.200" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.300" cy="6.700" r="1.300" fill="currentColor"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/></svg>`,
  doodleArrow: `<svg class="doodle" viewBox="0 0 120 70" aria-hidden="true"><path d="M6 14c28-12 66-6 86 30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M78 40l15 6 3-17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const price = (parts) =>
  `<p class="price">${parts
    .map((p, i) => `${i ? '<i> / </i>' : ''}<span>${esc(p)}</span>`)
    .join('')}</p>`;

const field = (id, label, attrs) =>
  `<label class="field" for="${id}"><span class="field__label">${esc(label)} <b aria-hidden="true">*</b></span>${attrs}</label>`;

export function renderPage(t, shared, ctx) {
  const { root, langs, videos, v } = ctx;
  const { site, social, form, offers } = shared;
  const home = (l) => `${root}${l.dir ? l.dir + '/' : ''}` || './';
  const abs = (l) => `${site.url}/${l.dir ? l.dir + '/' : ''}`;
  const self = langs.find((l) => l.code === t.code);
  const a = `${root}assets/`;
  const foreignSlogan = t.htmlLang === 'pl' ? '' : ' lang="pl"';

  const formOpen = (subject, extraHidden = '') => `
        <form class="form" action="${esc(form.endpoint)}" method="POST" data-form data-sending="${esc(t.forms.sending)}" data-success="${esc(t.forms.success)}" data-error="${esc(t.forms.error)}">
          <input type="hidden" name="access_key" value="${esc(form.accessKey)}">
          <input type="hidden" name="subject" value="${esc(subject)}">
          <input type="hidden" name="from_name" value="${esc(site.domain)}">
          <input type="hidden" name="Strona" value="${esc(t.label)}">${extraHidden}
          <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">`;

  const langSwitch = (cls) => `
      <div class="langs ${cls}" role="group" aria-label="${esc(t.nav.language)}">
        ${langs
          .map(
            (l) =>
              `<a href="${home(l)}" hreflang="${l.htmlLang}"${l.code === t.code ? ' aria-current="page"' : ''}>${l.label}</a>`
          )
          .join('')}
      </div>`;

  const socialLinks = (cls) => `
        <a class="${cls}" href="${esc(social.youtube)}" target="_blank" rel="noopener">${icons.youtube}<span>YouTube</span><small>${esc(social.handle)}</small></a>
        <a class="${cls}" href="${esc(social.instagram)}" target="_blank" rel="noopener">${icons.instagram}<span>Instagram</span><small>${esc(social.handle)}</small></a>`;

  const clip = (vd) =>
    `<a class="clip" href="https://www.youtube.com/shorts/${esc(vd.id)}" data-video="${esc(vd.id)}" target="_blank" rel="noopener" aria-label="${esc(t.videos.play)}${vd.title ? ': ' + esc(vd.title) : ''}"><img src="${vd.local ? a + vd.thumb : esc(vd.thumb)}" width="405" height="720" alt="" loading="lazy"><span class="clip__play">${icons.play}</span></a>`;

  const individualCard = (o) => `
        <article class="card">
          <h3 class="card__title">${esc(t.offers.individual.title)} <span class="card__level">${esc(o.level)}</span></h3>
          <p class="card__text">${rich(t.offers.individual.text[o.level])}</p>
          ${price(o.price)}
          <button class="btn btn--primary" type="button" data-signup data-offer="${esc(`${t.offers.individual.title} ${o.level}`)}">${esc(t.offers.individual.cta)}</button>
        </article>`;

  const eveningCard = `
        <article class="card">
          <h3 class="card__title">${esc(t.offers.evening.title)}</h3>
          <p class="card__text">${esc(t.offers.evening.text)}</p>
          <ul class="facts">
            ${t.offers.evening.details.map((d) => `<li>${esc(d)}</li>`).join('\n            ')}
          </ul>
          ${price(offers.evening.price)}
          <p class="card__note">${icons.clock}<span>${esc(t.offers.note)}</span></p>
          <button class="btn btn--primary" type="button" data-signup data-offer="${esc(t.offers.evening.title)}">${esc(t.offers.evening.cta)}</button>
        </article>`;

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.description)}">
<meta name="keywords" content="${esc(t.meta.keywords)}">
<link rel="canonical" href="${abs(self)}">
${langs.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${abs(l)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${site.url}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.domain)}">
<meta property="og:title" content="${esc(t.meta.ogTitle)}">
<meta property="og:description" content="${esc(t.meta.ogDescription)}">
<meta property="og:url" content="${abs(self)}">
<meta property="og:image" content="${site.url}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.meta.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F8F5FC">
<link rel="icon" href="${a}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${a}favicon-48.png" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="${a}apple-touch-icon.png">
<link rel="preload" href="${a}fonts/brygada-1918-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${a}styles.css?v=${v}">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#main">${esc(t.nav.skip)}</a>

<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="${home(self)}">${icons.logo}<span>${esc(site.brand)}</span></a>
    <nav class="nav" id="nav" aria-label="${esc(t.nav.menu)}">
      <a href="#o-mnie">${esc(t.nav.about)}</a>
      <a href="#terminy">${esc(t.nav.offers)}</a>
      <a href="#kurs">${esc(t.nav.course)}</a>
      <a href="#wideo">${esc(t.nav.videos)}</a>
      <a href="#kontakt">${esc(t.nav.contact)}</a>
    </nav>${langSwitch('top__langs')}
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="${esc(t.nav.menu)}">${icons.burger}</button>
  </div>
</header>

<main id="main">

  <section class="hero">
    <div class="wrap hero__in">
      <div class="hero__text">
        <h1 class="hero__title"${foreignSlogan}>${esc(t.hero.sloganA)} <em class="swipe">${esc(t.hero.sloganB)}</em></h1>
        <p class="hero__lead">${esc(t.hero.lead)}</p>
        <a class="btn btn--primary btn--big" href="#terminy">${esc(t.hero.cta)}${icons.arrowDown}</a>
        <p class="hero__online">${icons.video}<span>${esc(t.hero.online)} · ${esc(shared.online)}</span></p>
      </div>
      <figure class="snap">
        <picture>
          <source type="image/webp" srcset="${a}img/irena-520.webp 520w, ${a}img/irena-800.webp 800w" sizes="(min-width: 900px) 400px, 78vw">
          <img src="${a}img/irena-800.jpg" srcset="${a}img/irena-520.jpg 520w, ${a}img/irena-800.jpg 800w" sizes="(min-width: 900px) 400px, 78vw" width="800" height="1000" alt="${esc(t.hero.name)}" fetchpriority="high">
        </picture>
        <figcaption class="pen">${esc(t.hero.name)}</figcaption>
      </figure>
    </div>
    <div class="wrap">
      <svg class="stroke" viewBox="0 0 1000 24" preserveAspectRatio="none" aria-hidden="true"><path d="M6 13C150 5 290 19 470 11S810 6 994 13"/></svg>
    </div>
  </section>

  <section class="sec about" id="o-mnie">
    <div class="wrap about__in">
      <h2 class="sr-only">${esc(t.about.title)}</h2>
      <div class="about__video">${videos.length ? clip(videos[0]) : ''}</div>
      <div class="letter">
        <p class="letter__hi pen">${esc(t.about.greeting)}</p>
        ${t.about.paragraphs.map((p) => `<p>${rich(p)}</p>`).join('\n        ')}
        <a class="btn btn--ghost" href="#kontakt">${esc(t.contact.titleA)} ${esc(t.contact.titleB)}</a>
      </div>
    </div>
  </section>

  <section class="sec offers" id="terminy">
    <div class="wrap">
      <h2 class="sec__title">${esc(t.offers.title)}</h2>
      <div class="cards">${offers.individual.map(individualCard).join('')}${eveningCard}
      </div>
    </div>
  </section>

  <section class="sec course" id="kurs">
    <div class="wrap">
      <div class="sheet">
        <h2 class="sheet__title">${esc(t.course.title)}</h2>
        <ul class="checks">
          ${t.course.items.map((it, i) => `<li style="--i:${i}"><span class="box">${icons.tick}</span><span>${esc(it)}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>

  <section class="sec videos" id="wideo">
    <div class="wrap">
      <div class="videos__head">
        <h2 class="sec__title">${esc(t.videos.title)}</h2>
        <p class="videos__lead">${esc(t.videos.lead)}</p>
      </div>
      <ul class="reel">
        ${videos
          .map(
            (vd) =>
              `<li>${clip(vd)}</li>`
          )
          .join('\n        ')}
      </ul>
      <div class="videos__links">${socialLinks('btn btn--light')}
      </div>
    </div>
  </section>

  <section class="sec contact" id="kontakt">
    <div class="wrap contact__in">
      <div class="contact__head">
        <h2 class="contact__title">${esc(t.contact.titleA)} <em class="pen">${esc(t.contact.titleB)}</em></h2>
        ${icons.doodleArrow}
      </div>${formOpen('Pytanie ze strony polishkurs.com')}
          ${field('q-name', t.forms.name, `<input id="q-name" name="name" type="text" autocomplete="name" required>`)}
          ${field('q-email', t.forms.email, `<input id="q-email" name="email" type="email" autocomplete="email" required>`)}
          ${field('q-message', t.forms.message, `<textarea id="q-message" name="message" rows="4" required></textarea>`)}
          <button class="btn btn--primary" type="submit">${esc(t.forms.questionSubmit)}</button>
          <p class="form__status" role="status" aria-live="polite"></p>
        </form>
    </div>
  </section>

</main>

<footer class="foot">
  <div class="wrap foot__in">
    <a class="brand brand--light" href="${home(self)}">${icons.logo}<span>${esc(site.brand)}</span></a>
    <p class="foot__name">${esc(t.hero.name)} · ${esc(site.domain)}</p>
    <div class="foot__links">${socialLinks('foot__social')}
    </div>${langSwitch('langs--light')}
  </div>
</footer>

<dialog class="dlg" id="signup" aria-labelledby="signup-title">
  <div class="dlg__head">
    <h2 id="signup-title">${esc(t.forms.signupTitle)}</h2>
    <p>${esc(t.forms.signupLead)}</p>
    <button class="dlg__x" type="button" data-close aria-label="${esc(t.forms.close)}">${icons.close}</button>
  </div>
  <div class="dlg__body">
    <p class="dlg__offer pen" data-offer-label></p>${formOpen('Zapis na kurs — polishkurs.com', `
          <input type="hidden" name="Kurs" value="" data-offer-field>`)}
          ${field('s-name', t.forms.name, `<input id="s-name" name="name" type="text" autocomplete="name" required>`)}
          ${field('s-email', t.forms.email, `<input id="s-email" name="email" type="email" autocomplete="email" required>`)}
          ${field('s-phone', t.forms.phone, `<input id="s-phone" name="phone" type="tel" autocomplete="tel" required>`)}
          <button class="btn btn--primary" type="submit">${esc(t.forms.signupSubmit)}</button>
          <p class="form__status" role="status" aria-live="polite"></p>
        </form>
  </div>
</dialog>

<dialog class="player" id="player" aria-label="${esc(t.videos.title)}">
  <button class="dlg__x" type="button" data-close aria-label="${esc(t.forms.close)}">${icons.close}</button>
  <div class="player__frame" data-frame></div>
</dialog>

<script src="${a}main.js?v=${v}" defer></script>
</body>
</html>
`;
}
