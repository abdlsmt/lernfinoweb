# SITE-PADDLE-2 teslimi

Fiyatlandırma, mağaza erişimi, deneme, hesap eşleştirmesi, iade ve gizlilik metinleri ana çalışma kopyasında güncellendi. Çalışma ve doğrulama dizini `C:\Users\SAYGI\Almancauygulamasi\lernfinoweb`. Commit atılmadı.

## Uygulanan kararlar

Web fiyatları EUR cinsinden ve KDV dâhil gösteriliyor.

| Plan | Aylık | Yıllık | Tek ödeme |
| --- | ---: | ---: | ---: |
| Plus | 6,99 € | 39,99 € | — |
| Pro | 12,99 € | 79,99 € | — |
| Sınav Pass | — | — | 24,99 € |

- Uygun yeni Lernfino hesaplarına yıllık web Plus ve Pro planlarında 7 gün ücretsiz deneme sunulduğu belirtildi.
- Web satın alımı e-posta, Google veya Apple ile giriş yapılan Lernfino hesabına bağlanır. Aynı hesap mobil uygulamada satın alınan Plus, Pro veya Sınav Pass erişimini açar. Fiyat sayfasına bu akış eklendi.
- 15 ana sayfadaki Google Play rozetleri `com.respecode.lernfino` paketine yöneliyor. App Store rozeti bağlantısız ve Türkçede “Çok yakında” olarak görünüyor. Web sürümü için `app.lernfino.com` ve Aralık 2026 duyuruldu.
- Yenilemeler dâhil her web tahsilatı için 14 gün içinde gerekçesiz tam iade talep edilebildiği fiyat ve kullanım koşulları sayfalarında açıkça yazıldı. İade politikasındaki sipariş bulma ve talep kanalları `paddle.net` ile `support@lernfino.com`. Paddle'ın Merchant of Record ve gizlilik kapsamındaki rol açıklamaları korundu.
- Gizlilik politikasının 5. bölümü, kaldırılmış formdan gelen eski bekleme listesi kayıtlarına odaklanacak şekilde sadeleştirildi. Kayıt kapsamı, saklama süresi ve rızayı geri çekme yolu belirtildi.

## Doğrulama

- `node web2-build/paddle-links.cjs` 25 HTML sayfasında 0 sorun buldu. Bu betik yerel bağlantıları, sayfa içi hedefleri ve zorunlu altbilgi bağlantılarını denetler.
- Statik içerik kontrolü 15 ana sayfadaki Google Play adresini, bağlantısız App Store rozetini ve yerelleştirilmiş yayın tarihini doğruladı. Türkçe, İngilizce ve Almanca fiyat tabloları, deneme, hesap ve iade metinleri kontrol edildi. Fiyat yer tutucusu bulunmadı.
- `node --check` 24 JavaScript ve CJS dosyasında geçti. `node --test tests/tools.test.cjs` 2/2 geçti. `git diff --check` geçti.
- Dil sözlüğü kontrolünde önceki teslimin İngilizceye dönen 240 anahtarı kaldı. Fiyatlandırma, iade ve diğer yasal içerik Türkçe, İngilizce ve Almanca sunuluyor. Diğer site dillerinde mevcut İngilizce yedek gösterim kullanılıyor.
- Doğrulama kapsamı üretilen site dosyaları ve yerel testlerdi.

## Değişen dosyalar

- Ana sayfalar `index.html` ve `{tr,de,es,pt,fr,it,pl,ar,ru,uk,hi,vi,id,zh}/index.html`
- Ortak betikler `app.js`, `legal.js` ve `tools.js`
- Fiyat ve yasal sayfalar `{pricing,refund,terms,privacy,support,imprint,delete-account}/index.html`
- Araç sayfaları `{exam-calculator,level-test,word-counter}/index.html`
- Yerel üretim kaynakları `web2-build/{paddle-content,paddle-legal,paddle-ceviri,paddle-home,paddle-dicts,paddle-pages}.cjs` ve `web2-build/lang/{es,pt,fr,it,pl,ar,ru,uk,hi,vi,id,zh}.json`
- Çeviri ve teslim kayıtları `web-ceviri/site-paddle/CEVIRI.md`, `site-paddle-teslim.md` ve `site-paddle-2-teslim.md`

`web2-build/` mevcut `.gitignore` kuralı kapsamında. Üretim kaynakları ana çalışma kopyasında güncellendi ve çıktılar yeniden üretildi.

KARAR: TAMAM
