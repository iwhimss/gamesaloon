# Changelog

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
