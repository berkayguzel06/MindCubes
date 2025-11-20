# Changelog - MindCubes

Tüm önemli değişiklikler bu dosyada dokümante edilir.

## [1.1.0] - 2025-11-16

### ✨ Yeni Özellikler

#### HuggingFace Entegrasyonu
- **Otomatik Model İndirme:** Modeller HuggingFace Hub'dan otomatik indirilir ve cache'lenir
- **Quantization Desteği:** 4-bit ve 8-bit quantization ile bellek optimizasyonu
- **Gated Model Desteği:** Llama-2, Llama-3 gibi gated modellere HF_TOKEN ile erişim
- **Model Info API:** Model boyutu, parametre sayısı gibi bilgilere erişim
- **Memory Management:** Model unload ve GPU memory temizleme fonksiyonları

#### LocalModelProvider Güncellemeleri
```python
LocalModelProvider(
    model_name="...",           # HuggingFace model ID
    cache_dir="...",            # Cache directory
    hf_token="...",             # HuggingFace token
    load_in_4bit=True,          # 4-bit quantization
    load_in_8bit=False,         # 8-bit quantization
    trust_remote_code=False     # Custom code support
)
```

#### Yeni Metodlar
- `get_model_size()` - Model boyut bilgisi
- `unload_model()` - Model'i memory'den kaldır
- `_get_model_info()` - HuggingFace model bilgileri

### 📚 Dokümantasyon

#### Yeni Dokümanlar
1. **GUIDELINES.md** - Kapsamlı geliştirme kuralları
   - Python, Node.js, React standartları
   - OOP prensipleri
   - Güvenlik kuralları
   - Test standartları
   - Git workflow
   - Common pitfalls

2. **HUGGINGFACE_GUIDE.md** - HuggingFace kullanım rehberi
   - Model seçimi
   - Quantization rehberi
   - Gated model erişimi
   - Önerilen modeller
   - Performans ipuçları
   - Sorun giderme

3. **examples/huggingface_examples.py** - 7 Detaylı Örnek
   - Basic usage
   - 4-bit quantization
   - Code generation
   - Agent integration
   - Gated models
   - Model comparison
   - Custom parameters

### 🔧 Configuration

#### config.yaml Güncellemeleri
```yaml
models:
  local:
    cache_dir: "./models/cache"
    device: "auto"
    load_in_4bit: false
    load_in_8bit: false
    trust_remote_code: false
  
  huggingface:
    recommended_models:
      code_generation: [...]
      chat: [...]
      small_models: [...]
```

### 📦 Dependencies

#### Yeni Paketler
```txt
huggingface-hub>=0.19.0
sentencepiece>=0.1.99
protobuf>=3.20.0
```

### 🎯 Önerilen Modeller

#### Kod Üretimi
- `codellama/CodeLlama-7b-Instruct-hf` - 7B, en iyi kod modeli
- `bigcode/starcoder` - 15B, çok dilli
- `Salesforce/codegen-2B-mono` - 2B, küçük GPU için

#### Chat
- `microsoft/phi-2` - 2.7B, küçük ama güçlü
- `TinyLlama/TinyLlama-1.1B-Chat-v1.0` - 1.1B, en hızlı
- `mistralai/Mistral-7B-Instruct-v0.2` - 7B, yüksek kalite

### 💡 Kullanım Örnekleri

#### Temel Kullanım
```python
from core import LocalModelProvider

provider = LocalModelProvider(
    model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    load_in_4bit=True
)

response = await provider.generate("Python nedir?")
```

#### Agent ile
```python
from agents import CodeAgent

llm = LocalModelProvider(
    model_name="codellama/CodeLlama-7b-Instruct-hf",
    load_in_4bit=True
)

agent = CodeAgent(llm_provider=llm)
response = await agent.process("Fibonacci fonksiyonu yaz")
```

### 🔒 Güvenlik

- Environment variables for tokens
- .gitignore güncellendi
- Sensitive data kontrolleri

### 📝 README Güncellemeleri

- HuggingFace quick start eklendi
- Model indirme bilgisi eklendi
- Cache yönetimi açıklandı

---

## [1.0.0] - 2025-11-15

### 🎉 İlk Sürüm

#### Python AI Engine
- Base classes (Agent, Tool, LLM, Memory, Task, Orchestrator)
- 4 Specialized agents (Code, Data, Research, TaskPlanner)
- 5 Tools (WebSearch, CodeExecutor, FileManager, APICaller, DataProcessor)
- OpenAI & Anthropic provider support
- Model training infrastructure
- LoRA adapter support

#### Node.js Backend
- RESTful API
- MongoDB integration
- JWT authentication
- CRUD operations for Agents, Tasks, Models
- User management

#### React Frontend
- Dashboard
- Agent management
- Task monitoring
- Model registry
- Modern UI with Tailwind

#### Documentation
- README.md
- SETUP.md
- ARCHITECTURE.md
- ai-engine/README.md

---

## Planlanan Özellikler

### [1.2.0] - Gelecek
- [ ] WebSocket support for real-time updates
- [ ] Advanced streaming for local models
- [ ] Multi-modal support (vision models)
- [ ] Fine-tuning UI
- [ ] Model marketplace

### [1.3.0] - Gelecek
- [ ] Distributed training
- [ ] Model versioning
- [ ] A/B testing for models
- [ ] Performance benchmarking

---

## Nasıl Katkıda Bulunulur

1. GUIDELINES.md'yi okuyun
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request açın

---

**Semantic Versioning:** MAJOR.MINOR.PATCH
- **MAJOR:** Breaking changes
- **MINOR:** Yeni özellikler (backward compatible)
- **PATCH:** Bug fixes

