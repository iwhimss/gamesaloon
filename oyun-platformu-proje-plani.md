# Masa Oyunları Platformu — Proje Planı ve Claude Code Prompt Dosyası

## 1. Genel Vizyon

Tarayıcı üzerinden (PWA - installable) çalışan, çok oyunculu masa/parti oyunları platformu.
Kullanıcılar bir "oyun salonuna" girer, masa kurar, davet eder, oyun seçer ve oynar.
İlk sürümde **sadece Okey** (sade kurallar + puan sistemi) hedeflenir. Mimari, ileride
başka oyunlar (Batak, Kızma Birader, kelime oyunları vb.) eklenecek şekilde genişletilebilir olmalı.

VDS üzerine Docker ile deploy edilecek (mevcut altyapı: `fatihdikec.me`, Hosting Dünyam VDS).

---

## 2. Mimari Genel Bakış

```
[Tarayıcı / PWA]
      |
      | HTTPS (Nginx reverse proxy + SSL/Certbot)
      v
[Frontend - React/Vite]  <-- statik build, Nginx serve eder
      |
      | REST (auth, oda listeleme) + WebSocket (gerçek zamanlı oyun state)
      v
[Backend - Node.js (Express/Fastify) + Socket.io]
      |
      v
[PostgreSQL]  (kullanıcılar, oda geçmişi, skor tabloları)
[Redis]       (aktif oda state'i, oturum, hızlı erişim - opsiyonel ama önerilir)
```

**Neden bu yığın:** Petek, Inventra, jrWhims projelerindeki Node.js/PostgreSQL/Docker
deneyimini doğrudan kullanabilirsin. Yeni öğrenilecek asıl parça: **Socket.io ile
gerçek zamanlı çok kullanıcılı state senkronizasyonu** ve **oyun kural motoru mimarisi**.

### Neden Redis (opsiyonel ama tavsiye)
Aktif oyun masalarının state'i (kimde hangi taş, sıra kimde vb.) sürekli değişir ve
disk I/O'ya gerek yoktur. Redis'te tutup, el bittiğinde/masa kapanınca PostgreSQL'e
özet (skor, geçmiş) yazmak performanslı ve basit bir desen. Başlangıçta istersen
Redis'i atlayıp her şeyi Node.js process içinde (in-memory Map) tutabilirsin —
tek sunucu olduğu sürece sorun çıkarmaz, ileride yatay ölçeklenirse Redis'e geçersin.

---

## 3. Özellik Kırılımı

### 3.1 Kimlik / Kullanıcı
- Basit kayıt/giriş (email+şifre veya sadece kullanıcı adı + misafir modu — ilk sürümde
  misafir modu bile yeterli olabilir, karmaşıklığı azaltır).
- Kullanıcı profili: ad, avatar (basit ikon seçimi yeterli), toplam skor/istatistik.

### 3.2 Oyun Salonu (Lobi)
- Giriş yapan kullanıcı lobiye düşer.
- Aktif/açık masaların listesi görünür (dolu/boş, oyun tipi, oyuncu sayısı).
- "Masa Kur" butonu.

### 3.3 Masa (Oda) Sistemi
- Masa kurulurken:
  - Oyun tipi seçilir (başlangıçta sadece Okey).
  - Katılım kodu otomatik üretilir (örn. 6 haneli alfanümerik).
  - İsteğe bağlı şifre belirlenebilir.
  - Maksimum oyuncu sayısı (Okey için 4).
- Katılım: kod + (varsa) şifre ile.
- **Masa Yöneticisi (Host):**
  - Masayı kuran kişi otomatik host olur.
  - Host yetkileri: oyunu başlatma, oyuncu atma/engelleme, şifre değiştirme,
    oyun tipi/ayarları değiştirme (oyun başlamadan önce), **hostluğu başka bir
    oyuncuya devretme**.
  - Hostluk devri: host masadan ayrılırsa otomatik en kıdemli oyuncuya geçsin
    (yöneticisiz masa kalmamalı).
- Masa durumları: `bekleniyor` (lobi) → `oynanıyor` → `bitti/kapandı`.

### 3.4 Oyun Seçimi ve Genişletilebilir Yapı
- Backend'de her oyun bir "plugin" gibi düşünülmeli: ortak arayüz
  (`createGame`, `handleAction`, `getState`, `isGameOver`, `calculateScore`).
- Böylece yeni oyun eklemek, mevcut oda/lobi/host sistemine dokunmadan
  sadece yeni bir oyun modülü yazmak anlamına gelir.

### 3.5 Okey — Sade Kurallar (v1, minigame YOK)
Kapsam net tutulmalı, ilk sürüm gerçekten "düz" olsun:
- 4 oyuncu, 106 taş (1-13 arası 4 renk x 2 takım + 2 sahte okey).
- Gösterge taşı çekilir, okey taşı belirlenir.
- Sırayla taş çekme (orta yığın veya atılan taş) / taş atma.
- El bitirme kontrolü: çift (okey/çifte) veya seri/grup kombinasyonları.
- Standart puanlama: elini bitiren kazanır, çifte/elden kazanma gibi
  temel çarpanlar (istersen en basitinden başlayıp — sadece "kazanan +X puan,
  kaybedenler -Y puan" — sonra klasik okey puan tablosuna genişletirsin).
- **Kesinlikle yok (v1'de):** göz atma jetonu, taş çalma, sis perdesi, emoji,
  minigame, güç kartları. Bunlar v2+.

### 3.6 Puan Sistemi
- Her el sonunda skor tablosu güncellenir (masa içi, o oturuma özel).
- Masa kapanınca özet PostgreSQL'e yazılır (kullanıcı bazlı toplam istatistik
  için opsiyonel — ilk sürümde sadece o oturumun skor tablosunu göstermek bile yeterli).

---

## 4. Veritabanı Şeması (Taslak)

```sql
users (id, username, password_hash, avatar, created_at)

tables (
  id, code, password_hash NULL,
  host_user_id, game_type, status, max_players,
  created_at, closed_at
)

table_players (table_id, user_id, seat_no, joined_at, left_at)

game_sessions (id, table_id, game_type, started_at, ended_at, result_json)

score_history (id, game_session_id, user_id, score, created_at)
```

`result_json` ve oyun-içi anlık state PostgreSQL'e her hamlede yazılmaz —
sadece Redis/in-memory'de tutulur, el/oturum bitince özet kaydedilir. Bu, gereksiz
disk yazımını önler.

---

## 5. WebSocket Olay Taslağı (Socket.io)

```
Client -> Server:
  room:create      { gameType, password?, maxPlayers }
  room:join        { code, password? }
  room:leave       {}
  room:transferHost { targetUserId }
  room:changeSettings { password?, gameType? }
  game:start        {}
  game:action       { type: 'draw'|'discard'|'finishHand', payload }

Server -> Client:
  room:state        { players, host, status, gameType, settings }
  game:state         { hands (sadece kendi eli), discardPile, turn, indicatorTile }
  game:handEnded      { winnerId, scores }
  game:error          { message }
```

**Önemli güvenlik notu:** Her oyuncuya sadece kendi elini gönder — sunucu
tarafında per-socket filtrelenmiş state yayını yapılmalı, aksi halde client
tarafında "hile" mümkün olur (tarayıcı devtools ile rakip elini görme).

---

## 6. Docker Yapısı

```
docker-compose.yml
  services:
    frontend   (nginx, build edilmiş React statikleri serve eder)
    backend    (node.js, socket.io + express)
    postgres   (veri kalıcılığı, volume ile)
    redis      (opsiyonel, aktif oyun state)
  network: internal bridge
  nginx (reverse proxy, ana sunucuda) -> frontend + backend/socket.io proxy
```

- `.env` ile secrets (DB şifresi, JWT secret vb.) yönetilir, repo'ya girmez.
- `docker-compose up -d --build` ile güncelleme kolaylığı (Petek deploy sürecine benzer).
- SSL: Certbot, mevcut `fatihdikec.me` sertifika sürecine benzer şekilde
  yeni bir subdomain için (örn. `oyun.fatihdikec.me`).

---

## 7. Geliştirme Sırası (Roadmap v1)

1. Proje iskeleti: backend (Express+Socket.io) + frontend (React+Vite) + Docker Compose ayağa kaldırma.
2. Kullanıcı sistemi (basit auth veya misafir modu).
3. Lobi ekranı + masa oluşturma/katılma (kod+şifre) — henüz oyun yok, sadece oda mekaniği.
4. Host yetkileri (devretme, ayar değiştirme, oyuncu atma).
5. Okey oyun motoru (backend, kural mantığı, test edilebilir saf fonksiyonlar halinde).
6. Okey frontend (taş görselleri, sürükle-bırak, sıra göstergesi).
7. Puan sistemi + el/oturum sonu ekranları.
8. PWA ayarları (manifest.json, service worker, "ana ekrana ekle").
9. VDS'e Docker ile deploy.
10. (v2+) Minigame/eğlence katmanı, yeni oyunlar (Batak, kelime oyunları vb.).

---

## 8. Claude Code Başlangıç Promptu

Aşağıdaki metni doğrudan Claude Code'a proje klasöründe ilk prompt olarak verebilirsin:

```
Bir masa oyunları platformu geliştiriyorum. İlk hedef: Okey oyunu, sade kurallar,
minigame yok, sadece puan sistemi.

Mimari:
- Backend: Node.js + Express + Socket.io
- Frontend: React + Vite
- DB: PostgreSQL (kullanıcı, masa geçmişi, skor özetleri için)
- Aktif oyun state'i: başlangıçta in-memory (Map), ileride Redis'e taşınabilir yapıda
- Docker Compose ile paketlenecek (frontend, backend, postgres servisleri)

Akış:
1. Kullanıcı siteye girer -> oyun salonu (lobi) görür.
2. Masa kurar (oyun tipi seçer - şimdilik sadece Okey, katılım kodu otomatik üretilir,
   opsiyonel şifre belirlenebilir, max 4 oyuncu).
3. Diğer kullanıcılar kod + (varsa) şifre ile katılır.
4. Masayı kuran kişi "host" olur: oyunu başlatma, oyuncu atma, şifre değiştirme,
   hostluğu başka oyuncuya devretme yetkilerine sahip.
5. Host oyunu başlatınca Okey oyun motoru devreye girer.
6. Okey kuralları: 106 taş, gösterge taşı ve okey taşı belirleme, sırayla çekme/atma,
   çift/seri ile el bitirme, temel puanlama (kazanan +puan, kaybedenler -puan).
7. Her oyuncuya SADECE kendi eli gönderilmeli (sunucu tarafında per-socket filtreleme,
   rakip elini asla client'a sızdırma).
8. El/oturum bitince skor tablosu güncellenir ve PostgreSQL'e özet yazılır.

Lütfen şu sırayla ilerleyelim, her adımda bana açıklayarak ve onay alarak devam et:
1. Proje iskeletini kur (backend + frontend + docker-compose.yml, henüz iş mantığı yok,
   sadece "merhaba dünya" seviyesinde ayağa kalksın).
2. Kullanıcı/oturum sistemi (basit, misafir modu ile başlayabiliriz).
3. Lobi + masa oluşturma/katılma mekaniği (WebSocket ile oda state senkronizasyonu).
4. Host yetkileri.
5. Okey oyun motoru (backend'de saf/test edilebilir fonksiyonlar halinde, ayrı modül).
6. Okey frontend arayüzü.
7. Puan sistemi ve oturum sonu ekranları.

Git commit'lerini ve deployment komutlarını bana sen açıklayarak öner, ben çalıştırayım
(git ve deploy adımlarında kontrolü elimde tutmak istiyorum). Her adımda önce kısa bir
plan sun, onay alınca kodla.
```

---

## 9. Notlar

- İlk sürümde auth'u karmaşıklaştırma — misafir modu (isim gir, oyna) bile
  platformu test etmek için yeterli olabilir; gerçek kayıt sistemini v2'ye bırakabilirsin.
- Okey kural motorunu **saf fonksiyonlar** halinde yazmak (state içeri, yeni state
  dışarı, socket/network koduna bağımlı olmadan) hem test etmeyi hem ileride başka
  bir arayüze (mobil app gibi) taşımayı kolaylaştırır.
- PWA kısmını en sona bırak — önce masaüstü tarayıcıda stabil çalışsın, sonra
  manifest + service worker ekleyip "yüklenebilir" hale getirirsin.
