# Chat Sistemi Kurulum ve Kullanım Kılavuzu

Bu kılavuz, MindCubes AI Chat sisteminin nasıl kurulacağını ve kullanılacağını açıklar.

## 🎯 Genel Bakış

Chat sistemi 3 katmandan oluşur:
1. **Frontend** (React) - Kullanıcı arayüzü
2. **Backend** (Node.js/Express) - API Gateway
3. **AI Engine** (Python/FastAPI) - AI işlemleri

## 🚀 Kurulum

### 1. AI Engine'i Başlatma

```bash
cd ai-engine

# Virtual environment'ı aktif et (Windows)
.\venv\Scripts\activate

# API sunucusunu başlat
python api.py
```

AI Engine şu adreste çalışacak: `http://localhost:8000`

### 2. Backend'i Başlatma

```bash
cd backend

# Bağımlılıkları yükle (ilk defa)
npm install

# .env dosyasını yapılandır
# AI_ENGINE_URL=http://localhost:8000

# Sunucuyu başlat
npm run dev
```

Backend şu adreste çalışacak: `http://localhost:5000`

### 3. Frontend'i Başlatma

```bash
cd frontend

# Bağımlılıkları yükle (ilk defa)
npm install

# Development sunucusunu başlat
npm run dev
```

Frontend şu adreste çalışacak: `http://localhost:3000`

## 💬 Kullanım

1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Giriş yapın (veya kayıt olun)
3. Sol menüden **"Chat"** seçeneğine tıklayın
4. Mesajınızı yazın ve gönderin!

## 🔧 Yapılandırma

### Backend .env Dosyası

```env
# AI Engine URL
AI_ENGINE_URL=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### AI Engine Yapılandırması

`ai-engine/api.py` dosyasında AI modeli değiştirilebilir:

```python
# OpenAI kullanmak için
llm_provider = OpenAIProvider(model_name="gpt-4")

# Yerel model kullanmak için (ücretsiz)
llm_provider = LocalModelProvider(
    model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    load_in_4bit=True,
)
```

## 🔒 Güvenlik Özellikleri

- **Authentication**: Tüm chat istekleri JWT token ile korunur
- **Rate Limiting**: Dakikada maksimum 20 mesaj
- **Input Validation**: Boş veya geçersiz mesajlar reddedilir
- **Error Handling**: Kullanıcı dostu hata mesajları

## 📊 API Endpoints

### Backend (Node.js)
- `POST /api/v1/chat` - Mesaj gönder
- `GET /api/v1/chat/history` - Geçmişi getir
- `DELETE /api/v1/chat/history` - Geçmişi temizle

### AI Engine (Python)
- `POST /api/chat` - AI ile iletişim
- `GET /api/agents` - Mevcut agent'ları listele
- `GET /api/stats` - Sistem istatistikleri

## 🎨 Tasarım Özellikleri

- **Modern UI**: Gradient renkler ve smooth animasyonlar
- **Responsive**: Mobil ve desktop uyumlu
- **Real-time**: Anlık mesajlaşma
- **Auto-scroll**: Otomatik mesaj kaydırma
- **Loading states**: Yükleme göstergeleri

## 🐛 Sorun Giderme

### AI Engine'e bağlanılamıyor
- AI Engine'in çalıştığından emin olun (`python api.py`)
- Backend .env dosyasındaki `AI_ENGINE_URL` ayarını kontrol edin

### Rate limit hatası
- Çok hızlı mesaj gönderiyorsunuz, 1 dakika bekleyin
- Rate limit ayarlarını `backend/src/middleware/rateLimit.js` dosyasından değiştirebilirsiniz

### OpenAI API hatası
- `.env` dosyasında `OPENAI_API_KEY` ayarlandığından emin olun
- Veya yerel model kullanmaya geçin (ücretsiz)

## 📝 Notlar

- Chat geçmişi şu anda bellekte tutulur (database entegrasyonu TODO)
- Her kullanıcı için son 50 mesaj saklanır
- AI Engine başlatıldığında otomatik olarak model indirilir (ilk seferde)

## 🔄 Güncellemeler

Yeni özellikler eklemek için:

1. **Frontend**: `frontend/src/pages/Chat.jsx` dosyasını düzenleyin
2. **Backend**: `backend/src/controllers/chatController.js` dosyasını düzenleyin
3. **AI Engine**: `ai-engine/api.py` dosyasını düzenleyin

## 🎉 Tamamlandı!

Artık tamamen çalışan bir AI chat sistemine sahipsiniz. Herhangi bir sorunuz olursa issue açabilirsiniz.

