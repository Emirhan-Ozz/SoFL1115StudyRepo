// "Sınav rehberi" sekmesi
window.GUIDE = `
<h1>Sınav rehberi</h1>
<p class="lead">Vizenin formatı, her bölüm için kısa taktikler ve writing kalıbı. Testleri çözmeden önce 5 dakikada oku.</p>

<h2>Format</h2>
<table class="format">
  <tr><th>Bölüm</th><th>Ne var</th><th>Puan</th></tr>
  <tr><td>A · Listening</td><td>Section 1: diyalog, 10 TRUE/FALSE<br>Section 2: 3 konuşmacı, 5 soru (a/b/c)</td><td>15 × 2 = <b>30</b></td></tr>
  <tr><td>B · Reading</td><td>Text 1–2: 10 TRUE/FALSE<br>Text 3–4: 10 soru (a/b/c)</td><td>20 × 2,5 = <b>50</b></td></tr>
  <tr><td>C · Writing</td><td>Verilen bilgilerle bir kişiyi anlat: 10–12 cümle, en az 80 kelime</td><td><b>20</b></td></tr>
</table>
<div class="box trap"><b>Cevap kâğıdı:</b> Cevapları kâğıda geçirmek için ek süre verilmiyor. Kâğıda işaretlenmeyen cevap puanlanmıyor. Toplam süre 60 dakika.</div>

<h2>Listening</h2>
<ul>
  <li>Kayıt başlamadan <b>soruları oku</b>, sayı, gün ve saatlerin altını çiz. Sorular kayıttaki sırayla gelir.</li>
  <li>Her bölüm <b>iki kez</b> çalar. İlk dinleyişte işaretle, ikincide kontrol et.</li>
  <li>Section 1 tuzakları: yaş (<code>fifteen / sixteen</code>), günler (<code>Mondays and Thursdays</code> → biri yanlış), fiyat (normal fiyat / öğrenci fiyatı), "internetten mi, masada mı?", "kendi getirmen gerekiyor mu?".</li>
  <li><code>-teen</code> ile <code>-ty</code> farkına dikkat: <code>fifteen</code> (15) / <code>fifty</code> (50).</li>
  <li>Section 2'de her konuşmacı ayrı. Soru numarasının yanında hangi konuşmacı olduğu yazar.</li>
</ul>

<h2>Reading</h2>
<ul>
  <li><b>TRUE/FALSE:</b> Cümlenin metindeki karşılığını bul, kelime kelime karşılaştır. Bir detay bile farklıysa FALSE.</li>
  <li>Dikkat edilecek kelimeler: <code>only</code>, <code>all</code>, <code>every</code>, <code>always</code>, <code>never</code>. Metin "bazen" ya da "bir kısmı" diyorsa bu cümleler FALSE olur.</li>
  <li>Kişileri karıştırma: anlatan kişi ile anlatılan kişi farklı olabilir (örnekteki Daniel ve Carlos gibi).</li>
  <li><b>NOT</b> ve <b>FALSE</b> soruları ters çalışır: metinde <i>olmayanı</i> ya da yanlış olanı ararsın.</li>
  <li>a/b/c sorularında şıkları tek tek metinde kontrol edip ele. Genelde iki şık metindeki bir detayı çarpıtır.</li>
</ul>

<h2>Writing</h2>
<p>Her bilgi satırı = 1–2 cümle. Bu kalıpla 11–13 cümle ve yaklaşık 90–100 kelime çıkar.</p>
<div class="box">
<p><b>Name & Role</b> → <code>Leo is my best friend.</code></p>
<p><b>Age & Hometown</b> → <code>He is 20 years old and he is from Rome, Italy.</code></p>
<p><b>Family</b> → <code>He lives with his parents. He has one sister and one brother.</code></p>
<p><b>Job</b> → <code>He is a university student and he studies computer engineering.</code></p>
<p><b>Appearance</b> → <code>He is tall and slim. He has short brown hair and brown eyes.</code></p>
<p><b>Personality</b> → <code>He is very friendly, funny and hardworking.</code></p>
<p><b>Hobbies</b> → <code>In his free time, he plays basketball. He likes listening to pop music. He loves watching action movies. He also enjoys cooking.</code></p>
<p><b>Pet</b> → <code>He has a pet dog.</code></p>
</div>

<h3>Sık hatalar</h3>
<table class="format">
  <tr><th>Yanlış</th><th>Doğru</th></tr>
  <tr><td>He has 20 years old.</td><td>He <b>is</b> 20 years old.</td></tr>
  <tr><td>He live / He play / He have</td><td>He live<b>s</b> / He play<b>s</b> / He <b>has</b></td></tr>
  <tr><td>He is brown eyes.</td><td>He <b>has</b> brown eyes.</td></tr>
  <tr><td>He has hair short brown.</td><td>He has <b>short brown hair</b>. (sıfat isimden önce)</td></tr>
  <tr><td>He likes play football.</td><td>He likes play<b>ing</b> football.</td></tr>
  <tr><td>He is from izmir, turkey.</td><td>He is from <b>I</b>zmir, <b>T</b>urkey. (yer adları büyük harfle)</td></tr>
  <tr><td>He is a university student, he studies...</td><td>He is a university student <b>and</b> he studies...</td></tr>
  <tr><td>He plays basketball in his free time always.</td><td>He <b>always</b> plays basketball... (sıklık zarfı fiilden önce)</td></tr>
</table>

<h3>Hobi fiilleri</h3>
<ul>
  <li><code>play</code> + spor/oyun: <code>plays football / basketball / chess / video games</code></li>
  <li><code>go</code> + -ing: <code>goes swimming / running / cycling</code></li>
  <li><code>listen to</code> müzik, <code>watch</code> film/dizi, <code>read</code> kitap</li>
  <li><code>likes / loves / enjoys</code> + -ing: <code>He loves cooking.</code></li>
</ul>

<h2>Okumada sık geçen kalıplar</h2>
<ul>
  <li><code>There is / There isn't</code> (tekil), <code>There are / There aren't</code> (çoğul): bir yerde ne var ne yok. Reading 4'teki "Which is FALSE?" sorularının çoğu bununla çözülür.</li>
  <li><code>can / can't</code>: yapılabilen ve yasak olan şeyler (<code>Swimming is not allowed</code> = yasak).</li>
  <li>Sıklık: <code>always &gt; usually &gt; often &gt; sometimes &gt; never</code>, <code>once a week</code> (haftada bir), <code>twice a week</code> (haftada iki), <code>every day</code>.</li>
  <li><code>older / younger brother</code> (abi / küçük kardeş), <code>the eldest</code> (en büyük), <code>alone</code> (yalnız).</li>
</ul>
`;
