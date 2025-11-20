# HuggingFace Model Kullanım Rehberi

Bu rehber, MindCubes AI Engine'de HuggingFace modellerinin nasıl kullanılacağını açıklar.

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Model Seçimi](#model-seçimi)
3. [Quantization (Bellek Optimizasyonu)](#quantization-bellek-optimizasyonu)
4. [Gated Models](#gated-models-özel-erişim)
5. [Önerilen Modeller](#önerilen-modeller)
6. [Performans İpuçları](#performans-i̇puçları)
7. [Sorun Giderme](#sorun-giderme)

---

## 🚀 Hızlı Başlangıç

### Temel Kullanım

```python
from core import LocalModelProvider

# Model oluştur (otomatik indirilir)
provider = LocalModelProvider(
    model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    device="auto",
    cache_dir="./models/cache"
)

# Metin üret
response = await provider.generate(
    prompt="Python'da liste nasıl oluşturulur?",
    system_prompt="Sen yardımcı bir asistansın."
)

print(response)
```

### Agent ile Kullanım

```python
from core import LocalModelProvider
from agents import CodeAgent

# LLM provider oluştur
llm = LocalModelProvider(
    model_name="codellama/CodeLlama-7b-Instruct-hf",
    load_in_4bit=True  # Bellek tasarrufu
)

# Agent oluştur
agent = CodeAgent(llm_provider=llm)

# Kullan
response = await agent.process("Fibonacci fonksiyonu yaz")
```

---

## 🎯 Model Seçimi

### GPU Belleğine Göre Model Seçimi

| GPU Bellek | Önerilen Model Boyutu | Quantization |
|------------|----------------------|--------------|
| < 4GB      | 1-2B parametreli     | 4-bit        |
| 4-8GB      | 2-7B parametreli     | 4-bit        |
| 8-16GB     | 7-13B parametreli    | 8-bit        |
| > 16GB     | 13B+ parametreli     | Opsiyonel    |

### Model Boyutları

```python
# Küçük Modeller (< 2GB)
"TinyLlama/TinyLlama-1.1B-Chat-v1.0"      # 1.1B - ~1GB
"stabilityai/stablelm-2-1_6b"             # 1.6B - ~1.5GB

# Orta Modeller (2-4GB)
"microsoft/phi-2"                          # 2.7B - ~2.5GB
"Salesforce/codegen-2B-mono"              # 2B - ~2GB

# Büyük Modeller (> 4GB)
"codellama/CodeLlama-7b-Instruct-hf"      # 7B - ~13GB
"meta-llama/Llama-2-7b-chat-hf"           # 7B - ~13GB
"mistralai/Mistral-7B-Instruct-v0.2"      # 7B - ~13GB
```

---

## 💾 Quantization (Bellek Optimizasyonu)

### 4-bit Quantization (En Düşük Bellek)

**Avantajlar:**
- 75% daha az bellek kullanımı
- 7B model ~3-4GB GPU memory
- Hız kaybı minimal

**Dezavantajlar:**
- Hafif kalite kaybı (~2-3%)
- bitsandbytes kütüphanesi gerekli

```python
provider = LocalModelProvider(
    model_name="codellama/CodeLlama-7b-Instruct-hf",
    load_in_4bit=True,  # 4-bit quantization
    device="auto"
)
```

### 8-bit Quantization (Orta Yol)

**Avantajlar:**
- 50% daha az bellek kullanımı
- Minimal kalite kaybı (~1%)
- İyi hız

**Dezavantajlar:**
- 4-bit'ten daha fazla bellek

```python
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    load_in_8bit=True,  # 8-bit quantization
    device="auto"
)
```

### Normal (Float16)

**Avantajlar:**
- En iyi kalite
- Daha hızlı inference

**Dezavantajlar:**
- En fazla bellek kullanımı

```python
provider = LocalModelProvider(
    model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    device="auto"  # Normal float16
)
```

---

## 🔐 Gated Models (Özel Erişim)

Bazı modeller (Llama-2, Llama-3, vb.) HuggingFace'te "gated" durumdadır. Bu modellere erişim için:

### Adım 1: Model Erişimi Talep Et

1. Model sayfasına git (örn: `meta-llama/Llama-2-7b-chat-hf`)
2. "Request Access" butonuna tıkla
3. Formu doldur ve gönder
4. Onay bekle (genellikle birkaç dakika)

### Adım 2: HuggingFace Token Oluştur

1. https://huggingface.co/settings/tokens adresine git
2. "New token" oluştur
3. Token'ı kopyala

### Adım 3: Token'ı Ayarla

**Linux/macOS:**
```bash
export HF_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxx"
```

**Windows (PowerShell):**
```powershell
$env:HF_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxx"
```

**Veya .env dosyasına ekle:**
```bash
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx
```

### Adım 4: Kullan

```python
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    hf_token=os.getenv("HF_TOKEN"),  # Token otomatik okunur
    load_in_4bit=True
)
```

---

## 🌟 Önerilen Modeller

### Kod Üretimi İçin

#### 1. **CodeLlama-7b-Instruct** (ÖNERİLİR)
```python
model_name="codellama/CodeLlama-7b-Instruct-hf"
```
- **Boyut:** 7B parametreli (~13GB, 4-bit ile ~4GB)
- **Güçlü:** Python, JavaScript, Java, C++
- **Özellik:** Kod tamamlama, debugging, açıklama

#### 2. **StarCoder**
```python
model_name="bigcode/starcoder"
```
- **Boyut:** 15B parametreli
- **Güçlü:** 80+ programlama dili
- **Özellik:** Geniş dil desteği

#### 3. **CodeGen-2B** (Küçük GPU için)
```python
model_name="Salesforce/codegen-2B-mono"
```
- **Boyut:** 2B parametreli (~2GB)
- **Güçlü:** Python
- **Avantaj:** Düşük bellek gereksinimi

### Genel Chat İçin

#### 1. **Phi-2** (ÖNERİLİR - Küçük GPU)
```python
model_name="microsoft/phi-2"
```
- **Boyut:** 2.7B parametreli (~2.5GB)
- **Avantaj:** Küçük ama güçlü
- **Güçlü:** Reasoning, kod, matematik

#### 2. **TinyLlama** (En Küçük)
```python
model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0"
```
- **Boyut:** 1.1B parametreli (~1GB)
- **Avantaj:** Çok hızlı, çok az bellek
- **Kullanım:** Basit tasklar

#### 3. **Mistral-7B-Instruct** (Büyük GPU)
```python
model_name="mistralai/Mistral-7B-Instruct-v0.2"
```
- **Boyut:** 7B parametreli
- **Avantaj:** Yüksek performans
- **Güçlü:** Reasoning, uzun context

### Veri Analizi İçin

#### 1. **Llama-2-7b-chat** (Gated)
```python
model_name="meta-llama/Llama-2-7b-chat-hf"
```
- **Özellik:** İyi reasoning
- **Gerekli:** HuggingFace token

---

## ⚡ Performans İpuçları

### 1. Model Cache Kullan

```python
# Her zaman aynı cache dizinini kullan
provider = LocalModelProvider(
    model_name="...",
    cache_dir="./models/cache"  # Sabit dizin
)
```

### 2. Batch Processing

```python
# Birden fazla prompt için
prompts = ["prompt1", "prompt2", "prompt3"]

for prompt in prompts:
    response = await provider.generate(prompt)
    print(response)
```

### 3. Model Unload

```python
# Başka model yükleyeceksen önce unload et
provider1.unload_model()

provider2 = LocalModelProvider(...)
```

### 4. GPU Memory Temizliği

```python
import torch
import gc

# Modeli unload et
provider.unload_model()

# Memory temizle
gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()
```

### 5. Optimal Generation Parameters

```python
response = await provider.generate(
    prompt="...",
    temperature=0.7,        # Yaratıcılık (0.0-2.0)
    max_tokens=256,         # Maksimum uzunluk
    top_p=0.95,            # Nucleus sampling
    top_k=50,              # Top-K sampling
    repetition_penalty=1.1  # Tekrar cezası
)
```

---

## 🔧 Sorun Giderme

### 1. CUDA Out of Memory

**Hata:**
```
RuntimeError: CUDA out of memory
```

**Çözüm:**
```python
# 1. 4-bit quantization kullan
provider = LocalModelProvider(
    model_name="...",
    load_in_4bit=True  # En önemli!
)

# 2. Daha küçük model seç
# 7B yerine 2-3B model kullan

# 3. Max tokens azalt
response = await provider.generate(
    prompt="...",
    max_tokens=128  # 256 yerine
)
```

### 2. Model İndirme Yavaş

**Çözüm:**
```python
# 1. HF_HUB_ENABLE_HF_TRANSFER kullan
export HF_HUB_ENABLE_HF_TRANSFER=1

# 2. Proxy kullan (gerekirse)
export HF_ENDPOINT="https://hf-mirror.com"

# 3. Resume download
# İndirme otomatik devam eder
```

### 3. Gated Model Erişim Hatası

**Hata:**
```
Repository is gated
```

**Çözüm:**
```python
# 1. Model sayfasından erişim iste
# 2. HF_TOKEN ayarla
export HF_TOKEN="hf_xxxxx"

# 3. Token'ı kod içinde kullan
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    hf_token=os.getenv("HF_TOKEN")
)
```

### 4. bitsandbytes Hatası

**Hata:**
```
ImportError: bitsandbytes not found
```

**Çözüm:**
```bash
# CUDA varsa
pip install bitsandbytes

# CPU'da (quantization yok)
# load_in_4bit/8bit kullanma
```

### 5. Yavaş Inference

**Çözüm:**
```python
# 1. GPU kullan
provider = LocalModelProvider(
    model_name="...",
    device="cuda"  # CPU yerine
)

# 2. Küçük model seç
# 7B yerine 1-3B

# 3. Max tokens azalt
max_tokens=128  # 512 yerine

# 4. Batch size artır (training için)
```

---

## 📊 Model Karşılaştırma

| Model | Parametreler | GPU Memory | Hız | Kalite | Kullanım |
|-------|-------------|-----------|-----|--------|----------|
| TinyLlama-1.1B | 1.1B | ~1GB | ⚡⚡⚡ | ⭐⭐ | Basit chat |
| Phi-2 | 2.7B | ~2.5GB | ⚡⚡⚡ | ⭐⭐⭐⭐ | Genel amaçlı |
| CodeLlama-7B | 7B | ~4GB (4-bit) | ⚡⚡ | ⭐⭐⭐⭐⭐ | Kod üretimi |
| Mistral-7B | 7B | ~4GB (4-bit) | ⚡⚡ | ⭐⭐⭐⭐⭐ | Reasoning |
| Llama-2-7B | 7B | ~4GB (4-bit) | ⚡⚡ | ⭐⭐⭐⭐ | Chat |

---

## 🔗 Kaynaklar

- [HuggingFace Hub](https://huggingface.co/models)
- [Transformers Documentation](https://huggingface.co/docs/transformers)
- [Model Cards](https://huggingface.co/docs/hub/model-cards)
- [bitsandbytes](https://github.com/TimDettmers/bitsandbytes)

---

## 💡 Örnek Kullanımlar

Detaylı örnekler için:
```bash
python examples/huggingface_examples.py
```

Her örnek:
- ✅ Model indirme
- ✅ Quantization
- ✅ Agent entegrasyonu
- ✅ Performans karşılaştırma

---

**Son Güncelleme:** 2025-11-16  
**Versiyon:** 1.0.0

