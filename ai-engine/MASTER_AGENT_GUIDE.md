# Master Agent & N8n Workflow Integration Guide

## Genel Bakış

Bu sistem, chat ekranından n8n workflow'larını tetikleyebilen bir Master Agent yapısı sunar. Kullanıcı mesajını analiz eder ve uygun workflow'u otomatik olarak çalıştırır.

## Mimari

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   AI Engine API  │────▶│   N8n Webhooks  │
│   (Chat UI)     │     │  (Master Agent)  │     │   (Workflows)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Ollama/LLM     │
                        │  (gpt-oss:20b)   │
                        └──────────────────┘
```

## Bileşenler

### 1. N8n Workflow Tool'ları (`ai-engine/tools/n8n_workflow_tools.py`)

Her workflow için bir tool tanımlandı:

| Tool | Açıklama | Tetikleyici Kelimeler |
|------|----------|----------------------|
| `todo_workflow` | Görev çıkarma ve oluşturma | görev, task, yapılacak, todo |
| `calendar_workflow` | Takvim etkinliği oluşturma | takvim, calendar, toplantı, randevu |
| `drive_workflow` | Dosya buluta kaydetme | kaydet, save, drive, bulut |
| `mail_categorization_workflow` | E-posta kategorilendirme | kategorile, düzenle, organize |
| `mail_prioritizing_workflow` | E-posta önceliklendirme | öncelik, önemli, acil |

### 2. Master Agent (`ai-engine/agents/master_agent.py`)

Master Agent şu görevleri yerine getirir:
- Kullanıcı mesajını analiz eder
- Intent detection ile hangi tool'un kullanılacağına karar verir
- N8n webhook'unu tetikler
- Sonucu kullanıcıya döndürür

Intent detection iki aşamalıdır:
1. **Keyword Detection**: Hızlı, regex tabanlı eşleştirme
2. **LLM Detection**: Daha akıllı, bağlam farkında analiz

### 3. API Endpoints (`ai-engine/api.py`)

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/chat` | POST | Ana chat endpoint'i, Master Agent kullanır |
| `/api/chat/workflow` | POST | Dosya yüklemeli workflow tetikleme |
| `/api/workflows/tools` | GET | Mevcut workflow tool'larını listeler |

### 4. Frontend Chat (`frontend/app/chat/page.tsx`)

Yeni özellikler:
- Dosya yükleme desteği (PDF, TXT, DOC, CSV, JSON, MD)
- Workflow tetiklenme göstergesi
- Hızlı aksiyon butonları
- Yükleme animasyonları

## Kullanım Örnekleri

### 1. Görev Çıkarma
```
Kullanıcı: Bu PDF'den görevleri çıkar
[Dosya: proje-plani.pdf]

Sistem: ✅ Görevler başarıyla oluşturuldu!

Oluşturulan görevler:
  • Proje planını hazırla
  • Müşteri toplantısı ayarla
  • Rapor taslağını gözden geçir
```

### 2. Takvime Etkinlik Ekleme
```
Kullanıcı: Yarın saat 14:00'da takım toplantısı ekle

Sistem: ✅ Takvim etkinliği oluşturuldu!

Oluşturulan etkinlikler:
  • Takım Toplantısı - 02.12.2025 14:00
```

### 3. Dosya Kaydetme
```
Kullanıcı: Bu dosyayı OneDrive'a kaydet
[Dosya: rapor.docx]

Sistem: ✅ Dosyalar kaydedildi!

Kaydedilen dosyalar:
  • rapor.docx
```

## Yapılandırma

### N8n Webhook ID'lerini Ayarlama

1. N8n workflow'unuzu açın
2. Webhook node'unu bulun
3. `webhookId` değerini kopyalayın
4. Environment variable olarak ayarlayın:

```bash
N8N_TODO_WEBHOOK_ID=453c17e9-4868-4e9b-a5c4-ac847b3039ef
N8N_CALENDAR_WEBHOOK_ID=your-calendar-webhook-id
N8N_DRIVE_WEBHOOK_ID=your-drive-webhook-id
```

### Workflow'lara Webhook Ekleme

N8n workflow'larınızda Webhook node'u yoksa:

1. Workflow'a "Webhook" node'u ekleyin
2. HTTP Method: POST
3. Path: benzersiz bir path (örn: `/todo-trigger`)
4. Workflow'u kaydedin ve aktif edin

## API Kullanımı

### JSON Request (dosyasız)
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "E-postalarımı önceliklendir",
    "userId": "user123",
    "provider": "ollama",
    "use_master_agent": true
  }'
```

### Multipart Request (dosyalı)
```bash
curl -X POST http://localhost:8000/api/chat/workflow \
  -F "message=Bu dosyadan görevleri çıkar" \
  -F "userId=user123" \
  -F "file=@/path/to/document.pdf"
```

### Mevcut Tool'ları Listele
```bash
curl http://localhost:8000/api/workflows/tools
```

## Yeni Workflow Tool Ekleme

1. `ai-engine/tools/n8n_workflow_tools.py` dosyasına yeni tool ekleyin:

```python
class MyNewWorkflowTool(N8nWorkflowTool):
    def __init__(self, webhook_id: Optional[str] = None, n8n_base_url: Optional[str] = None):
        super().__init__(
            name="my_new_workflow",
            description="Bu tool şunları yapar...",
            webhook_id=webhook_id or os.getenv("N8N_MY_NEW_WEBHOOK_ID", "default-id"),
            n8n_base_url=n8n_base_url
        )
```

2. `WORKFLOW_TOOLS` sözlüğüne ekleyin:

```python
WORKFLOW_TOOLS = {
    # ... mevcut tool'lar
    "my_new": MyNewWorkflowTool,
}
```

3. `INTENT_PATTERNS` sözlüğüne intent pattern ekleyin (master_agent.py):

```python
INTENT_PATTERNS = {
    # ... mevcut pattern'lar
    "my_new": {
        "keywords": ["anahtar", "kelimeler"],
        "patterns": [r"regex.*pattern"],
        "description": "Açıklama"
    }
}
```

4. `api.py`'de `_create_workflow_tools()` fonksiyonuna ekleyin.

## Hata Ayıklama

### Workflow Tetiklenmiyor

1. N8n'in çalıştığını kontrol edin: `http://localhost:5678`
2. Workflow'un aktif olduğunu kontrol edin
3. Webhook URL'inin doğru olduğunu kontrol edin
4. AI Engine loglarını kontrol edin

### Intent Algılanmıyor

1. Mesajda yeterli anahtar kelime var mı?
2. `use_llm_for_intent=True` ayarlı mı?
3. LLM yanıt veriyor mu?

### Dosya Yüklenmiyor

1. Dosya boyutu 10MB'dan küçük mü?
2. Dosya tipi destekleniyor mu?
3. API endpoint doğru mu? (`/api/chat/workflow`)

## Sonraki Adımlar

1. PDF metin çıkarma özelliği eklenebilir (PyPDF2 veya pdfplumber)
2. Daha fazla workflow tool'u eklenebilir
3. Intent detection modeli ince ayarlanabilir
4. Webhook sonuçları daha detaylı işlenebilir

