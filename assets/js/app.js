/* Booked Out — page logic. Renders the template, keeps it in sync with state, wires up clicks and typing. */
(function () {
  'use strict';
  var root = document.getElementById('app');
  var tpl = document.getElementById('tpl').innerHTML;
  var comp, vals, queued = false;
  function DCLogicBase() { this.props = {}; this.state = {}; }
  DCLogicBase.prototype.setState = function (u) { Object.assign(this.state, typeof u === 'function' ? u(this.state) : u); schedule(); };
  DCLogicBase.prototype.forceUpdate = function () { schedule(); };
  class Component extends DCLogicBase {
    componentDidMount() {
      var self = this;
      this.timer = setInterval(function () { self.forceUpdate(); }, 20000);
      // Your week: play the days once, when the strip is half in view
      try {
        var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var el = document.querySelector('.wkc');
        if (el && !still && 'IntersectionObserver' in window) {
          this.setState({ wk: 1 });
          this.io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              if (e.isIntersecting) { self.setState({ wk: 2 }); if (self.io) self.io.disconnect(); }
            });
          }, { threshold: 0.5 });
          this.io.observe(el);
        }
        var pz = document.querySelector('.pz-sim');
        if (pz && !still && 'IntersectionObserver' in window) {
          this.setState({ pz: 1 });
          this.io2 = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              if (e.isIntersecting) { self.setState({ pz: 2 }); if (self.io2) self.io2.disconnect(); }
            });
          }, { threshold: 0.55 });
          this.io2.observe(pz);
        }
      } catch (e) {}
    }
    componentWillUnmount() {
      clearInterval(this.timer);
      if (this.io) this.io.disconnect();
      if (this.io2) this.io2.disconnect();
    }
    renderVals() {
      // Keep "$" + digit safe when values are dropped into the page (e.g. "$1,495")
      var fx = function (o) {
        if (typeof o === 'string') return o.replace(/\$(?=\d)/g, '$\u2060');
        if (Array.isArray(o)) return o.map(fx);
        if (o && typeof o === 'object') { var r = {}; for (var k in o) r[k] = fx(o[k]); return r; }
        return o;
      };
      return fx(this.rv0());
    }
    rv0() {
      var time = '--:--', tz = 'CET';
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb', timeZoneName: 'short' }).formatToParts(new Date());
        var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ''; };
        if (get('hour') && get('minute')) time = get('hour') + ':' + get('minute');
        if (/^[A-Z]{2,5}$/.test(get('timeZoneName'))) tz = get('timeZoneName');
      } catch (e) {}
      var self = this;
      var start = (this.state && this.state.start) || 0;
      var fmt = function (offset, opts) {
        var d = new Date(Date.now() + (start + offset) * 86400000);
        try {
          return new Intl.DateTimeFormat('en-GB', opts).format(d).replace(',', '');
        } catch (e) {
          return d.toDateString().slice(0, 10);
        }
      };
      var day = function (offset) { return fmt(offset, { weekday: 'short', day: 'numeric', month: 'short' }); };
      var cell = function (offset) { return { wd: fmt(offset, { weekday: 'short' }), d: fmt(offset, { day: 'numeric' }) }; };
      var toMonday = (8 - new Date().getDay()) % 7;
      if (toMonday < 2) toMonday += 7;
      var chip = function (offset, label) {
        return {
          label: label,
          cls: start === offset ? 'on' : '',
          on: start === offset ? 'true' : 'false',
          pick: function () { self.setState({ start: offset }); }
        };
      };
      var V = [[150, 'Café or salon regular'], [400, 'Clinic patient'], [900, 'Trades job'], [2500, 'Wedding or event'], [6000, 'B2B client']];
      var vi = (this.state && typeof this.state.v === 'number') ? this.state.v : 1;
      var worth = V[vi][0];
      var need = Math.ceil(1495 / worth), ag = Math.ceil(5000 / worth);
      var money = function (n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
      var vchip = function (i) {
        return { amt: money(V[i][0]), lab: V[i][1], cls: vi === i ? 'on' : '', on: vi === i ? 'true' : 'false', pick: function () { self.setState({ v: i }); } };
      };
      var tok = function (i) { return i < need ? 'mq-a' : 'mq-p'; };
      var LP_END = Date.UTC(2026, 11, 31, 23, 0, 0); // 1 Jan 2027, 00:00 in Zagreb
      var lpDays = Math.ceil((LP_END - Date.now()) / 86400000);
      var lp = { left: lpDays > 1 ? lpDays + ' days left' : lpDays === 1 ? 'Last day' : 'Ended' };
      var EMAIL = 'hello@getbookedout.com';
      var CALL_URL = '';
      var st = this.state || {};
      var BZ = [['Clinic', 'a clinic'], ['Studio', 'a studio'], ['Trades', 'a trades business'], ['Restaurant', 'a restaurant'], ['Salon', 'a salon'], ['Consulting', 'a consultancy'], ['Something else', 'a business']];
      var GL = [['Calls', 'calls'], ['Bookings', 'bookings'], ['Leads', 'leads'], ['Sales', 'sales']];
      var PY = [['Booked-Out Program', 'the Booked-Out Program'], ['Booked-Out Program', 'the Booked-Out Program']];
      var bi = typeof st.bz === 'number' ? st.bz : 0;
      var gm = typeof st.gm === 'number' && st.gm > 0 ? st.gm : 2;
      var gsel = GL.filter(function (g, i) { return gm & (1 << i); }).map(function (g) { return g[1]; });
      var goalTxt = 'more ' + (gsel.length > 1 ? gsel.slice(0, -1).join(', ') + ' and ' + gsel[gsel.length - 1] : gsel[0]);
      var gopt = function (i) {
        var on = !!(gm & (1 << i));
        return { label: GL[i][0], cls: on ? 'on' : '', on: on ? 'true' : 'false', pick: function () { var n = gm ^ (1 << i); if (n) self.setState({ gm: n }); } };
      };
      var trim = function (v) { return typeof v === 'string' ? v.trim() : ''; };
      var nm = trim(st.nm), bn = trim(st.bn), em = trim(st.em), url = trim(st.url);
      var emOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
      var inp = function (key) { return function (e) { var u = {}; u[key] = (e && (e.currentTarget || e.target) || {}).value || ''; self.setState(u); }; };
      var pi = typeof st.py === 'number' ? st.py : 0;
      var opt = function (list, cur, key, i) {
        return { label: list[i][0], cls: cur === i ? 'on' : '', on: cur === i ? 'true' : 'false', pick: function () { var u = {}; u[key] = i; self.setState(u); } };
      };
      var enc = function (t) { return encodeURIComponent(t); };
      var mail = function (subject, body) { return 'mailto:' + EMAIL + '?subject=' + enc(subject) + '&body=' + enc(body); };
      var sw = start === 0 ? 'today' : start === 1 ? 'tomorrow' : (toMonday >= 7 ? 'next Monday' : 'on Monday');
      var liveTxt = fmt(9, { weekday: 'short', day: 'numeric', month: 'short' });
      var ot = trim(st.ot).replace(/[.!?,;:]+$/, '');
      var withArt = function (t) {
        if (!t) return 'a business';
        if (/^(a|an|the|my|our|two|three|several|multiple)\s/i.test(t) || /^[A-Z][a-z]+\s+[A-Z]/.test(t)) return t;
        return (/^[aeiou]/i.test(t) ? 'an ' : 'a ') + t;
      };
      var bizTxt = bi === 6 ? withArt(ot) : BZ[bi][1];
      var bizShort = bi === 6 ? (ot ? ot.replace(/^(a|an|the|my|our)\s+/i, '').replace(/^./, function (c) { return c.toUpperCase(); }) : 'My business') : BZ[bi][0];
      var subject = 'Reserve my spot: ' + (bn || bizShort) + ', live by ' + liveTxt;
      var body = 'Hi Antonio,\n\nI run ' + bizTxt + (bn ? ' called ' + bn : '') + ' and I want ' + goalTxt + '.\nI can start ' + sw + ', so I\'m live by ' + liveTxt + ', for ' + PY[pi][1] + '.\n' + (url ? '\nMy current site: ' + url + '\n' : '') + (em ? '\nReply to me at: ' + em + '\n' : '') + '\nThanks,\n' + (nm || '');
      var done = 4 + (nm ? 1 : 0) + (emOk ? 1 : 0);
      var cf = {
        biz: bizTxt, goal: goalTxt,
        othCls: bi === 6 ? 'is-on' + (ot ? ' has-v' : '') : '',
        inOt: inp('ot'),
        pickOt: function (e) {
          var btn = e && e.currentTarget;
          self.setState({ bz: 6 });
          setTimeout(function () { try { var w = btn && btn.parentNode; var f = w && w.querySelector('input'); if (f) f.focus(); } catch (x) {} }, 60);
        }, pay: PY[pi][1], live: liveTxt, email: EMAIL,
        subject: subject,
        dep: 'half the setup, $747.50',
        bn: bn, bnCls: bn ? '' : 'is-off',
        url: url, urlCls: url ? '' : 'is-off',
        nmShow: nm || 'Your name', nmCls: nm ? '' : 'cf-ph',
        emShow: em || 'you@yourbusiness.com', emCls: emOk ? '' : 'cf-ph',
        pct: Math.round(done / 6 * 100) + '%',
        readyCls: done === 6 ? 'is-ready' : '',
        readyTxt: done === 6 ? 'Ready to send' : (!nm && !emOk ? 'Add your name and email so I can reply' : !nm ? 'Add your name' : 'Add your email so I can reply'),
        inNm: inp('nm'), inBn: inp('bn'), inEm: inp('em'), inUrl: inp('url'),
        href: mail(subject, body),
        gmail: 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(EMAIL) + '&su=' + enc(subject) + '&body=' + enc(body),
        copyMsgLabel: st.copiedMsg ? 'Copied' : 'Copy the message',
        copyMsg: function () {
          try {
            navigator.clipboard.writeText('To: ' + EMAIL + '\nSubject: ' + subject + '\n\n' + body).then(function () {
              self.setState({ copiedMsg: true });
              setTimeout(function () { self.setState({ copiedMsg: false }); }, 2200);
            }, function () {});
          } catch (e) {}
        },
        mailto: 'mailto:' + EMAIL,
        call: CALL_URL || mail('A 15-min call about Booked Out', 'Hi Antonio,\n\nI\'d like a quick call before I reserve.\nTimes that suit me:\n\nMy business:\nMy phone number:\n'),
        grow: mail('The Booked-Out Program', 'Hi Antonio,\n\nI\'d like to hear more about the Booked-Out Program.\n\nMy business:\nMy website:\nWhat a new customer is worth to me:\nRoughly how many enquiries I get a month now:\n'),
        refer: mail('A referral for you', 'Hi Antonio,\n\nI know a business that should be busier.\n\nTheir name:\nTheir current site:\nHow you can reach them:\n\nMy name:\n'),
        ref: mail('Can I talk to one of your clients?', 'Hi Antonio,\n\nBefore I reserve, I\'d like a quick word with one of your clients.\n\nMy business:\nMy phone number:\n'),
        audit: mail('Free 9pm Test for my site', 'Hi Antonio,\n\nPlease run the 9pm Test on my site.\n\nMy site:\nMy town or postcode:\n'),
        copyLabel: st.copied ? 'Copied' : 'Copy',
        copy: function () {
          try {
            navigator.clipboard.writeText(EMAIL).then(function () {
              self.setState({ copied: true });
              setTimeout(function () { self.setState({ copied: false }); }, 2200);
            }, function () {});
          } catch (e) {}
        },
        p0: function () { self.setState({ py: 0 }); },
        p1: function () { self.setState({ py: 1 }); }
      };
      var ws = typeof st.ws === 'number' ? st.ws : 0;
      var wtab = function (i) {
        return { cls: ws === i ? 'on' : '', on: ws === i ? 'true' : 'false', hid: ws === i ? 'false' : 'true', pick: function () { self.setState({ ws: i }); } };
      };
      return {
        w0: wtab(0), w1: wtab(1), w2: wtab(2),
        wnum: '0' + (ws + 1),
        wsc: 'ws-' + ws,
        cf: cf,
        lp: lp,
        ind: (function () {
          var k = st.ind || 0;
          var b = function (i) { return { cls: k === i ? 'on' : '', on: k === i ? 'true' : 'false', pick: function () {
            var go = st.pz === 2; self.setState({ ind: i });
            if (go) { self.setState({ pz: 1 }); setTimeout(function () { self.setState({ pz: 2 }); }, 80); }
          } }; };
          return { cls: 'iv-' + k, b0: b(0), b1: b(1), b2: b(2), b3: b(3) };
        })(),
        hf: (function () {
          var site = trim(st.hu);
          return { in: inp('hu'), href: mail('Free 9pm Test' + (site ? ': ' + site : ''), 'Hi Antonio,\n\nPlease run the free 9pm Test on my business.\n\nMy website or business: ' + (site || '') + '\nMy town or postcode:\n\nThanks,\n') };
        })(),
        op: (function () {
          var f = st.py === 1;
          return { cls: f ? 'is-f' : '', pill: f ? 'is-b' : '',
            big: f ? '1,495' : '995', unit: f ? 'once' : '/month',
            sub: f ? 'Week 1 only: everything fixed and live, yours to keep. No ads, no monthly fee.' : 'Plus a one-time $1,495 setup and your ad budget, paid straight to Google or Meta. 90 days, then month to month.',
            valK: f ? 'Week 1, bought separately' : 'Your first 90 days, bought separately', val: f ? '$5,900' : '$11,900',
            a: { cls: f ? '' : 'on', on: f ? 'false' : 'true', pick: function () { self.setState({ py: 0 }); } },
            b: { cls: f ? 'on' : '', on: f ? 'true' : 'false', pick: function () { self.setState({ py: 1 }); } } };
        })(),
        pz: {
          cls: st.pz === 2 ? 'pz-go' : st.pz === 1 ? 'pz-arm' : '',
          replay: function () { self.setState({ pz: 1 }); setTimeout(function () { self.setState({ pz: 2 }); }, 80); }
        },
        vs: (function () {
          var w = st.vs === 1 ? 1 : 0;
          var T = [['6 to 12 weeks', 'Meetings and rounds', '$5,000+, then extras', 'Your deposit is gone'],
                   ['Whenever you find the time', 'Evenings and weekends', 'Boosted posts and tools that add up', 'Your evenings are gone']];
          var good = [[false, false, false, false], [false, false, false, false]];
          var o = { them: w ? 'Doing it yourself' : 'An agency', pill: w ? 'is-b' : '',
            a: { cls: w ? '' : 'on', on: w ? 'false' : 'true', pick: function () { self.setState({ vs: 0 }); } },
            b: { cls: w ? 'on' : '', on: w ? 'true' : 'false', pick: function () { self.setState({ vs: 1 }); } } };
          for (var k = 0; k < 4; k++) o['r' + k] = { t: T[w][k], cls: good[w][k] ? 'is-ok' : '' };
          return o;
        })(),
        menu: {
          cls: st.menu ? 'is-open' : '', on: st.menu ? 'true' : 'false', hid: st.menu ? 'false' : 'true',
          label: st.menu ? 'Close menu' : 'Open menu',
          toggle: function () { self.setState({ menu: !st.menu }); },
          close: function () { if (st.menu) self.setState({ menu: false }); }
        },
        b0: opt(BZ, bi, 'bz', 0), b1: opt(BZ, bi, 'bz', 1), b2: opt(BZ, bi, 'bz', 2), b3: opt(BZ, bi, 'bz', 3), b4: opt(BZ, bi, 'bz', 4), b5: opt(BZ, bi, 'bz', 5), b6: opt(BZ, bi, 'bz', 6),
        g0: gopt(0), g1: gopt(1), g2: gopt(2), g3: gopt(3),
        p0: opt(PY, pi, 'py', 0), p1: opt(PY, pi, 'py', 1),
        v0: vchip(0), v1: vchip(1), v2: vchip(2), v3: vchip(3), v4: vchip(4),
        t0: tok(0), t1: tok(1), t2: tok(2), t3: tok(3), t4: tok(4), t5: tok(5), t6: tok(6), t7: tok(7), t8: tok(8), t9: tok(9),
        pb: (function () {
          var N = [['regular', 'regulars'], ['patient', 'patients'], ['job', 'jobs'], ['booking', 'bookings'], ['client', 'clients']][vi];
          var cap = function (w) { return w.charAt(0).toUpperCase() + w.slice(1); };
          var ex = String(Math.round(1495 / worth * 100) / 100);
          var leg = need === 1
            ? cap(N[0]) + ' 1 covers the site. From ' + N[0] + ' 2 on, it\u2019s profit, for years.'
            : cap(N[1]) + ' 1\u2013' + need + ' cover the site. From ' + N[0] + ' ' + (need + 1) + ' on, it\u2019s profit, for years.';
          var d = ag - need;
          return {
            n: String(need), agn: String(ag), noun: need === 1 ? N[0] : N[1], amt: money(worth),
            calc: '$1,495 \u00f7 ' + money(worth) + ' = ' + ex + (String(need) === ex ? '' : '. Round up: ' + need) + '.',
            leg: leg,
            wo: Math.max(3, Math.round(need / ag * 100)) + '%',
            diff: d > 0 ? d + ' fewer ' + (d === 1 ? N[0] : N[1]) + ' before you\u2019re in profit.' : 'Same one ' + N[0] + '. $3,505 less out of your pocket.'
          };
        })(),
        qdate: (function () { try { return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date()).replace(',', ''); } catch (e) { return new Date().toDateString().slice(0, 10); } })(),
        today: day(0),
        d2: day(2),
        d9: day(9),
        startWord: start === 0 ? 'today' : start === 1 ? 'tomorrow' : (toMonday >= 7 ? 'next Monday' : 'on Monday'),
        live: { wd: fmt(9, { weekday: 'short' }), d: fmt(9, { day: 'numeric' }), mon: fmt(9, { month: 'short' }) },
        c0: cell(0), c1: cell(1), c2: cell(2), c3: cell(3), c4: cell(4), c5: cell(5), c6: cell(6), c7: cell(7), c8: cell(8), c9: cell(9),
        k0: chip(0, 'Today'), k1: chip(1, 'Tomorrow'), k2: chip(toMonday, toMonday >= 7 ? 'Next Monday' : 'Monday'),
        accent: this.props.accent ?? '#FF4D1F',
        rootCls: (this.props.motion ?? true) ? '' : 'still',
        wkCls: st.wk === 2 ? 'wb-go' : st.wk === 1 ? 'wb-arm' : '',
        time: time,
        tz: tz,
        stageMove: function (e) {
          var el = e.currentTarget, r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        },
        stageLeave: function (e) {
          e.currentTarget.style.setProperty('--mx', '0');
          e.currentTarget.style.setProperty('--my', '0');
        }
      };
    }
  }
  function get(p) { return p.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, vals); }
  function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function render() {
    vals = comp.renderVals();
    var html = tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, p) { var v = get(p); return v == null || typeof v === 'function' ? '' : esc(v); });
    morphdom(root, '<div id="app">' + html + '</div>', {
      onBeforeElUpdated: function (from, to) {
        if (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA') return false;
        if (from.tagName === 'DETAILS') { if (from.open) to.setAttribute('open', ''); else to.removeAttribute('open'); }
        return true;
      }
    });
  }
  function schedule() { if (queued) return; queued = true; Promise.resolve().then(function () { queued = false; render(); }); }
  ['click', 'input'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-on-' + type + ']') : null;
      if (!el || !vals) return;
      var fn = get(el.getAttribute('data-on-' + type));
      if (typeof fn === 'function') fn({ currentTarget: el, target: e.target, clientX: e.clientX, clientY: e.clientY, nativeEvent: e,
        preventDefault: function () { e.preventDefault(); }, stopPropagation: function () { e.stopPropagation(); } });
    });
  });
  comp = new Component();
  render();
  if (comp.componentDidMount) comp.componentDidMount();
})();
