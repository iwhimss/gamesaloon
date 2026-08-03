# Oyun Salonu

Tarayıcı üzerinden çok oyunculu masa/parti oyunları platformu. Kullanıcılar bir
"oyun salonuna" girer, masa kurar, davet eder, oyun seçer ve oynar. İlk hedef:
**Okey** (sade kurallar, minigame yok, sadece puan sistemi).

Detaylı proje planı için: [`oyun-platformu-proje-plani.md`](oyun-platformu-proje-plani.md)
Sürüm bazlı ilerleme planları için: [`.plan/`](.plan) klasörü.

## Özellikler (v1.0.1)

- Misafir modu ile giriş (isim gir, oyna)
- Lobi: açık masaları listeleme, kod + opsiyonel şifre ile masa kurma/katılma, masa adı verme
- Oyun seçimi altyapısı: masa kurulurken oyun tipi seçilir, host sonradan değiştirebilir (şu an sadece Okey, mimari genişletilebilir)
- Host yetkileri: oyuncu atma, şifre değiştirme, hostluk devri, host ayrılırsa otomatik devir, masa yeniden adlandırma, hamle süresi/oyun tipi ayarı
- Round-table görsel tasarım: yuvarlak masa, SVG maskot karakterler, oyuncuların masa etrafına dizilimi
- Okey oyun motoru: 106 taş, gösterge/okey taşı, sırayla çekme/atma, el bitirme (çift veya set/run), temel puanlama
- Sürükle-bırak: taş çekme/atma ve ıstakada yeniden dizme (mobil dokunmatik destekli)
- Ses efektleri (Web Audio, sentetik) ve ayarlar sayfası
- Emoji chat: maskot karakterin üzerinde beliren emoji balonu
- Hamle süresi + süre dolunca otomatik ("en mantıklı") taş atma
- Boşta kalan odaların otomatik kapanması (15 dakika hareketsizlik)
- Oturum boyunca kalıcı skor tablosu, el sonu ekranı
- PWA: ana ekrana eklenebilir, temel offline sayfası
- Sade, erişilebilir arayüz (büyük yazı tipi, yüksek kontrast, net dokunma alanları)

## Mimari

```
[Tarayıcı / PWA]
   | HTTPS
   v
[Frontend - React + Vite]  (statik, Nginx serve eder)
   | REST + WebSocket (Socket.io)
   v
[Backend - Node.js + Express + Socket.io]
   |
   v
[PostgreSQL]  kullanıcılar, masa geçmişi, skor tabloları
[Redis]       aktif masa/oyun state'i
```

## Gereksinimler

- Node.js >= 22
- Docker + Docker Compose

## Geliştirme (yerel, Docker olmadan)

```bash
npm install
cp .env.example .env
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

Yerel geliştirmede PostgreSQL/Redis çalışmıyorsa `/health` endpoint'i
`degraded` durumu ve ilgili servis hatasını döner; misafir girişi veritabanı
gerektirdiği için bu modda çalışmaz.

Okey kural motorunu (saf fonksiyonlar) hızlıca doğrulamak için:

```bash
cd backend
npm run test:okey-rules
```

## Docker Compose ile çalıştırma (yerel/geliştirme)

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:4000 (`/health` ile durum kontrolü)
- PostgreSQL: localhost:5433 (host'a açık, migration çalıştırmak için — 5432 diğer projelerle çakışabildiği için 5433 kullanılıyor)
- Redis: localhost:6380 (host'a açık, geliştirme kolaylığı için — 6379 diğer projelerle çakışabildiği için 6380 kullanılıyor)

İlk kurulumda veritabanı migration'larını çalıştırın:

```bash
cd backend
npm run migrate up
```

## Proje yapısı

```
backend/
  src/rooms/    Lobi, masa, host yetkileri, oyun/hamle zamanlayıcı, emoji chat (socket + Redis state)
  src/games/registry.js  Desteklenen oyun tipleri listesi
  src/games/okey/  Okey kural motoru (saf fonksiyonlar) ve socket entegrasyonu
  src/routes/   REST endpoint'leri (health, guest-login, tables, games)
  src/db/       PostgreSQL pool, Redis client
  migrations/   node-pg-migrate şema dosyaları
frontend/
  src/screens/  Login, Lobby, Table, Game, HandEnd, Settings ekranları
  src/components/  Tile, Mascot, PlayerSeat, sürükle-bırak bileşenleri (Draggable/DragSource/DropZone)
  src/audio/    Web Audio tabanlı sentetik ses efektleri
  src/lib/      Koltuk yerleşimi (seatLayout), ayarlar (localStorage)
  public/       manifest.json, service worker, ikonlar (PWA)
deploy/         Prodüksiyon deploy hazırlık dosyaları (nginx, .env örneği, adımlar)
.plan/          Sürüm bazlı fazlı geliştirme planları ve ilerleme notları
```

## Sürüm

Güncel sürüm: **1.0.1** — oyun hissi veren görsel tasarım (round-table,
maskotlar), sürükle-bırak, oda/oyun ayarları, ses efektleri, emoji chat,
hamle süresi ve otomatik oda kapanma. Detaylar için [`CHANGELOG.md`](CHANGELOG.md).

## Prodüksiyon Deploy

Hedef: `gamesaloon.fatihdikec.me` (VDS, Docker, Cloudflare DNS).
Adım adım talimatlar, prod `docker-compose.prod.yml` ve nginx config örneği
için: [`deploy/README.md`](deploy/README.md).

Bu depo sadece deploy **hazırlık dosyalarını** içerir — gerçek VDS'e
SSH/yükleme işlemi elle yapılır.
