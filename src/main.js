(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Mobile menu
  const burger = $('.burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  // Dialogs: close button and click on the backdrop
  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => e.target === dlg && dlg.close());
    $$('[data-close]', dlg).forEach((btn) => btn.addEventListener('click', () => dlg.close()));
  });

  // Sign-up popup remembers which offer was clicked
  const signup = $('#signup');
  $$('[data-signup]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const form = $('form', signup);
      const status = $('.form__status', form);
      form.classList.remove('is-sent');
      status.className = 'form__status';
      status.textContent = '';
      $('[data-offer-field]', signup).value = btn.dataset.offer;
      $('[data-offer-label]', signup).textContent = btn.dataset.offer;
      signup.showModal();
    })
  );

  // Forms are sent in the background; without JS they post normally
  $$('[data-form]').forEach((form) => {
    const status = $('.form__status', form);
    const submit = $('button[type=submit]', form);
    const label = submit.textContent;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;
      status.className = 'form__status';
      status.textContent = '';
      submit.disabled = true;
      submit.textContent = form.dataset.sending;
      try {
        if (!data.access_key) throw new Error('Form access key is missing (content/shared.json -> form.accessKey)');
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.success) throw new Error(out.message || `HTTP ${res.status}`);
        form.reset();
        form.classList.add('is-sent');
        status.classList.add('is-ok');
        status.textContent = form.dataset.success;
      } catch (err) {
        console.error(err);
        status.classList.add('is-err');
        status.textContent = form.dataset.error;
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });

  // Videos open in a popup player; nothing is loaded from YouTube before that
  const player = $('#player');
  const frame = $('[data-frame]', player);
  $$('[data-video]').forEach((link) =>
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = link.getAttribute('aria-label');
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.replaceChildren(iframe);
      player.showModal();
    })
  );
  player.addEventListener('close', () => frame.replaceChildren());

  // Checklist ticks draw themselves when scrolled into view
  const checks = $('.checks');
  if (checks && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        checks.classList.add('is-in');
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(checks);
  } else if (checks) {
    checks.classList.add('is-in');
  }
})();
