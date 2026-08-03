# Changelog

## v1.0.1 — Yenilikler & Oyun Hissi

- Odalara isim verme; masa listesinde, masa/oyun ekranlarında gösterim; host yeniden adlandırabilir.
- Oyun seçimi altyapısı: masa kurulurken oyun tipi seçilir (`games/registry.js`, ileride yeni oyunlar eklenebilir), host oyun tipini sonradan değiştirebilir.
- Round-table görsel yeniden tasarım: yuvarlak masa, kod ile çizilmiş SVG maskot karakterler, oyuncuların masa etrafına dizilimi, gösterge/okey masa ortasında, atılan taşlar oyuncunun koltuğunda.
- Sürükle-bırak: taş çekme (yığın/atılan taştan ıstakaya), atma (ıstakadan atılan taş alanına) ve ıstaka içinde yeniden dizme — mobil dokunmatik destekli (`@dnd-kit`), eski tıkla-seç akışı kaldırıldı.
- Ses efektleri (Web Audio, sentetik) ve ayarlar sayfası (ses aç/kapa, seviye).
- Boşta kalan odaların otomatik kapanması (15 dakika hareketsizlik).
- Hamle süresi: host 20/30/45/60 saniye seçer, süre dolunca otomatik çekme + sezgisel "en mantıklı taş" atma.
- Emoji chat: maskot karakterin üzerinde beliren emoji balonu.
- Tasarım düzeltmeleri: düşük kontrastlı yazı renkleri giderildi, oyun ekranı daha "oyun gibi" bir görsel dil aldı.

## v1.0.0 — Tam Okey Deneyimi

- Lobi ve masa (oda) sistemi: kod + opsiyonel şifreli masa kurma/katılma, açık masa listesi.
- Host yetkileri: oyuncu atma, şifre değiştirme, hostluk devri, otomatik devir.
- Okey oyun motoru (saf fonksiyonlar): 106 taş, gösterge/okey taşı, çekme/atma, çift/set/run ile el bitirme, temel puanlama.
- Okey frontend arayüzü: taş görselleri, tıkla-seç ile atma (erişilebilirlik için sürükle-bırak yerine), sıra göstergesi.
- Oturum boyunca kalıcı skor tablosu, el sonu ve puan ekranları.
- PWA desteği: manifest, service worker, offline sayfası.
- Sade ve erişilebilir tasarım sistemi: büyük yazı tipi, yüksek kontrast, net dokunma alanları.
- Prodüksiyon deploy hazırlık dosyaları (docker-compose.prod.yml, nginx config örneği, adım adım talimatlar).

## v0.0.1 — Kurulum

- Proje iskeleti: backend (Express + Socket.io), frontend (React + Vite).
- PostgreSQL + Redis, Docker Compose ile ayağa kalkıyor.
- Misafir modu kullanıcı sistemi (isim gir, JWT ile oturum).
- Health check endpoint'i, temel socket bağlantısı.
- README ve proje planı dokümantasyonu.
