# Prodüksiyon Deploy — gamesaloon.fatihdikec.me

Bu klasördeki dosyalar **hazırlık** amaçlıdır; VDS'e gerçek yükleme ve SSH
işlemleri elle (veya kendi otomasyon script'lerinizle) yapılmalıdır. Aşağıdaki
adımlar Petek/Inventra projelerindeki deploy akışına benzer şekilde tasarlandı.

## Ön koşullar

- VDS'de Docker + Docker Compose kurulu.
- `gamesaloon.fatihdikec.me` DNS kaydı Cloudflare üzerinden VDS'in IP'sine
  yönlendirilmiş (A kaydı). Cloudflare proxy (turuncu bulut) kullanıyorsanız,
  Certbot'un http-01 doğrulaması için proxy'yi geçici olarak kapatmanız
  gerekebilir; DNS-01 doğrulama kullanıyorsanız gerek yok.
- nginx VDS'de kurulu (mevcut `fatihdikec.me` kurulumunda muhtemelen zaten var).

## Adımlar

1. **Repoyu VDS'e çekin**
   ```bash
   git clone https://github.com/iwhimss/gamesaloon.git
   cd gamesaloon
   ```

2. **Prodüksiyon `.env` dosyasını oluşturun**
   ```bash
   cp deploy/.env.production.example .env
   # .env içindeki JWT_SECRET, POSTGRES_PASSWORD gibi değerleri gerçek,
   # güçlü değerlerle doldurun.
   ```

3. **Docker Compose ile ayağa kaldırın**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Bu, `backend` (127.0.0.1:4000) ve `frontend`i (127.0.0.1:8080) sadece
   localhost'a açar — dışarıya nginx üzerinden erişilir.

4. **Veritabanı migration'larını çalıştırın**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend sh -c "cd /app && npx node-pg-migrate up"
   ```
   (Backend imajı `--omit=dev` ile build edildiği için `node-pg-migrate`
   container içinde yoksa, migration'ı host'ta `DATABASE_URL` ile
   localhost'a yönlendirerek de çalıştırabilirsiniz — bkz. kök `README.md`.)

5. **nginx reverse proxy kurulumu**
   ```bash
   sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/gamesaloon
   sudo ln -s /etc/nginx/sites-available/gamesaloon /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **SSL (Certbot)**
   ```bash
   sudo certbot --nginx -d gamesaloon.fatihdikec.me
   ```
   Certbot, `nginx.conf.example`'daki 443 bloğuna otomatik olarak
   `ssl_certificate` satırlarını ekler ve HTTP→HTTPS yönlendirmesini
   yapılandırır (yukarıdaki 80 bloğu zaten manuel olarak yönlendiriyor).

7. **Doğrulama**
   - `https://gamesaloon.fatihdikec.me/health` → `{"status":"ok",...}`
   - Tarayıcıda ana sayfa açılıyor, misafir girişi çalışıyor, Socket.io
     bağlantısı kuruluyor (WebSocket upgrade nginx'ten geçiyor).

## Güncelleme (yeni sürüm deploy etme)

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Notlar

- `docker-compose.prod.yml`'deki tüm portlar `127.0.0.1`'e bağlı — dışarıdan
  doğrudan `:4000` veya `:8080` ile erişilemez, sadece nginx üzerinden.
- Redis ve PostgreSQL prod compose'da host'a hiç açılmıyor (dev'deki 5433/6380
  eşlemeleri sadece yerel geliştirme kolaylığı için, prod'da gereksiz).
- Loglar `json-file` driver ile max 10MB x 3 dosya olacak şekilde sınırlandı
  (disk şişmesini önlemek için).
