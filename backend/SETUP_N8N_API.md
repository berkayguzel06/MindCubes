# n8n API Key Alma Rehberi

## Adım 1: n8n'i Aç
http://localhost:5678 adresine git

## Adım 2: n8n'de API Erişimini Aç
1. Sağ üstteki kullanıcı ikonuna tık
2. **Settings** (Ayarlar) seçeneğine tıkla
3. Sol menüden **API** seçeneğini bul
4. **API Access** switch'ini aktif et (ON yap)

## Adım 3: API Key Oluştur
1. Aynı API sayfasında **"Add API Key"** butonuna tıkla
2. Bir isim ver (örn: "MindCubes")
3. API Key kopyalanacak - bunu kaydet!

## Adım 4: .env Dosyası Oluştur
Backend klasöründe .env dosyası oluştur ve şu içeriği ekle:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d

# n8n Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=BURAYA_KOPYALADIĞIN_API_KEY_YAZI
N8N_WEBHOOK_URL=http://localhost:5678

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mindcubes
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password-here
POSTGRES_SSL=false
```

BURAYA_KOPYALADIĞIN_API_KEY_YAZI yazan yere kopyaladığın API key'i yapıştır.

## Adım 5: Backend'i Yeniden Başlat
Backend sunucusunu durdur (Ctrl+C) ve tekrar başlat:
```bash
npm run dev
```

## Test Et
http://localhost:3000/agents sayfasına git ve workflow'larını göreceksin!

