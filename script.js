(function () {
  'use strict';

  /* ===== CONFIG: replace with your own WhatsApp number (country code + number, digits only) ===== */
  var WHATSAPP_NUMBER = '15550137788';

  document.documentElement.classList.add('js');
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Mobile navigation ---------- */
  var header = $('header'), burger = $('burger'), links = $('nav-links');
  function setMenu(open) {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 960) setMenu(false); });

  function onScroll() { header.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active link + scroll reveal ---------- */
  var navLinks = links.querySelectorAll('a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'services', 'barbers', 'gallery', 'reviews', 'contact'].forEach(function (id) {
      var s = $(id); if (s) spy.observe(s);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Image fallback (no broken images) ---------- */
  document.querySelectorAll('img').forEach(function (img) {
    function fail() { img.parentElement.classList.add('img-fallback'); }
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  });

  /* ---------- Service filters ---------- */
  var chips = document.querySelectorAll('.chip');
  var rows = document.querySelectorAll('#ledger li');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      rows.forEach(function (li) { li.hidden = !(f === 'all' || li.dataset.cat === f); });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  var box = $('lightbox'), lbImg = $('lb-img'), lbCap = $('lb-cap');
  var items = Array.prototype.slice.call(document.querySelectorAll('.g-item'));
  var current = 0, opener = null;
  function show(i) {
    current = (i + items.length) % items.length;
    var img = items[current].querySelector('img');
    lbImg.src = img.currentSrc.replace(/w=\d+/, 'w=1400') || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt + ' (' + (current + 1) + ' of ' + items.length + ')';
  }
  function openBox(i, trigger) {
    opener = trigger;
    show(i);
    if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
    $('lb-close').focus();
  }
  function closeBox() {
    if (typeof box.close === 'function') box.close(); else box.removeAttribute('open');
    if (opener) opener.focus();
  }
  items.forEach(function (btn, i) { btn.addEventListener('click', function () { openBox(i, btn); }); });
  $('lb-close').addEventListener('click', closeBox);
  $('lb-prev').addEventListener('click', function () { show(current - 1); });
  $('lb-next').addEventListener('click', function () { show(current + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  /* ---------- Booking form ---------- */
  var form = $('book-form'), status = $('status');
  var dateEl = $('date'), timeEl = $('time'), serviceEl = $('service');

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var today = iso(new Date());
  dateEl.min = today;

  function label(mins) {
    var h = Math.floor(mins / 60), m = mins % 60, ap = h >= 12 ? 'pm' : 'am';
    return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }
  /* Hours: Mon-Fri 9-19, Sat 9-17, Sun closed. Last slot starts 30 minutes before closing. */
  function buildTimes() {
    var prev = timeEl.value;
    timeEl.innerHTML = '';
    if (!dateEl.value) { timeEl.innerHTML = '<option value="">Choose a date first</option>'; return; }
    var day = new Date(dateEl.value + 'T00:00:00').getDay();
    if (day === 0) { timeEl.innerHTML = '<option value="">Closed on Sundays</option>'; return; }
    var end = (day === 6 ? 17 : 19) * 60 - 30;
    timeEl.add(new Option('Choose a time', ''));
    for (var m = 9 * 60; m <= end; m += 30) timeEl.add(new Option(label(m), label(m)));
    if (prev) timeEl.value = prev;
  }

  function setError(id, msg) {
    var f = $(id);
    $(id + '-err').textContent = msg;
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  function validate() {
    var v = {
      name: $('name').value.trim(), phone: $('phone').value.trim(),
      service: serviceEl.value, date: dateEl.value, time: timeEl.value
    };
    var ok = true;
    ok = setError('name', v.name.length < 2 ? 'Enter your full name.' : '') && ok;
    ok = setError('phone', /^\+?[0-9\s\-()]{7,18}$/.test(v.phone) ? '' : 'Enter a valid phone number, for example +1 555 013 7788.') && ok;
    ok = setError('service', v.service ? '' : 'Choose a service.') && ok;
    var dm = '';
    if (!v.date) dm = 'Choose a date.';
    else if (v.date < today) dm = 'Choose today or a future date.';
    else if (new Date(v.date + 'T00:00:00').getDay() === 0) dm = 'We are closed on Sundays. Choose another day.';
    ok = setError('date', dm) && ok;
    ok = setError('time', v.time ? '' : 'Choose a time.') && ok;
    return ok ? v : null;
  }

  dateEl.addEventListener('change', function () { buildTimes(); if (dateEl.getAttribute('aria-invalid') === 'true') validate(); });
  ['name', 'phone', 'service', 'time'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (this.getAttribute('aria-invalid') === 'true') validate(); });
  });

  /* "Book" buttons in the services list preselect the service */
  document.querySelectorAll('.book-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      serviceEl.value = b.dataset.service;
      setError('service', '');
      $('booking').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () { $('name').focus({ preventScroll: true }); }, 600);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    var v = validate();
    if (!v) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    var nice = new Date(v.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    var msg = 'Hello BLEND Barber Studio, I would like to book an appointment.\n' +
      'Name: ' + v.name + '\n' +
      'Phone: ' + v.phone + '\n' +
      'Service: ' + v.service + '\n' +
      'Date: ' + nice + '\n' +
      'Time: ' + v.time;
    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    var win = window.open(url, '_blank', 'noopener');
    status.textContent = win
      ? 'Opening WhatsApp. Send the message to complete your request.'
      : 'Your browser blocked the pop-up. Allow pop-ups for this site and try again.';
  });

  $('year').textContent = new Date().getFullYear();
})();
