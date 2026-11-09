// "Konu özeti" sekmesi (hocanın slaytlarından)
window.PYGUIDE = `
<h1>Konu özeti</h1>
<p class="lead">Hocanın 4 slayt dosyasından (Algoritma, Değişkenler, Koşul ifadeleri, For döngüsü) ve while döngüsünden sınav için gerekenler.</p>

<h2>1. Algoritma ve akış diyagramı</h2>
<p>Algoritma: bir problemi çözmek için adım adım uygulanan, başı ve sonu olan <b>sonlu işlemler kümesi</b>.</p>
<table class="format">
  <tr><th>Kriter</th><th>Anlamı</th></tr>
  <tr><td>Girdi</td><td>Sıfır veya daha fazla değer dışarıdan verilir</td></tr>
  <tr><td>Çıktı</td><td>En az bir değer üretir</td></tr>
  <tr><td>Açıklık</td><td>Her işlem açık olmalı</td></tr>
  <tr><td>Sonluluk</td><td>Her olasılıkta sonlu adımda bitmeli</td></tr>
  <tr><td>Etkinlik</td><td>Kalem-kâğıtla yapılabilecek kadar basit</td></tr>
</table>
<h3>Şekiller</h3>
<table class="format">
  <tr><th>Şekil</th><th>Ne için</th><th>Örnek</th></tr>
  <tr><td>Elips</td><td>Başla / Bitir</td><td><code>Başla</code></td></tr>
  <tr><td>Paralelkenar</td><td>Veri girişi</td><td><code>A,B</code></td></tr>
  <tr><td>Dikdörtgen</td><td>İşlem, atama, hesaplama</td><td><code>Toplam=X+Y</code></td></tr>
  <tr><td>Eşkenar dörtgen (baklava)</td><td>Karar alma (koşul), E/H çıkışlı</td><td><code>Mod==0</code></td></tr>
  <tr><td>Alt kenarı dalgalı dikdörtgen</td><td>Yazdırma (ekrana çıktı)</td><td><code>Toplam</code></td></tr>
  <tr><td>Ok</td><td>Akış yönü</td><td></td></tr>
  <tr><td>Küçük daire</td><td>Birleştirici, bağlantı noktası</td><td></td></tr>
</table>
<ul>
  <li>Türleri: <b>doğrusal</b> (giriş → işlem → çıkış), <b>mantıksal</b> (karar ile dallanır), <b>döngüsel</b> (bazı adımlar tekrar eder).</li>
  <li>Döngüde sayaç önce ilk değerini alır (<code>sayac=0</code>), işlem yapılır, sayaç artar (<code>sayac=sayac+1</code>), karar kutusunda koşul doğruysa (E) geri dönülür, yanlışsa (H) devam edilir.</li>
  <li>Toplam için başlangıç <code>0</code>, çarpım/faktöriyel için başlangıç <code>1</code>.</li>
</ul>

<h2>2. Değişkenler ve veri tipleri</h2>
<ul>
  <li>Değişken, ilk değer atandığında tanımlanır: <code>x = 10</code>. Tipi sonradan değişebilir: <code>x = "metin"</code>.</li>
  <li>Ad <b>harf veya _</b> ile başlar, <b>rakamla başlayamaz</b>, sadece harf, rakam ve _ içerir. Büyük/küçük harf duyarlıdır: <code>yas</code>, <code>Yas</code>, <code>YAS</code> farklıdır.</li>
  <li>Tipler: <code>str</code> ("metin"), <code>int</code> (20), <code>float</code> (20.5), <code>bool</code> (True/False), <code>list</code>, <code>tuple</code>, <code>dict</code>, <code>set</code>, <code>range</code>. Tipi öğrenmek için <code>type(x)</code>.</li>
  <li><code>input()</code> her zaman <b>metin</b> döndürür. Sayı için: <code>int(input())</code> ya da <code>float(input())</code>.</li>
  <li>Kurallara uymayan yazım: <b>Syntax Error</b>.</li>
</ul>

<h2>3. Operatörler</h2>
<table class="format">
  <tr><th>Operatör</th><th>Anlamı</th><th>Örnek</th></tr>
  <tr><td><code>/</code></td><td>Bölme (her zaman float)</td><td><code>17/5</code> → 3.4, <code>10/5</code> → 2.0</td></tr>
  <tr><td><code>//</code></td><td>Bölümün tam kısmı</td><td><code>17//5</code> → 3</td></tr>
  <tr><td><code>%</code></td><td>Kalan (mod)</td><td><code>17%5</code> → 2</td></tr>
  <tr><td><code>**</code></td><td>Üs</td><td><code>5**4</code> → 625</td></tr>
  <tr><td><code>== != &gt; &lt; &gt;= &lt;=</code></td><td>Karşılaştırma (sonuç True/False)</td><td><code>7 == 7</code> → True</td></tr>
  <tr><td><code>and</code></td><td>İkisi de doğruysa doğru</td><td><code>(8&lt;10) and (6&gt;5)</code> → True</td></tr>
  <tr><td><code>or</code></td><td>Biri doğruysa doğru</td><td><code>(5==5) or (6==5)</code> → True</td></tr>
  <tr><td><code>not</code></td><td>Tersi</td><td><code>not(5==5)</code> → False</td></tr>
</table>
<div class="box trap"><b>Tuzak:</b> <code>=</code> atama, <code>==</code> karşılaştırma. İşlem sırası: <code>**</code> → <code>* / // %</code> → <code>+ -</code>. Çift sayı: <code>x % 2 == 0</code>.</div>

<h2>4. if / elif / else</h2>
<pre class="code">sayi = int(input())
if sayi &gt; 0:
    print("Pozitif")
elif sayi &lt; 0:
    print("Negatif")
else:
    print("Sıfır")</pre>
<ul>
  <li>Koşuldan sonra <b>iki nokta</b> (<code>:</code>), bloğun içi <b>4 boşluk girintili</b>.</li>
  <li>İlk doğru koşulun bloğu çalışır, gerisine bakılmaz.</li>
  <li><code>else</code> koşul almaz ve en fazla bir kez kullanılır. Ara koşullar <code>elif</code>.</li>
  <li>Aralık kontrolü: <code>if x &gt;= 0 and x &lt;= 10:</code> ya da iç içe iki if.</li>
</ul>

<h2>5. for döngüsü ve range</h2>
<pre class="code">for i in range(1, 6):
    print(i)        # 1 2 3 4 5</pre>
<p><code>range(başlangıç, bitiş, artış)</code>: <b>bitiş dahil değil</b>. Başlangıç yazılmazsa 0, artış yazılmazsa 1.</p>
<table class="format">
  <tr><th>Yazım</th><th>Değerler</th></tr>
  <tr><td><code>range(5)</code></td><td>0 1 2 3 4</td></tr>
  <tr><td><code>range(1, 6)</code></td><td>1 2 3 4 5</td></tr>
  <tr><td><code>range(1, 10, 2)</code></td><td>1 3 5 7 9</td></tr>
  <tr><td><code>range(2, 11, 2)</code></td><td>2 4 6 8 10</td></tr>
  <tr><td><code>range(10, 0, -1)</code></td><td>10 9 … 1</td></tr>
  <tr><td><code>range(1, n+1)</code></td><td>1'den n'e (n dahil)</td></tr>
  <tr><td><code>range(1, 1)</code></td><td>boş (hiç çalışmaz)</td></tr>
</table>
<pre class="code">toplam = 0
for i in range(1, sayi + 1):
    toplam += i      # toplam = toplam + i
print(toplam)        # döngünün DIŞINDA: bir kez yazdırır</pre>
<p><code>print(x, end=" ")</code> alt satıra geçmeden yan yana yazar.</p>

<h2>6. while döngüsü</h2>
<pre class="code">i = 1            # 1) sayacı başlat
while i &lt;= 5:     # 2) koşul doğru oldukça
    print(i)
    i += 1       # 3) sayacı değiştir</pre>
<div class="box trap"><b>Sonsuz döngü:</b> while içinde sayacı artırmayı/azaltmayı unutursan koşul hep True kalır ve program bitmez. Tekrar sayısı belliyse for, "şu olana kadar" ise while kullanılır (ör. 0 girilene kadar sayı iste: <code>while sayi != 0:</code>).</div>

<h2>Sık yapılan hatalar</h2>
<table class="format">
  <tr><th>Yanlış</th><th>Doğru</th></tr>
  <tr><td><code>if x &gt; 5</code></td><td><code>if x &gt; 5:</code></td></tr>
  <tr><td><code>if x = 5:</code></td><td><code>if x == 5:</code></td></tr>
  <tr><td><code>else x &lt; 5:</code></td><td><code>elif x &lt; 5:</code> ya da sadece <code>else:</code></td></tr>
  <tr><td><code>sayi = input()</code> sonra <code>sayi + 1</code></td><td><code>sayi = int(input())</code></td></tr>
  <tr><td><code>for i in range(1, 10)</code> (10 dahil sanmak)</td><td><code>range(1, 11)</code></td></tr>
  <tr><td><code>print(...)</code> döngü içinde (toplam her turda yazılır)</td><td>girintiyi kaldır, döngüden sonra yazdır</td></tr>
  <tr><td><code>(a + b + c / 3)</code></td><td><code>(a + b + c) / 3</code></td></tr>
</table>
`;
