# AI Engine Nasıl Başlatılır? 🚀

## Hızlı Başlangıç
```bash
python -m venv venv

pip install -r requirements.txt
```
### Yöntem 1: run.py ile (Önerilen)
```bash
# Terminal'de ai-engine klasörüne gidin
cd ai-engine

# Virtual environment'ı aktif edin
venv\Scripts\activate

# Server'ı başlatın
python run.py
```

### Yöntem 2: uvicorn ile
```bash
cd ai-engine
venv\Scripts\activate
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Yöntem 3: Modül olarak
```bash
# Proje ana dizininde
python -m ai-engine
```

## Server Bilgileri

- **API URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:8000/health
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### 1. Health Check
```bash
GET http://localhost:8000/
GET http://localhost:8000/health
```

### 2. Chat Endpoint
```bash
POST http://localhost:8000/api/chat
Content-Type: application/json

{
  "message": "Hello, can you help me with coding?",
  "userId": "user123",
  "history": []
}
```

### 3. List Agents
```bash
GET http://localhost:8000/api/agents
```

### 4. Get Statistics
```bash
GET http://localhost:8000/api/stats
```

## Örnek Test (PowerShell)

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get

# Chat request
$body = @{
    message = "Write a Python function to calculate fibonacci numbers"
    userId = "test_user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/chat" -Method Post -Body $body -ContentType "application/json"
```

## Örnek Test (curl)

```bash
# Health check
curl http://localhost:8000/health

# Chat request
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "userId": "test_user"}'
```

## Sorun Giderme

### Port zaten kullanımda hatası
```bash
# Farklı port kullanın
python run.py --port 8001
```

### Import hataları
```bash
# Virtual environment aktif olduğundan emin olun
venv\Scripts\activate

# Gerekli paketleri yükleyin
pip install -r requirements.txt
```

### OpenAI API Key gerekiyorsa
```bash
# .env dosyası oluşturun
echo OPENAI_API_KEY=your_key_here > .env
```

## Not

- İlk başlatmada model indirme işlemi olabilir (local model kullanıyorsanız)
- OpenAI API key yoksa sistem otomatik olarak local modele geçer
- Development mode'da server otomatik olarak kod değişikliklerini algılar (reload=True)

## Frontend ile Bağlantı

Backend (Node.js) server'ınız bu AI Engine'e şu şekilde bağlanabilir:

```javascript
// backend/src/services/aiService.js
const axios = require('axios');

const AI_ENGINE_URL = 'http://localhost:8000';

async function sendMessage(message, userId) {
  const response = await axios.post(`${AI_ENGINE_URL}/api/chat`, {
    message,
    userId,
    history: []
  });
  return response.data;
}
```

Başarılar! 🎉

