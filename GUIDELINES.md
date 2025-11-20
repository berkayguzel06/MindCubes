# MindCubes Development Guidelines

**Version:** 1.0  
**Last Updated:** November 2025

Bu doküman, MindCubes AI Agent Platform için geliştirme kurallarını, standartlarını ve en iyi uygulamaları içerir. Tüm geliştiriciler bu kurallara uymalıdır.

---

## 📋 İçindekiler

1. [Genel Prensipler](#genel-prensipler)
2. [Python Kodlama Standartları](#python-kodlama-standartları)
3. [Node.js Kodlama Standartları](#nodejs-kodlama-standartları)
4. [React Kodlama Standartları](#react-kodlama-standartları)
5. [Model Yönetimi Kuralları](#model-yönetimi-kuralları)
6. [HuggingFace Entegrasyonu](#huggingface-entegrasyonu)
7. [API Tasarım Kuralları](#api-tasarım-kuralları)
8. [Veritabanı Kuralları](#veritabanı-kuralları)
9. [Güvenlik Kuralları](#güvenlik-kuralları)
10. [Test Standartları](#test-standartları)
11. [Dokümantasyon](#dokümantasyon)
12. [Git Workflow](#git-workflow)

---

## 🎯 Genel Prensipler

### 1.1 Temel Prensipler

✅ **ZORUNLU:**
- **Clean Code:** Kod temiz, okunabilir ve anlaşılır olmalı
- **OOP Prensipleri:** Tüm kod Object-Oriented Programming kurallarına uymalı
- **Class-Based Architecture:** Her şey class yapısında organize edilmeli
- **Separation of Concerns:** Her modül/class tek bir sorumluluğa sahip olmalı
- **DRY (Don't Repeat Yourself):** Kod tekrarından kaçınılmalı
- **SOLID Prensipleri:** Tüm class'lar SOLID prensiplerine uymalı

### 1.2 Code Organization

```
✅ DOĞRU: Her dosya tek bir class/component içermeli
❌ YANLIŞ: Bir dosyada birden fazla alakasız class bulunmamalı

✅ DOĞRU: İlgili dosyalar klasörler halinde organize edilmeli
❌ YANLIŞ: Tüm dosyalar root dizinde olmamalı

✅ DOĞRU: Klasör isimleri küçük harf, snake_case veya kebab-case
❌ YANLIŞ: Klasör isimleri PascalCase olmamalı
```

### 1.3 Naming Conventions

**Python:**
- Classes: `PascalCase` (örn: `BaseAgent`, `CodeExecutor`)
- Functions/Methods: `snake_case` (örn: `execute_task`, `get_stats`)
- Constants: `UPPER_SNAKE_CASE` (örn: `MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- Private: `_leading_underscore` (örn: `_internal_method`)

**JavaScript/TypeScript:**
- Classes/Components: `PascalCase` (örn: `AgentCard`, `TaskList`)
- Functions/Variables: `camelCase` (örn: `handleSubmit`, `userId`)
- Constants: `UPPER_SNAKE_CASE` (örn: `API_URL`, `MAX_RETRIES`)

**Files:**
- Python: `snake_case.py` (örn: `base_agent.py`, `llm_provider.py`)
- JavaScript: `PascalCase.jsx` for components, `camelCase.js` for utilities
- Config: `kebab-case.yaml` (örn: `config.yaml`, `docker-compose.yml`)

---

## 🐍 Python Kodlama Standartları

### 2.1 Class Yapısı

**ZORUNLU Template:**

```python
"""
Module docstring: Bu modül ne yapar?
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import os


class MyClass(BaseClass):
    """
    Class docstring: Bu class ne yapar?
    
    Attributes:
        attr1: İlk attribute açıklaması
        attr2: İkinci attribute açıklaması
    """
    
    def __init__(
        self,
        required_param: str,
        optional_param: Optional[int] = None
    ):
        """
        Initialize the class.
        
        Args:
            required_param: Gerekli parametre açıklaması
            optional_param: Opsiyonel parametre açıklaması
        """
        super().__init__()
        self.required_param = required_param
        self.optional_param = optional_param
        self._internal_state = None
    
    @abstractmethod
    def abstract_method(self) -> Any:
        """Abstract method tanımı."""
        pass
    
    def public_method(self, param: str) -> Dict[str, Any]:
        """
        Public method - dışarıdan çağrılabilir.
        
        Args:
            param: Parametre açıklaması
            
        Returns:
            Dönüş değeri açıklaması
            
        Raises:
            ValueError: Ne zaman hata fırlatılır
        """
        if not param:
            raise ValueError("Param boş olamaz")
        
        return {"result": param}
    
    def _private_method(self) -> None:
        """Private method - sadece class içinden çağrılır."""
        pass
    
    def __repr__(self) -> str:
        """String representation."""
        return f"<{self.__class__.__name__}(param='{self.required_param}')>"
```

### 2.2 Type Hints

**ZORUNLU:**
- Her fonksiyon/method type hint içermeli
- Return type her zaman belirtilmeli
- Optional parametreler `Optional[Type]` ile işaretlenmeli

```python
# ✅ DOĞRU
def process_data(
    data: List[str],
    max_items: Optional[int] = None
) -> Dict[str, Any]:
    pass

# ❌ YANLIŞ
def process_data(data, max_items=None):
    pass
```

### 2.3 Error Handling

**ZORUNLU:**
- Her public method try-except içermeli
- Hatalar anlamlı mesajlarla fırlatılmalı
- Hata tipleri spesifik olmalı (Exception yerine ValueError, TypeError vb.)

```python
# ✅ DOĞRU
async def load_model(self, model_path: str) -> None:
    """Load model from path."""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at: {model_path}")
    
    try:
        self.model = torch.load(model_path)
    except RuntimeError as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error loading model: {str(e)}")

# ❌ YANLIŞ
def load_model(self, model_path):
    self.model = torch.load(model_path)  # No error handling!
```

### 2.4 Async/Await

**ZORUNLU:**
- I/O işlemleri async olmalı
- LLM çağrıları async olmalı
- Veritabanı işlemleri async olmalı

```python
# ✅ DOĞRU
async def generate(self, prompt: str) -> str:
    response = await self.client.chat.completions.create(...)
    return response.choices[0].message.content

# ❌ YANLIŞ
def generate(self, prompt: str) -> str:
    response = self.client.chat.completions.create(...)  # Blocking!
    return response.choices[0].message.content
```

### 2.5 Docstrings

**ZORUNLU Format (Google Style):**

```python
def complex_function(
    param1: str,
    param2: int,
    param3: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Kısa açıklama (tek satır).
    
    Detaylı açıklama buraya yazılır.
    Birden fazla satır olabilir.
    
    Args:
        param1: İlk parametre açıklaması
        param2: İkinci parametre açıklaması
        param3: Üçüncü parametre açıklaması
    
    Returns:
        Dönüş değeri açıklaması. Dictionary içeriği:
        - key1: Ne içerir
        - key2: Ne içerir
    
    Raises:
        ValueError: Ne zaman fırlatılır
        RuntimeError: Ne zaman fırlatılır
    
    Example:
        >>> result = complex_function("test", 42)
        >>> print(result)
        {'key1': 'value1'}
    """
    pass
```

---

## 📦 Model Yönetimi Kuralları

### 5.1 Model İsimlendirme

**ZORUNLU:**
- Model ID'leri benzersiz olmalı
- Versiyon numarası içermeli
- Açıklayıcı olmalı

```python
# ✅ DOĞRU
model_id = "code-assistant-v1.2-finetuned-2024-11"
model_id = "data-analyzer-lora-r16-alpha32"

# ❌ YANLIŞ
model_id = "model1"
model_id = "test"
```

### 5.2 Model Kaydetme

**ZORUNLU:**
- Her model kayıt edilmeli (ModelManager)
- Metadata eksiksiz doldurulmalı
- Training config saklanmalı

```python
# ✅ DOĞRU
manager = ModelManager()
manager.register_model(
    model_id="my-model-v1",
    model_path="./models/my-model",
    model_type="fine-tuned",
    metadata={
        "description": "Detaylı açıklama",
        "base_model": "gpt2",
        "training_date": "2024-11-16",
        "dataset": "custom-dataset-v1",
        "metrics": {
            "loss": 0.25,
            "accuracy": 0.95
        }
    }
)
```

### 5.3 Model Versiyonlama

**ZORUNLU Semantic Versioning:**
- `MAJOR.MINOR.PATCH` formatı
- MAJOR: Breaking changes
- MINOR: Yeni özellikler (backward compatible)
- PATCH: Bug fixes

---

## 🤗 HuggingFace Entegrasyonu

### 6.1 Model İndirme

**ZORUNLU:**
- Modeller HuggingFace Hub'dan otomatik indirilmeli
- Cache directory belirlenmeli
- HF_TOKEN environment variable kullanılmalı

```python
# ✅ DOĞRU
from core import LocalModelProvider

provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-chat-hf",  # HuggingFace model ID
    cache_dir="./models/cache",                   # Cache location
    hf_token=os.getenv("HF_TOKEN"),              # Token from env
    load_in_4bit=True,                           # Memory optimization
    device="auto"                                # Auto device selection
)

# Model otomatik indirilir ve cache'lenir
response = await provider.generate("Hello, how are you?")

# ❌ YANLIŞ
# Manuel download yapmak
# Yerel path kullanmak (HF olmadan)
```

### 6.2 Quantization (Bellek Optimizasyonu)

**ÖNERİLEN:**
- GPU memory < 8GB: `load_in_4bit=True`
- GPU memory 8-16GB: `load_in_8bit=True`
- GPU memory > 16GB: Normal (float16)

```python
# 4-bit quantization (En az bellek)
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-hf",
    load_in_4bit=True
)

# 8-bit quantization (Orta bellek)
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-hf",
    load_in_8bit=True
)

# Normal (En çok bellek, en iyi kalite)
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-hf"
)
```

### 6.3 Popüler HuggingFace Modelleri

**Code Generation:**
- `codellama/CodeLlama-7b-hf`
- `codellama/CodeLlama-13b-hf`
- `bigcode/starcoder`
- `Salesforce/codegen-2B-mono`

**Chat/Instruct:**
- `meta-llama/Llama-2-7b-chat-hf`
- `meta-llama/Llama-2-13b-chat-hf`
- `mistralai/Mistral-7B-Instruct-v0.2`
- `microsoft/phi-2`

**Small Models (Low Memory):**
- `microsoft/phi-2` (2.7B)
- `TinyLlama/TinyLlama-1.1B-Chat-v1.0`
- `stabilityai/stablelm-2-1_6b`

### 6.4 Model Cache Yönetimi

**ZORUNLU:**
```python
# Cache directory environment variable
export HF_HOME="/path/to/cache"

# veya kod içinde
provider = LocalModelProvider(
    model_name="...",
    cache_dir="/custom/cache/path"
)

# Model unload (memory temizleme)
provider.unload_model()
```

### 6.5 Gated Models (Özel İzin Gereken)

Bazı modeller (Llama-2, vb.) HuggingFace'te gated'dir:

```python
# 1. HuggingFace'te model sayfasından erişim talep et
# 2. Token oluştur (Settings -> Access Tokens)
# 3. Token'ı environment variable olarak kaydet

export HF_TOKEN="hf_xxxxxxxxxxxxx"

# 4. Kod içinde kullan
provider = LocalModelProvider(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    hf_token=os.getenv("HF_TOKEN")
)
```

---

## 🔌 API Tasarım Kuralları

### 7.1 RESTful API Standards

**ZORUNLU:**

```javascript
// ✅ DOĞRU - RESTful endpoints
GET    /api/v1/agents           // List all
GET    /api/v1/agents/:id       // Get one
POST   /api/v1/agents           // Create
PUT    /api/v1/agents/:id       // Update
DELETE /api/v1/agents/:id       // Delete

// ❌ YANLIŞ
GET  /api/v1/getAgents
POST /api/v1/createAgent
POST /api/v1/deleteAgent/:id
```

### 7.2 Response Format

**ZORUNLU Format:**

```javascript
// Success Response
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Optional success message"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "details": { /* optional error details */ }
}

// List Response
{
  "success": true,
  "count": 10,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 7.3 HTTP Status Codes

**ZORUNLU:**
- `200 OK`: Başarılı GET, PUT
- `201 Created`: Başarılı POST
- `204 No Content`: Başarılı DELETE
- `400 Bad Request`: Validation hatası
- `401 Unauthorized`: Authentication hatası
- `403 Forbidden`: Authorization hatası
- `404 Not Found`: Kaynak bulunamadı
- `500 Internal Server Error`: Server hatası

---

## 🗄️ Veritabanı Kuralları

### 8.1 MongoDB Schema Design

**ZORUNLU:**
- Her model Mongoose schema içermeli
- Index'ler tanımlanmalı
- Validation rules eksiksiz olmalı

```javascript
// ✅ DOĞRU
const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true  // createdAt, updatedAt otomatik
});

// Index tanımla
AgentSchema.index({ name: 1 });
AgentSchema.index({ status: 1, createdAt: -1 });
```

### 8.2 Query Optimization

**ZORUNLU:**
- Sadece gerekli field'ları select et
- Populate dikkatli kullan
- Limit ve pagination ekle

```javascript
// ✅ DOĞRU
const agents = await Agent.find({ status: 'active' })
  .select('name type description')
  .limit(20)
  .sort('-createdAt');

// ❌ YANLIŞ
const agents = await Agent.find();  // Tüm veriler!
```

---

## 🔒 Güvenlik Kuralları

### 9.1 Environment Variables

**ZORUNLU:**
- Hiçbir secret code'a yazılmamalı
- Tüm secret'lar .env dosyasında
- .env dosyası .gitignore'da

```python
# ✅ DOĞRU
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not set")

# ❌ YANLIŞ
api_key = "sk-xxxxxxxxxxxxx"  # ASLA!
```

### 9.2 Authentication

**ZORUNLU:**
- JWT token kullan
- Token expiration ayarla
- Refresh token mekanizması

### 9.3 Input Validation

**ZORUNLU:**
- Tüm user input validate edilmeli
- SQL injection koruması (Mongoose otomatik)
- XSS koruması

```javascript
// ✅ DOĞRU
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const { error, value } = schema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.message });
}
```

---

## 🧪 Test Standartları

### 10.1 Unit Tests

**ZORUNLU:**
- Her public method test edilmeli
- Coverage minimum %80
- Test isimleri açıklayıcı olmalı

```python
# ✅ DOĞRU
def test_agent_executes_task_successfully():
    """Test that agent executes a simple task."""
    agent = CodeAgent(llm_provider=mock_provider)
    task = Task(title="Test", description="Test task")
    
    result = await agent.execute_task(task)
    
    assert result["success"] is True
    assert "code" in result
```

### 10.2 Integration Tests

**ZORUNLU:**
- API endpoints test edilmeli
- Database operations test edilmeli
- Mock external services

---

## 📝 Dokümantasyon

### 11.1 Code Comments

**ZORUNLU:**
- Complex logic açıklanmalı
- TODO/FIXME işaretlenmeli
- Public API dokümante edilmeli

```python
# ✅ DOĞRU
def complex_algorithm(data: List[int]) -> int:
    """
    Calculate optimal value using dynamic programming.
    
    Time Complexity: O(n²)
    Space Complexity: O(n)
    """
    # Initialize DP table
    dp = [0] * len(data)
    
    # TODO: Optimize to O(n) using greedy approach
    for i in range(len(data)):
        # Calculate maximum value up to position i
        dp[i] = max(dp[i-1], data[i] + dp[i-2])
    
    return dp[-1]
```

### 11.2 README Files

**ZORUNLU:**
- Her major klasör README içermeli
- Kurulum talimatları eksiksiz
- Usage examples ekle

---

## 🌿 Git Workflow

### 12.1 Branch Strategy

**ZORUNLU:**
- `main`: Production branch
- `develop`: Development branch
- `feature/feature-name`: Yeni özellikler
- `bugfix/bug-name`: Bug fixes
- `hotfix/critical-fix`: Acil fixler

### 12.2 Commit Messages

**ZORUNLU Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Yeni özellik
- `fix`: Bug fix
- `docs`: Dokümantasyon
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Test ekleme
- `chore`: Maintenance

**Örnek:**
```
feat(agents): add CodeAgent with debugging support

- Implement code generation
- Add debugging capabilities
- Support multiple languages

Closes #123
```

### 12.3 Pull Request

**ZORUNLU:**
- Descriptive title
- What changed ve why
- Test edildiyse nasıl
- Screenshots (UI değişiklikleri için)

---

## ⚡ Performance Guidelines

### 13.1 Python Optimization

```python
# ✅ DOĞRU - List comprehension
squares = [x**2 for x in range(1000)]

# ❌ YANLIŞ - Loop
squares = []
for x in range(1000):
    squares.append(x**2)

# ✅ DOĞRU - Generator (memory efficient)
def generate_data():
    for i in range(1000000):
        yield process(i)

# ❌ YANLIŞ - List (memory intensive)
data = [process(i) for i in range(1000000)]
```

### 13.2 Database Optimization

```javascript
// ✅ DOĞRU - Batch operations
await Agent.insertMany(agents);

// ❌ YANLIŞ - Loop
for (const agent of agents) {
  await Agent.create(agent);
}
```

---

## 🚨 Common Pitfalls (Kaçınılması Gerekenler)

### ❌ ASLA YAPMAYIN:

1. **Hard-coded credentials**
```python
api_key = "sk-xxxxx"  # ASLA!
```

2. **Catch-all exceptions without logging**
```python
try:
    risky_operation()
except:
    pass  # ASLA!
```

3. **Mutable default arguments**
```python
def func(items=[]):  # ASLA!
    items.append(1)
    return items
```

4. **Blocking operations in async functions**
```python
async def fetch_data():
    time.sleep(5)  # ASLA! await asyncio.sleep(5) kullan
```

5. **N+1 queries**
```javascript
// ASLA!
for (const task of tasks) {
  const agent = await Agent.findById(task.agentId);
}

// DOĞRU
const tasks = await Task.find().populate('agent');
```

---

## ✅ Checklist

Kod commit etmeden önce:

- [ ] Tüm testler geçiyor mu?
- [ ] Lint hataları var mı?
- [ ] Docstring'ler eksiksiz mi?
- [ ] Type hints var mı?
- [ ] Error handling yapılmış mı?
- [ ] Sensitive data var mı?
- [ ] README güncel mi?
- [ ] Breaking change var mı?

---

## 📚 Kaynaklar

- [PEP 8 – Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [HuggingFace Transformers Documentation](https://huggingface.co/docs/transformers)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)

---

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Team Chat
- Documentation

**Son Güncelleme:** 2025-11-16  
**Versiyon:** 1.0.0

