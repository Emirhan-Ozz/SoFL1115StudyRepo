(function () {
  'use strict';
  const EXAMS = window.EXAMS || [];
  const app = document.getElementById('app');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sofl-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sofl-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LET = 'abc';

  // ---------- yönlendirme ----------
  function route() {
    stopSpeech();
    const h = location.hash.replace(/^#\/?/, '');
    const [page, id] = h.split('/');
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === (page === 'rehber' || page === 'kelimeler' ? page : 'home')));
    if (page === 'rehber') { app.innerHTML = window.GUIDE || ''; }
    else if (page === 'kelimeler') { renderVocab(); }
    else if (page === 'test' && EXAMS.find(e => e.id === id)) { renderExam(EXAMS.find(e => e.id === id)); }
    else { renderHome(); }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- ana sayfa ----------
  function renderHome() {
    const cards = EXAMS.map(e => {
      const best = store.get('best-' + e.id, null);
      return `<a class="card${e.featured ? ' featured' : ''}" href="#/test/${e.id}">
        <h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p>
        ${best !== null ? `<div class="best">En iyi: ${fmt(best)} / 80</div>` : ''}</a>`;
    }).join('');
    app.innerHTML = `
      <h1>SoFL 1115 vize çalışma</h1>
      <p class="lead">Gerçek vize formatında 4 test: hocanın örnek sınavı ve 3 deneme vizesi. Her test Listening (15 soru), Reading (20 soru) ve Writing'den oluşuyor. Önce <a href="#/rehber">sınav rehberine</a> bir göz at; metinlerdeki kelimeler ve kalıplar <a href="#/kelimeler">Kelimeler</a> menüsünde.</p>
      <div class="cards">${cards}</div>
      <h2>Nasıl çalışılır?</h2>
      <ul>
        <li><b>Sınav modu</b> (varsayılan): hepsini çöz, sonda "Bitir ve puanla"ya bas. Yanlışların açıklamalarıyla görünür.</li>
        <li><b>Anında kontrol</b>: test sayfasının üstündeki kutuyu işaretlersen her cevap hemen kontrol edilir.</li>
        <li>Writing otomatik puanlanmaz: kelime sayacı ve bilgi kontrol listesi var, sonra örnek cevapla karşılaştır.</li>
        <li>Dinleme sırasında metne bakma. Bitirince "Dinleme metnini göster" ile kontrol edebilirsin.</li>
      </ul>`;
  }
  const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');

  // ---------- test sayfası ----------
  function renderExam(ex) {
    const st = { ans: {}, done: false, instant: store.get('instant', false) };
    const qs = []; // {key, q, part}
    ex.listening.sections.forEach((s, si) => s.questions.forEach((q, qi) => qs.push({ key: `L${si}-${qi}`, q, part: 'L' })));
    ex.reading.forEach((t, ti) => t.questions.forEach((q, qi) => qs.push({ key: `R${ti}-${qi}`, q, part: 'R' })));
    const byKey = Object.fromEntries(qs.map(x => [x.key, x]));

    let html = `<a href="#/" class="small">← Testler</a>
      <h1>${esc(ex.title)}</h1><p class="lead">${esc(ex.desc)}</p>
      <div class="bar">
        <span id="cnt">0 / ${qs.length}</span><div class="prog"><i id="prog"></i></div>
        <label><input type="checkbox" id="instant"${st.instant ? ' checked' : ''}> Anında kontrol</label>
      </div>
      <div class="tabs"><a href="#" data-jump="pL">A · Listening</a><a href="#" data-jump="pR">B · Reading</a><a href="#" data-jump="pW">C · Writing</a></div>
      <div id="result"></div>`;

    // Listening
    let n = 0;
    html += `<section class="part" id="pL"><h2>Part A – Listening <small>15 × 2 = 30 puan</small></h2>`;
    if (ex.listening.audio) html += audioBox(ex.listening.audio, null, ex.listening.audioNote);
    ex.listening.sections.forEach((s, si) => {
      html += `<h3>${esc(s.title)}</h3><p class="instr" lang="en">${esc(s.instr)}</p>`;
      if (s.audio) html += audioBox(s.audio, `${si}`, null);
      s.questions.forEach((q, qi) => { n++; html += qHtml(`L${si}-${qi}`, q, n); });
      if (s.script) {
        html += `<details><summary>Dinleme metnini göster</summary><div class="script">${s.script.map(([sp, t]) => `<p><b>${esc(sp)}:</b> ${esc(t)}</p>`).join('')}</div></details>`;
      }
    });
    html += `</section>`;

    // Reading
    n = 0;
    html += `<section class="part" id="pR"><h2>Part B – Reading <small>20 × 2,5 = 50 puan</small></h2>`;
    ex.reading.forEach((t, ti) => {
      html += `<h3>${esc(t.title)}</h3><p class="instr" lang="en">Read the text and choose the correct option for each question.</p>
        <div class="text">${t.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
      t.questions.forEach((q, qi) => { n++; html += qHtml(`R${ti}-${qi}`, q, n); });
    });
    html += `</section>`;

    // Writing
    const w = ex.writing;
    html += `<section class="part" id="pW"><h2>Part C – Writing <small>20 puan</small></h2>
      <p class="instr" lang="en">Write 10-12 sentences (min. 80 words) about ${esc(w.name)} using the information below:</p>
      <table class="info">${w.info.map((r, i) => `<tr data-row="${i}"><td class="chk">✓</td><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
      <textarea id="wtext" placeholder="Paragrafını buraya yaz… (tarayıcıda kaydedilir)"></textarea>
      <div class="wstat"><span id="wwords">0 kelime</span><span id="wsent">0 cümle</span><span id="wrows">0 / ${w.info.length} bilgi</span></div>
      <p class="muted small">✓ işareti, o satırdaki bilgilerin paragrafta geçip geçmediğine bakar; dilbilgisini kontrol etmez.</p>
      <details><summary>Örnek cevabı göster</summary><p class="model">${esc(w.model)}</p>
        <p class="muted small">${w.model.split(/\s+/).length} kelime, ${(w.model.match(/[.!?]/g) || []).length} cümle.</p></details>
    </section>`;

    html += `<div class="actions"><button class="btn main" id="finish">Bitir ve puanla</button><button class="btn" id="reset">Baştan başla</button></div>`;
    app.innerHTML = html;

    // olaylar
    app.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView({ behavior: 'smooth' });
    }));
    app.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.k, i = +b.dataset.i;
      if (st.done || (st.instant && st.ans[key] !== undefined)) return;
      st.ans[key] = i;
      paint(key);
      progress();
    }));
    document.getElementById('instant').addEventListener('change', e => {
      st.instant = e.target.checked; store.set('instant', st.instant);
      Object.keys(st.ans).forEach(paint);
    });
    document.getElementById('finish').addEventListener('click', finish);
    document.getElementById('reset').addEventListener('click', () => {
      st.ans = {}; st.done = false; qs.forEach(x => paint(x.key));
      document.getElementById('result').innerHTML = ''; progress(); window.scrollTo(0, 0);
    });
    setupAudio(ex);
    setupWriting(ex);
    progress();

    function paint(key) {
      const x = byKey[key], el = document.getElementById('q-' + key), chosen = st.ans[key];
      const reveal = st.done || (st.instant && chosen !== undefined);
      el.querySelectorAll('.opt').forEach(b => {
        const i = +b.dataset.i;
        b.className = 'opt' + (chosen === i ? ' sel' : '');
        if (reveal) {
          if (i === x.q.a) b.classList.add('right');
          else if (i === chosen) b.classList.add('wrong');
        }
        b.disabled = reveal;
      });
      const fb = el.querySelector('.fb');
      if (!reveal) { fb.hidden = true; return; }
      const ok = chosen === x.q.a;
      const label = x.q.opts.length === 2 ? x.q.opts[x.q.a] : `${LET[x.q.a]}) ${x.q.opts[x.q.a]}`;
      fb.hidden = false;
      fb.className = 'fb ' + (ok ? 'ok' : 'no');
      fb.innerHTML = (ok ? '<strong>Doğru.</strong>' : `<strong>${chosen === undefined ? 'Boş bıraktın.' : 'Yanlış.'}</strong> Doğru cevap: <b>${esc(label)}</b>.<br>`) + ' ' + esc(x.q.exp);
    }
    function progress() {
      const c = Object.keys(st.ans).length;
      document.getElementById('cnt').textContent = `${c} / ${qs.length}`;
      document.getElementById('prog').style.width = (100 * c / qs.length) + '%';
    }
    function finish() {
      st.done = true;
      qs.forEach(x => paint(x.key));
      const cL = qs.filter(x => x.part === 'L' && st.ans[x.key] === x.q.a).length;
      const cR = qs.filter(x => x.part === 'R' && st.ans[x.key] === x.q.a).length;
      const total = cL * 2 + cR * 2.5;
      const prev = store.get('best-' + ex.id, null);
      if (prev === null || total > prev) store.set('best-' + ex.id, total);
      const blank = qs.length - Object.keys(st.ans).length;
      document.getElementById('result').innerHTML = `<div class="result">
        <div class="muted small">Listening + Reading</div>
        <div class="big">${fmt(total)} / 80</div>
        <table><tr><td>Listening</td><td>${cL} / 15 doğru</td><td><b>${cL * 2}</b> / 30</td></tr>
        <tr><td>Reading</td><td>${cR} / 20 doğru</td><td><b>${fmt(cR * 2.5)}</b> / 50</td></tr>
        <tr><td>Writing</td><td colspan="2" class="muted">20 puan, kendin değerlendir (örnek cevapla karşılaştır)</td></tr></table>
        ${blank ? `<p class="muted small">${blank} soru boş kaldı.</p>` : ''}
        <p class="small">Yanlışlar aşağıda kırmızıyla işaretli, her birinin altında açıklaması var.</p></div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function qHtml(key, q, n) {
    const tf = q.opts.length === 2;
    const opts = q.opts.map((o, i) => `<button class="opt" data-k="${key}" data-i="${i}"><b>${LET[i]})</b>${esc(o)}</button>`).join('');
    return `<div class="q" id="q-${key}"><div class="stem"><span class="num">${n}.</span>${esc(q.q)}</div>
      <div class="opts${tf ? '' : ' col'}">${opts}</div><div class="fb" hidden></div></div>`;
  }

  // ---------- ses ----------
  function audioBox(src, sec, note) {
    return `<div class="audio" data-src="${esc(src)}"${sec !== null ? ` data-sec="${sec}"` : ''}>
      <audio controls preload="metadata" src="${esc(src)}"></audio>
      <div class="row">${note ? `<span class="note">${esc(note)}</span>` : ''}
        ${sec !== null ? `<span class="note fallback" hidden>Ses dosyası henüz hazır değil.</span>
        <button class="btn small speak">▶ Tarayıcı sesiyle dinle</button><button class="btn small stop" hidden>■ Durdur</button>` : ''}
      </div></div>`;
  }

  function setupAudio(ex) {
    app.querySelectorAll('.audio').forEach(box => {
      const audio = box.querySelector('audio');
      fetch(box.dataset.src, { method: 'HEAD' }).then(r => { if (!r.ok) throw 0; }).catch(() => {
        audio.hidden = true;
        const fb = box.querySelector('.fallback'); if (fb) fb.hidden = false;
      });
      if (box.dataset.sec === undefined) return;
      const sec = ex.listening.sections[+box.dataset.sec];
      const speak = box.querySelector('.speak'), stop = box.querySelector('.stop');
      if (!('speechSynthesis' in window)) { speak.hidden = true; return; }
      speak.addEventListener('click', () => {
        audio.pause();
        playScript(sec, () => { speak.hidden = false; stop.hidden = true; });
        speak.hidden = true; stop.hidden = false;
      });
      stop.addEventListener('click', () => { stopSpeech(); speak.hidden = false; stop.hidden = true; });
    });
  }

  const FEM = /female|zira|aria|jenny|sonia|libby|samantha|karen|moira|tessa|fiona|victoria|susan|hazel|serena|kate|allison|ava|natasha|neerja|emma|michelle|ana\b|clara|emily|salli|joanna|kimberly|catherine|veena|sara/i;
  const MAL = /\bmale|david|mark|guy|ryan|daniel|alex|fred|thomas|george|james|rishi|arthur|aaron|christopher|eric|roger|steffan|brian|matthew|joey|justin|liam|connor|prabhat|william|oliver|lee\b/i;
  function pickVoices(sec) {
    const all = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
    const f = all.filter(v => FEM.test(v.name) && !/\bmale/i.test(v.name.replace(/female/i, '')));
    const m = all.filter(v => MAL.test(v.name) && !FEM.test(v.name));
    const map = {}, used = { f: 0, m: 0 };
    Object.keys(sec.gender || {}).forEach(sp => {
      const g = sec.gender[sp], pool = g === 'f' ? (f.length ? f : all) : (m.length ? m : all);
      map[sp] = pool.length ? pool[used[g]++ % pool.length] : null;
    });
    return map;
  }
  let speechOn = false;
  function stopSpeech() { speechOn = false; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function playScript(sec, done) {
    stopSpeech(); speechOn = true;
    const voices = pickVoices(sec);
    const lines = [];
    sec.script.forEach(([sp, t]) => {
      if (/^Speaker/.test(sp)) lines.push([null, sp + '.']);
      lines.push([sp, t]);
    });
    let i = 0;
    (function next() {
      if (!speechOn || i >= lines.length) { speechOn = false; done(); return; }
      const [sp, t] = lines[i++];
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-GB'; u.rate = 0.9;
      if (sp && voices[sp]) { u.voice = voices[sp]; u.lang = voices[sp].lang; }
      u.onend = () => setTimeout(next, sp ? 350 : 500);
      u.onerror = () => { speechOn = false; done(); };
      speechSynthesis.speak(u);
    })();
  }
  if ('speechSynthesis' in window) speechSynthesis.getVoices();


  // ---------- kelimeler ----------
  function renderVocab() {
    const V = window.VOCAB || [];
    const total = V.reduce((n, g) => n + g.items.length, 0);
    const vs = { g: 'all', t: 'all', q: '', hide: store.get('vhide', false) };
    const short = { genel: 'Sınav dili', ornek: 'Örnek vize', deneme1: 'Deneme 1', deneme2: 'Deneme 2', deneme3: 'Deneme 3' };
    app.innerHTML = `<h1>Kelimeler</h1>
      <p class="lead">Testlerdeki dinleme metinleri, okuma parçaları, sorular ve writing'den ${total} kelime ve kalıp. "Türkçeyi gizle"yi açıp kendini sına ya da kartlarla çalış.</p>
      <div class="vctl">
        <input type="search" id="vq" placeholder="Ara (İngilizce ya da Türkçe)…" autocomplete="off">
        <div class="chips" id="vg"><button data-g="all" class="on">Tümü</button>${V.map(g => `<button data-g="${g.id}">${esc(short[g.id] || g.title)}</button>`).join('')}</div>
        <div class="chips" id="vt"><button data-t="all" class="on">Hepsi</button><button data-t="w">Kelimeler</button><button data-t="p">Kalıplar / tabirler</button></div>
        <div class="vrow"><label><input type="checkbox" id="vhide"${vs.hide ? ' checked' : ''}> Türkçeyi gizle</label>
          <span class="muted small" id="vcount"></span>
          <button class="btn small" id="vcards">Kartlarla çalış</button></div>
      </div>
      <div id="vlist"></div>`;
    const list = document.getElementById('vlist');
    const filtered = () => {
      const q = norm(vs.q.trim());
      const out = [];
      V.forEach(g => {
        if (vs.g !== 'all' && g.id !== vs.g) return;
        const items = g.items.filter(([en, tr, k]) => (vs.t === 'all' || k === vs.t) && (!q || norm(en).includes(q) || norm(tr).includes(q)));
        if (items.length) out.push({ g, items });
      });
      return out;
    };
    const draw = () => {
      const groups = filtered();
      const n = groups.reduce((a, x) => a + x.items.length, 0);
      document.getElementById('vcount').textContent = `${n} sonuç`;
      list.className = vs.hide ? 'hide-tr' : '';
      list.innerHTML = groups.map(({ g, items }) => `<h3>${esc(g.title)}</h3><table class="vocab">${items.map(([en, tr, k]) =>
        `<tr><td class="en" lang="en">${esc(en)}${k === 'p' ? ' <span class="tag">kalıp</span>' : ''}</td><td class="tr"><span>${esc(tr)}</span></td></tr>`).join('')}</table>`).join('')
        || '<p class="muted">Sonuç yok.</p>';
    };
    document.getElementById('vq').addEventListener('input', e => { vs.q = e.target.value; draw(); });
    const chips = (id, key) => document.getElementById(id).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      vs[key] = b.dataset[key];
      document.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    chips('vg', 'g'); chips('vt', 't');
    document.getElementById('vhide').addEventListener('change', e => { vs.hide = e.target.checked; store.set('vhide', vs.hide); draw(); });
    list.addEventListener('click', e => { const tr = e.target.closest('tr'); if (tr && vs.hide) tr.classList.toggle('show'); });
    document.getElementById('vcards').addEventListener('click', () => {
      const deck = filtered().flatMap(x => x.items);
      if (deck.length) cards(deck, draw);
    });
    draw();
  }

  function cards(deck, back) {
    let order = deck.map((_, i) => i), i = 0, flipped = false, rev = store.get('vrev', false);
    const shuffle = () => { for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; } i = 0; };
    shuffle();
    app.innerHTML = `<a href="#" id="cback" class="small">← Listeye dön</a><h1>Kartlar</h1>
      <div class="vrow"><span class="muted" id="cpos"></span>
        <label><input type="checkbox" id="crev"${rev ? ' checked' : ''}> Türkçeden İngilizceye</label></div>
      <div class="flash" id="card" tabindex="0"><div class="front" id="cfront"></div><div class="back" id="cbackside"></div><div class="hint muted small" id="chint">Çevirmek için dokun</div></div>
      <div class="actions"><button class="btn" id="cprev">← Önceki</button><button class="btn main" id="cnext">Sonraki →</button><button class="btn" id="cshuf">Karıştır</button></div>`;
    const show = () => {
      const [en, tr] = deck[order[i]];
      document.getElementById('cpos').textContent = `${i + 1} / ${deck.length}`;
      document.getElementById('cfront').textContent = rev ? tr : en;
      document.getElementById('cfront').lang = rev ? 'tr' : 'en';
      const b = document.getElementById('cbackside');
      b.textContent = rev ? en : tr; b.hidden = !flipped;
      document.getElementById('chint').hidden = flipped;
    };
    const go = d => { i = (i + d + order.length) % order.length; flipped = false; show(); };
    document.getElementById('card').addEventListener('click', () => { flipped = !flipped; show(); });
    document.getElementById('cnext').addEventListener('click', () => go(1));
    document.getElementById('cprev').addEventListener('click', () => go(-1));
    document.getElementById('cshuf').addEventListener('click', () => { shuffle(); flipped = false; show(); });
    document.getElementById('crev').addEventListener('change', e => { rev = e.target.checked; store.set('vrev', rev); flipped = false; show(); });
    document.getElementById('cback').addEventListener('click', e => { e.preventDefault(); renderVocab(); });
    show();
  }

  // ---------- writing ----------
  function norm(s) { return s.replace(/İ/g, 'I').replace(/ı/g, 'i').toLowerCase(); }
  function setupWriting(ex) {
    const w = ex.writing, ta = document.getElementById('wtext'), k = 'w-' + ex.id;
    ta.value = store.get(k, '');
    const upd = () => {
      const txt = ta.value, t = norm(txt);
      const words = (txt.trim().match(/\S+/g) || []).length;
      const sents = (txt.match(/[^.!?]+[.!?]+/g) || []).length;
      let rows = 0;
      w.info.forEach((r, i) => {
        const ok = r[2].every(alt => alt.split('|').some(a => t.includes(norm(a))));
        document.querySelector(`[data-row="${i}"]`).classList.toggle('done', ok);
        if (ok) rows++;
      });
      const W = document.getElementById('wwords'), S = document.getElementById('wsent'), R = document.getElementById('wrows');
      W.textContent = `${words} kelime ${words >= 80 ? '✓' : '(en az 80)'}`; W.className = words >= 80 ? 'good' : '';
      S.textContent = `${sents} cümle ${sents >= 10 && sents <= 12 ? '✓' : '(10–12)'}`; S.className = sents >= 10 && sents <= 12 ? 'good' : '';
      R.textContent = `${rows} / ${w.info.length} bilgi`; R.className = rows === w.info.length ? 'good' : '';
      store.set(k, txt);
    };
    ta.addEventListener('input', upd);
    upd();
  }

  route();
})();
