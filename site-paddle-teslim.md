# SITE-PADDLE teslimi

lernfino.com artık "yakında / bekleme listesi" değil, mağazada yayında bir ürün olarak anlatılıyor. Paddle incelemesi için yeni `/pricing/` ve `/refund/` sayfaları eklendi, `/terms/` ve `/privacy/` güncellendi, tüm sayfaların footer'ına Terms, Privacy, Refund, Pricing, `support@lernfino.com` ve `/imprint/` bağlantıları kondu. Commit atılmadı; `lernfinoapp` yalnız okundu.

## Ne yapıldı

- **Ana sayfa (15 dil):** Rozet "Google Play ve App Store'da · web sürümü (app.lernfino.com) çok yakında". Bekleme listesi formu kaldırıldı; yerine ürünü anlatan "Get the App" bölümü (`#download`), mağaza rozetleri, plan özeti ve Fiyatlandırma/İade bağlantıları geldi. Başlık, description ve OG metinleri yenilendi. Tools sayfalarındaki "Join Launch Waitlist" düğmeleri "Get the App" oldu.
- **Mağaza bağlantıları:** `<GOOGLE_PLAY_LINKI>` / `<APP_STORE_LINKI>` değişkeni repoda yok. İlk teslimde Google Play bağlantısı paket adından türetilmişti. Bağlantı ve App Store durumu SITE-PADDLE-2’de güncellendi.
- **/pricing/ (TR/EN/DE):** Ücretsiz, Plus, Pro, Sınav Pass kapsam tablosu; fiyat tablosu (aylık/yıllık, 7 gün deneme, yenileme); deneme, yenileme, iptal, Paddle (Merchant of Record), iade bölümleri. Kapsamlar `lernfinoapp/src/lib/entitlements.ts` ve `docs/magaza/{en,tr,de}.md` ile birebir: ücretsiz günlük 20 kart / 10 sesli cümle / 3 tur / 1 atlama testi / 100 kelime; AI yazma 2 + konuşma 2 (ömür boyu); Plus 5 + 2 aylık; Pro 30 + 8 aylık; Pass 12 haftada 90 + 24, yenilenmez; Pro'da tüm düzeylerde "Almanya'da Hayat" (Plus'ta yalnız A1); reklamsız.
- **/refund/ (TR/EN/DE):** Web satın alımlarında 14 gün içinde gerekçesiz iade talebi (Paddle üzerinden), AB/BK 14 günlük cayma hakkı ve dijital içerikte açık onay + feragat açıklaması, mağaza satın alımlarının Google/Apple kurallarına tabi olması, Paddle.com Market Limited'in Merchant of Record olarak satıcı olması. "Hiçbir koşulda iade yok" türü ifade yok.
- **/terms/:** 3. bölüm yeniden yazıldı (web aboneliği, Paddle MoR, web iptal yolu, iade bağlantısı; eski "web sitesinden ödeme alınmaz" cümlesi kaldırıldı). Tarih 27 Kasım 2026.
- **/privacy/:** Veri tablosuna "Web satın alımları (Paddle)" satırı, sağlayıcı listesine Paddle maddesi (TR/EN/DE).
- **Diller:** EN, TR, DE tam. Diğer 12 dilde yeni/değişen ana sayfa metinleri geçici olarak EN gösteriyor (`web2-build/lang/*.json` içinden değişen anahtarlar çıkarıldı); yasal sayfalar bu dillerde zaten EN metin + bağlayıcılık notu gösteriyor. Çeviri kaynağı: `web-ceviri/site-paddle/CEVIRI.md` (169 kimlik, TR + EN kaynak, 12 boş dil bloğu, talimat). Çevrilmedi.
- **sitemap.xml:** `/pricing/` ve `/refund/` eklendi.

## Kontroller

- `node --check`: `app.js`, `legal.js`, `tools.js` ve tüm `web2-build/*.cjs` geçti.
- `web2-build/paddle-links.cjs`: 25 HTML dosyasında göreli bağlantı, `#anchor` ve footer'da zorunlu bağlantı kontrolü, 0 sorun.
- `node --test tests/tools.test.cjs`: 2/2 geçti.
- `web2-build/build.cjs check`: TR/DE eksiksiz; 12 dilde 21'er anahtar bilerek eksik (EN gösterim).
- Tarayıcıda görsel kontrol yapılmadı.

## Fiyat tablosu

İlk teslimde web fiyatları onay bekliyordu. Onaylı EUR fiyatları ve diğer kararlar [SITE-PADDLE-2 teslim raporunda](site-paddle-2-teslim.md) yer alıyor.

| Plan | Mağaza referansı (USD / TL, `KULLANICI_MAGAZA_URUN_KURULUMU.md`) |
| --- | --- |
| Plus aylık | 6,99 USD / 149,99 TL |
| Plus yıllık (7 gün deneme) | 39,99 USD / 899,99 TL |
| Pro aylık | 12,99 USD / 279,99 TL |
| Pro yıllık (7 gün deneme) | 79,99 USD / 1.699,00 TL |
| Sınav Pass (12 hafta, tek ödeme) | 24,99 USD / 599,99 TL |

## Kullanıcıya sorular

1. Web (Paddle) EUR fiyatları yukarıdaki tabloda nedir? Fiyatlar KDV dâhil mi gösterilsin?
2. App Store URL'si nedir? Google Play için türetilen bağlantı doğru mu?
3. Web'de yıllık planlara da 7 günlük deneme verilecek mi? Sayfa, mağazadaki gibi "uygun yeni hesaplara" diyor.
4. Web satın alımı hangi hesaba bağlanacak ve uygulamadaki hak (Plus/Pro/Pass) nasıl eşleşecek? Sayfalar bunu henüz iddia etmiyor; netleşince eklenmeli.
5. 14 günlük iade yenileme ücretlerini de kapsıyor mu? Sayfalar "her web tahsilatından itibaren 14 gün" diyor; farklıysa `refund` metni düzeltilmeli.
6. İade e-postasında kullandığım yollar (paddle.net üzerinden sipariş bulma, `support@lernfino.com`) Paddle hesabınızdaki gerçek akışa uyuyor mu? Paddle kuralları (ör. kendi iade penceresi) hesabınızda farklı ayarlıysa metin buna göre değişmeli.
7. Paddle'ın gizlilik rolü: istediğiniz "ödeme verisi işleyicisi" ifadesini yazdım, ancak Merchant of Record olarak Paddle kendi yükümlülükleri için bağımsız sorumludur; metin ikisini de söylüyor. Hukuki danışmanınız onaylamalı. Ayrıca Paddle.com Market Limited'in adresi ve bağlantıları (`paddle.com/legal/checkout-buyer-terms`, `paddle.com/legal/privacy`, `paddle.net`) güncel mi, bir kez doğrulayın.
8. `app.lernfino.com` için yaklaşık tarih var mı? Şimdilik "çok yakında" yazıyor.
9. Gizlilik sayfasındaki eski bekleme listesi bölümü (5. bölüm) mevcut kayıtlar nedeniyle bırakıldı; formun kaldırılmasıyla bu bölüm ayrıca sadeleştirilebilir.

## Değişen dosyalar

- `index.html`, `tr/index.html`, `de/index.html`
- `es/`, `pt/`, `fr/`, `it/`, `pl/`, `ar/`, `ru/`, `uk/`, `hi/`, `vi/`, `id/`, `zh/` altındaki `index.html` (12 dosya)
- `app.js`, `styles.css`, `legal.js`, `tools.js`, `sitemap.xml`
- `pricing/index.html` (yeni), `refund/index.html` (yeni)
- `terms/index.html`, `privacy/index.html`, `support/index.html`, `imprint/index.html`, `delete-account/index.html`
- `exam-calculator/index.html`, `level-test/index.html`, `word-counter/index.html`
- `web-ceviri/site-paddle/CEVIRI.md` (yeni)
- `web2-build/lang/{es,pt,fr,it,pl,ar,ru,uk,hi,vi,id,zh}.json`, `web2-build/build.cjs` (yalnız dışa aktarma satırı)
- `web2-build/paddle-home.cjs`, `paddle-dicts.cjs`, `paddle-pages.cjs`, `paddle-content.cjs`, `paddle-legal.cjs`, `paddle-ceviri.cjs`, `paddle-links.cjs`, `paddle-tools.cjs`, `paddle-tools2.cjs`, `paddle-fix1.cjs`, `paddle-fix2.cjs`, `paddle-fix3.cjs`, `paddle-fix4.cjs` (yeni; tek seferlik üretim/onarım betikleri)
- `site-paddle-teslim.md`

Ayrıca bu oturumun başında, kapsamı çok geniş bir `grep` komutu zaman aşımına uğrayıp arka plana taşındı ve sistem tarafından durduruldu; dosya değiştirmedi.

KARAR: TAMAM
