# SITE-GIZLILIK teslimi

Gizlilik politikasının Türkçe, İngilizce ve Almanca sağlayıcı maddeleri ile veri kategorisi ve amaç hücreleri güncellendi. Politika tarihi 27 Kasım 2026 olarak ayarlandı.

`../lernfinoapp/supabase/functions/report-digest` ve 0019/0020 geçişleri, yeni içerik bildirimleri veya tanı (hata) raporları olduğunda özetin altı saatte bir Resend üzerinden işletmecinin kendi e-posta adresine gönderildiğini doğruluyor. Gönderi, maskelenmiş rapor ayrıntılarını içeren bir JSON eki taşıyor. Hata raporları için 90 günlük, içerik bildirimleri için 180 günlük ve sağlayıcı günlükleri için mevcut saklama metinleri korundu.

Çeviri dosyasında üç kimlikli Türkçe ve İngilizce kaynak parçası ile 12 boş dil bloğu var. İstenen `../web-ceviri/site-resend/` klasörünü oluşturma girişimi erişim reddiyle sonuçlandığı için dosyanın tek kopyası ana checkout içindeki `web-ceviri/site-resend/CEVIRI.md` yoluna yazıldı.

Doğrulama `C:\Users\SAYGI\Almancauygulamasi\lernfinoweb` ana checkout’unda yapıldı. Yerel kontroller üç dildeki sağlayıcı ve tablo metinlerini, 15 dildeki gizlilik tarihini, hesap silme sayfasının tarihini, saklama metinlerini ve 12 boş dil bloğunu doğruladı. `node --check legal.js`, `node --test tests/tools.test.cjs` (2/2) ve `git diff --check` geçti.

## Değişen dosyalar

- `privacy/index.html`
- `legal.js`
- `web-ceviri/site-resend/CEVIRI.md`
- `site-gizlilik-teslim.md`

KARAR: TAMAM
