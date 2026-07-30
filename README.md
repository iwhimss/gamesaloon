# Oyun Salonu

Tarayıcı üzerinden çok oyunculu masa/parti oyunları platformu. Kullanıcılar bir
"oyun salonuna" girer, masa kurar, davet eder, oyun seçer ve oynar. İlk hedef:
**Okey** (sade kurallar, minigame yok, sadece puan sistemi).

Detaylı proje planı için: [`oyun-platformu-proje-plani.md`](oyun-platformu-proje-plani.md)
Sürüm bazlı ilerleme planları için: [`.plan/`](.plan) klasörü.

## Mimari

```
[Tarayıcı]
   | HTTPS
   v
[Frontend - React + Vite]  (statik, Nginx serve eder)
   | REST + WebSocket (Socket.io)
   v
[Backend - Node.js + Express + Socket.io]
   |
   v
[PostgreSQL]  kullanıcılar, masa geçmişi, skor tabloları
[Redis]       aktif masa state'i
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

## Docker Compose ile çalıştırma

```bash
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:4000 (`/health` ile durum kontrolü)
- PostgreSQL: localhost:5433 (host'a açık, migration çalıştırmak için — 5432 diğer projelerle çakışabildiği için 5433 kullanılıyor)
- Redis: container içi ağda, host'a açık değil

İlk kurulumda veritabanı migration'larını çalıştırın:

```bash
cd backend
npm run migrate up
```

## Proje yapısı

```
backend/    Express + Socket.io API, PostgreSQL/Redis erişimi, misafir modu auth
frontend/   React + Vite arayüzü
.plan/      Sürüm bazlı fazlı geliştirme planları ve ilerleme notları
```

## Sürüm

Güncel sürüm: **0.0.1** — proje iskeleti + misafir modu kullanıcı sistemi.
Detaylar için [`CHANGELOG.md`](CHANGELOG.md).

## Deploy

Prodüksiyon: `gamesaloon.fatihdikec.me` (VDS, Docker, Cloudflare DNS).
Nginx reverse proxy + Certbot kurulumu ileriki bir sürümde eklenecek.
