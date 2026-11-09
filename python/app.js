(function () {
  'use strict';
  const PY = window.PY, app = document.getElementById('app');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mbp-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mbp-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s).toLowerCase().replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ç/g, 'c').replace(/ş/g, 's')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/\s+/g, '');
  const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const LET = 'ABCD';
  const TYPE = { mc: 'Test', fill: 'Boşluk doldurma', code: 'Kod yazma', flow: 'Akış diyagramı' };

  // ---------- Python çalıştırıcı (Web Worker + Pyodide) ----------
  const runner = {
    w: null, ready: null, seq: 0, wait: {},
    start() {
      if (this.ready) return this.ready;
      this.w = new Worker('pyworker.js');
      this.ready = new Promise((ok, no) => {
        this.w.onmessage = e => {
          const d = e.data;
          if (d.loaded) ok();
          else if (d.failed) no(d.failed);
          else if (d.id !== undefined && this.wait[d.id]) { this.wait[d.id](d); delete this.wait[d.id]; }
        };
        this.w.onerror = () => no('Python yüklenemedi');
      });
      return this.ready;
    },
    async run(code, inputs) {
      await this.start();
      const id = ++this.seq;
      return new Promise(ok => {
        const t = setTimeout(() => { // sonsuz döngü: worker'ı öldür, yenisini kur
          delete this.wait[id]; this.w.terminate(); this.ready = null;
          ok({ out: '', err: 'Zaman aşımı (3 sn): büyük ihtimalle sonsuz döngü. while içinde sayacı değiştirmeyi unuttun mu?' });
        }, 3000);
        this.wait[id] = d => { clearTimeout(t); ok(d); };
        this.w.postMessage({ id, code, inputs });
      });
    }
  };
  const lines = s => s.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '').split('\n');
  function compare(out, exp) {
    const a = lines(out), b = lines(exp);
    if (a.join('\n') === b.join('\n')) return 'ok';
    if (a.length === b.length && b.every((l, i) => a[i].includes(l))) return 'loose';
    return 'no';
  }

  // ---------- yönlendirme ----------
  function route() {
    const page = location.hash.replace(/^#\/?/, '');
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === (page === 'ozet' ? 'ozet' : 'home')));
    const ex = PY.exams.find(e => e.id === page);
    if (page === 'ozet') app.innerHTML = window.PYGUIDE;
    else if (ex) renderExam(ex);
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  function renderHome() {
    app.innerHTML = `<h1>MBP1104 Python vize çalışma</h1>
      <p class="lead">Hocanın slaytlarındaki konulardan 5 çalışma. Her biri sınav formatında 10 soru: 2 test, 4 boşluk doldurma, 3 kısa kod yazma (for / while / if-else) ve 1 akış diyagramı.</p>
      <div class="box small muted">${esc(PY.note)}</div>
      <div class="cards">${PY.exams.map(e => {
        const best = store.get('best-' + e.id, null);
        return `<a class="card" href="#/${e.id}"><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p>${best !== null ? `<div class="best">En iyi: ${fmt(best)} / 100</div>` : ''}</a>`;
      }).join('')}</div>
      <h2>Nasıl çalışılır?</h2>
      <ul>
        <li>Önce <a href="#/ozet">konu özetine</a> göz at.</li>
        <li><b>Kod yazma</b> sorularında kodunu yaz, "Çalıştır ve kontrol et"e bas: kodun tarayıcıda gerçek Python ile çalıştırılır ve test girdileriyle denenir. İlk çalıştırmada Python birkaç saniyede yüklenir.</li>
        <li><b>Akış diyagramı</b> sorusunda önce kâğıda tamamını çizmeyi dene, sonra (1)(2)(3) kutularını doldur. Bitirince tam diyagram gösterilir.</li>
        <li>"Anında kontrol" açıksa her soru cevaplandığı anda kontrol edilir; kapalıysa sonda "Bitir ve puanla".</li>
      </ul>`;
  }

  // ---------- sınav ----------
  function renderExam(ex) {
    const P = PY.points;
    const st = { done: false, instant: store.get('instant', false), res: {} }; // res[i] = puan oranı 0..1 (kontrol edildiyse)
    let html = `<a href="#/" class="small">← Çalışmalar</a><h1>${esc(ex.title)}</h1><p class="lead">${esc(ex.desc)}</p>
      <div class="bar"><span id="cnt"></span><div class="prog"><i id="prog"></i></div>
        <label><input type="checkbox" id="instant"${st.instant ? ' checked' : ''}> Anında kontrol</label></div>
      <div id="result"></div>`;
    ex.q.forEach((q, i) => {
      html += `<div class="pq" id="pq${i}"><div class="pqh"><b>Soru ${i + 1}</b><span class="muted small">${TYPE[q.t]} · ${P[q.t]} puan</span></div>
        <p>${md(q.q)}</p>${body(q, i)}<div class="fb" hidden></div></div>`;
    });
    html += `<div class="actions"><button class="btn main" id="finish">Bitir ve puanla</button><button class="btn" id="reset">Baştan başla</button></div>`;
    app.innerHTML = html;

    // olaylar
    ex.q.forEach((q, i) => {
      const el = document.getElementById('pq' + i);
      if (q.t === 'mc') el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
        if (st.done || (st.instant && st.res[i] !== undefined)) return;
        el.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
        el.dataset.ans = b.dataset.i;
        if (st.instant) grade(i); else { el.dataset.touched = 1; count(); }
      }));
      if (q.t === 'fill' || q.t === 'flow') {
        el.querySelectorAll('input.blank').forEach(inp => {
          inp.addEventListener('input', () => { el.dataset.touched = 1; count(); });
          inp.addEventListener('keydown', e => { if (e.key === 'Enter' && st.instant) grade(i); });
        });
        const chk = el.querySelector('.chk');
        if (chk) chk.addEventListener('click', () => grade(i));
      }
      if (q.t === 'code') {
        const ta = el.querySelector('textarea');
        ta.value = store.get(`code-${ex.id}-${i}`, '');
        ta.addEventListener('keydown', e => {
          if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); }
        });
        ta.addEventListener('input', () => { store.set(`code-${ex.id}-${i}`, ta.value); el.dataset.touched = 1; count(); });
        el.querySelector('.run').addEventListener('click', () => grade(i));
        el.querySelector('.showsol').addEventListener('click', () => { el.querySelector('.sol').hidden = false; });
      }
    });
    document.getElementById('instant').addEventListener('change', e => {
      st.instant = e.target.checked; store.set('instant', st.instant); syncChk();
    });
    document.getElementById('finish').addEventListener('click', finish);
    document.getElementById('reset').addEventListener('click', () => { renderExam(ex); });
    syncChk(); count();

    function syncChk() { app.querySelectorAll('.chk').forEach(b => b.hidden = !st.instant); }
    function count() {
      const n = ex.q.filter((q, i) => document.getElementById('pq' + i).dataset.touched || st.res[i] !== undefined).length;
      document.getElementById('cnt').textContent = `${n} / ${ex.q.length}`;
      document.getElementById('prog').style.width = (100 * n / ex.q.length) + '%';
    }

    async function grade(i) {
      const q = ex.q[i], el = document.getElementById('pq' + i), fb = el.querySelector('.fb');
      let ratio = 0, msg = '';
      if (q.t === 'mc') {
        const a = el.dataset.ans === undefined ? -1 : +el.dataset.ans;
        ratio = a === q.a ? 1 : 0;
        el.querySelectorAll('.opt').forEach(b => {
          const k = +b.dataset.i; b.disabled = true;
          if (k === q.a) b.classList.add('right'); else if (k === a) b.classList.add('wrong');
        });
        msg = ratio ? '' : `${a < 0 ? 'Boş bıraktın.' : 'Yanlış.'} Doğru cevap: <b>${LET[q.a]}</b>.`;
      } else if (q.t === 'fill') {
        const inp = el.querySelector('input.blank'), v = norm(inp.value);
        ratio = q.ans.some(a => norm(a) === v) ? 1 : 0;
        inp.classList.add(ratio ? 'right' : 'wrong'); inp.disabled = true;
        msg = ratio ? '' : `${v ? 'Yanlış.' : 'Boş bıraktın.'} Doğru cevap: <code>${esc(q.ans[0])}</code>${q.ans.length > 1 ? ` (ya da ${q.ans.slice(1).map(a => `<code>${esc(a)}</code>`).join(', ')})` : ''}.`;
      } else if (q.t === 'flow') {
        let ok = 0;
        el.querySelectorAll('input.blank').forEach((inp, k) => {
          const good = q.blanks[k].includes(norm(inp.value));
          if (good) ok++;
          inp.classList.add(good ? 'right' : 'wrong'); inp.disabled = true;
        });
        ratio = ok / q.blanks.length;
        el.querySelector('.full').hidden = false;
        msg = `${ok} / ${q.blanks.length} kutu doğru. Tam diyagram aşağıda.`;
      } else if (q.t === 'code') {
        const code = el.querySelector('textarea').value;
        const box = el.querySelector('.tests');
        if (!code.trim()) { ratio = 0; msg = 'Kod yazmadın.'; box.innerHTML = ''; }
        else {
          box.innerHTML = '<p class="muted small">Python yükleniyor ve kodun çalıştırılıyor…</p>';
          try {
            const rows = []; let pass = 0;
            for (const t of q.tests) {
              const r = await runner.run(code, t.inp);
              const c = r.err ? 'no' : compare(r.out, t.out);
              if (c !== 'no') pass++;
              rows.push(`<tr class="${c === 'no' ? 'bad' : 'good'}"><td>${t.inp.length ? esc(t.inp.join(', ')) : '—'}</td>
                <td><pre>${esc(t.out)}</pre></td><td><pre>${esc(r.err ? r.out + (r.out ? '\n' : '') + '⚠ ' + r.err : r.out)}</pre></td>
                <td>${c === 'ok' ? '✓' : c === 'loose' ? '✓*' : '✗'}</td></tr>`);
            }
            ratio = pass / q.tests.length;
            box.innerHTML = `<table class="tt"><tr><th>Girdi</th><th>Beklenen</th><th>Senin çıktın</th><th></th></tr>${rows.join('')}</table>
              ${rows.some(r => r.includes('✓*')) ? '<p class="muted small">✓* = değer doğru ama fazladan yazı var (ör. "Toplam: 7"); burada doğru sayıldı.</p>' : ''}`;
            msg = `${pass} / ${q.tests.length} test geçti.`;
          } catch (err) {
            box.innerHTML = `<p class="muted small">Python yüklenemedi (internet bağlantısı gerekli). Çözümü göster ile kendin karşılaştır.</p>`;
            msg = 'Kontrol edilemedi.';
          }
        }
        if (st.done) el.querySelector('.sol').hidden = false;
      }
      st.res[i] = ratio;
      fb.hidden = false;
      fb.className = 'fb ' + (ratio === 1 ? 'ok' : 'no');
      fb.innerHTML = `<strong>${ratio === 1 ? 'Doğru.' : ''}</strong> ${msg} ${md(q.exp)}`;
      if (q.t === 'code' && ratio < 1) el.querySelector('.sol').hidden = false;
      count();
      return ratio;
    }

    async function finish() {
      st.done = true;
      const btn = document.getElementById('finish'); btn.disabled = true; btn.textContent = 'Kontrol ediliyor…';
      for (let i = 0; i < ex.q.length; i++) if (st.res[i] === undefined || ex.q[i].t === 'code') await grade(i);
      app.querySelectorAll('textarea, .run, .chk').forEach(x => x.disabled = true);
      let total = 0; const by = {};
      ex.q.forEach((q, i) => { const p = P[q.t] * st.res[i]; total += p; by[q.t] = (by[q.t] || 0) + p; });
      const max = t => ex.q.filter(q => q.t === t).length * P[t];
      const prev = store.get('best-' + ex.id, null);
      if (prev === null || total > prev) store.set('best-' + ex.id, total);
      document.getElementById('result').innerHTML = `<div class="result"><div class="big">${fmt(total)} / 100</div>
        <table>${['mc', 'fill', 'code', 'flow'].map(t => `<tr><td>${TYPE[t]}</td><td><b>${fmt(by[t] || 0)}</b> / ${max(t)}</td></tr>`).join('')}</table>
        <p class="small">Yanlışların altında açıklama ve doğru cevap var. Akış diyagramında her kutu ayrı puanlandı.</p></div>`;
      btn.textContent = 'Puanlandı';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function md(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }

  function body(q, i) {
    if (q.t === 'mc') {
      return (q.code ? `<pre class="code">${esc(q.code)}</pre>` : '') +
        `<div class="opts col">${q.opts.map((o, k) => `<button class="opt" data-i="${k}"><b>${LET[k]})</b>${esc(o)}</button>`).join('')}</div>`;
    }
    if (q.t === 'fill') {
      const [a, b] = q.code.split('____');
      return `<pre class="code">${esc(a)}<input class="blank" size="7" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="boşluk">${esc(b)}</pre>
        ${q.inp ? `<p class="muted small">Örnek girdi: ${esc(q.inp.join(', '))}</p>` : ''}<button class="btn small chk">Kontrol et</button>`;
    }
    if (q.t === 'code') {
      return `<textarea class="codebox" rows="6" spellcheck="false" autocapitalize="off" placeholder="# kodunu buraya yaz (Tab = 4 boşluk)"></textarea>
        <div class="row"><button class="btn small main run">▶ Çalıştır ve kontrol et</button><button class="btn small showsol">Çözümü göster</button></div>
        <div class="tests"></div>
        <div class="sol" hidden><div class="muted small">Örnek çözüm:</div><pre class="code">${esc(q.sol)}</pre></div>`;
    }
    if (q.t === 'flow') {
      return `<div class="flowwrap">${q.svg}</div>
        <div class="blanks">${q.labels.map((l, k) => `<label><span>(${k + 1}) ${esc(l)}</span><input class="blank" autocomplete="off" autocapitalize="off" spellcheck="false"></label>`).join('')}</div>
        <p class="muted small">Boşlukları kutunun içine yazılacak şekilde yaz (ör. <code>x=x+1</code>). Boşluk ve büyük/küçük harf önemli değil.</p>
        <button class="btn small chk">Kontrol et</button>
        <details class="full" hidden open><summary>Tam akış diyagramı</summary><div class="flowwrap">${q.svgFull}</div></details>`;
    }
    return '';
  }

  route();
})();
