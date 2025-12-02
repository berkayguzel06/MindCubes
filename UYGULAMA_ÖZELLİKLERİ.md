# MindCubes - Uygulama Özellikleri ve Kapasitesi

**Versiyon:** 1.1.0  
**Son Güncelleme:** Kasım 2025

> Bu dokümantasyon, frontend, backend ve AI engine kodlarına bakarak uygulamanın gerçekten ne yapabildiğini ve kapasitesini açıklar.

---

## 🚀 Uygulamanın Gerçek Özellikleri

### 💬 AI Chat Sistemi

**Ne Yapabilir:**
- Doğal dil ile AI ile konuşma (Türkçe ve İngilizce)
- PDF, Word, Excel, CSV, JSON, TXT dosyalarını yükleme ve analiz etme
- Dosyalardan görev çıkarma ve otomatik işleme
- Chat geçmişini saklama ve yönetme
- Çoklu chat oturumu desteği
- AI'ın düşünce sürecini görüntüleme
- Farklı AI modelleri arasında seçim yapma (Ollama modelleri)

**Kapasitesi:**
- Sınırsız chat oturumu oluşturma
- Her oturumda 50+ mesaj saklama
- 10MB'a kadar dosya yükleme
- Gerçek zamanlı yanıt alma
- Bağlam farkındalığı (konuşma geçmişini hatırlama)

### 🤖 Otomatik Workflow Yönetimi

**Ne Yapabilir:**
- N8N workflow'larını görüntüleme ve yönetme
- Workflow'ları tek tıkla çalıştırma
- Dosya ile workflow tetikleme
- Mesaj ile workflow tetikleme
- Workflow prompt'larını kaydetme ve düzenleme
- Workflow'ları aktif/pasif yapma
- Tag bazlı filtreleme

**Kapasitesi:**
- Sınırsız workflow yönetimi
- Otomatik workflow yedekleme
- Versiyon kontrolü (3 versiyon saklama)
- PostgreSQL veritabanında senkronizasyon
- Webhook ile otomatik tetikleme

### 📋 Görev ve İş Akışı Otomasyonu

**Ne Yapabilir:**
- E-postalardan görev çıkarma (Microsoft To-Do entegrasyonu)
- Belge ve dosyalardan görev oluşturma
- Takvim etkinlikleri oluşturma (Microsoft Calendar)
- Dosyaları buluta kaydetme (OneDrive)
- E-postaları kategorilendirme
- E-postaları önceliklendirme

**Kapasitesi:**
- Otomatik görev çıkarma
- Toplantı ve randevu yönetimi
- Dosya organizasyonu
- E-posta otomasyonu
- Microsoft 365 tam entegrasyonu

### 🧠 AI Model Yönetimi

**Ne Yapabilir:**
- Ollama modellerini görüntüleme
- Model detaylarını inceleme (boyut, parametre sayısı)
- Model ailesine göre filtreleme
- Model durumunu görüntüleme

**Kapasitesi:**
- Yerel model desteği
- Çoklu model yönetimi
- Model performans takibi
- Quantization bilgisi görüntüleme

### 👤 Kullanıcı Yönetimi

**Ne Yapabilir:**
- Kullanıcı kaydı ve girişi
- JWT token tabanlı kimlik doğrulama
- API anahtarı oluşturma
- Microsoft hesap bağlantısı
- Kullanıcı profil yönetimi

**Kapasitesi:**
- Güvenli şifre saklama
- Oturum yönetimi
- API erişim kontrolü
- Çoklu kimlik doğrulama desteği

### 💾 Veri Yönetimi

**Ne Yapabilir:**
- Chat geçmişini PostgreSQL'de saklama
- Workflow metadata'sını veritabanında tutma
- Kullanıcı prompt'larını kaydetme
- Oturum bilgilerini yönetme

**Kapasitesi:**
- Sınırsız chat geçmişi
- Hızlı veri sorgulama
- Otomatik veri senkronizasyonu
- Versiyon kontrolü

---

## 🎨 Tasarım ve Kullanıcı Deneyimi

### Modern Arayüz
- **Glassmorphism efekti:** Cam görünümlü şeffaf paneller ve blur efektleri
- **Gradient arka planlar:** Dinamik, hareketli gradient arka planlar
- **Animasyonlu geçişler:** Tüm etkileşimlerde yumuşak animasyonlar
- **Responsive tasarım:** Mobil, tablet ve desktop'ta mükemmel görünüm
- **Göz dostu renkler:** Yumuşak tonlar, göz yormayan palet

### Kullanıcı Deneyimi
- **Sezgisel navigasyon:** Tek tıkla sayfa geçişleri
- **Gerçek zamanlı güncellemeler:** Anlık durum değişiklikleri
- **Akıllı bildirimler:** Başarı, hata ve uyarı mesajları
- **Otomatik kaydırma:** Chat'te yeni mesajlara otomatik scroll
- **Yükleme göstergeleri:** Tüm işlemlerde görsel geri bildirim

---

## 💬 Chat Sayfası - Gerçek Özellikler

### Temel Özellikler
- **Doğal dil sohbeti:** AI ile doğal konuşma
- **Dosya yükleme:** PDF, Word, Excel, CSV, JSON, TXT desteği
- **Sürükle-bırak:** Dosyaları sürükleyip bırakarak yükleme
- **Model seçimi:** Ollama modelleri arasından seçim
- **Oturum yönetimi:** Çoklu chat oturumu desteği

### Gelişmiş Özellikler
- **Düşünce süreci gösterimi:** AI'ın düşünme adımlarını görüntüleme
- **Markdown desteği:** Kalın, italik, liste formatlaması
- **Chat geçmişi:** Tüm konuşmaları kaydetme ve görüntüleme
- **Oturum silme:** İstenmeyen chat'leri silme
- **Yeni chat başlatma:** Tek tıkla yeni konuşma başlatma

### Teknik Özellikler
- **Otomatik textarea genişleme:** Uzun mesajlarda otomatik büyüme
- **Enter ile gönderme:** Shift+Enter ile satır atlama
- **Dosya boyutu kontrolü:** 10MB limit kontrolü
- **Hata yönetimi:** Bağlantı hatalarında kullanıcı dostu mesajlar
- **Session storage:** Tarayıcı kapanınca bile oturum korunur

---

## 🤖 Agents Sayfası - Gerçek Özellikler

### Workflow Yönetimi
- **N8N entegrasyonu:** Tüm N8N workflow'larını görüntüleme
- **Workflow çalıştırma:** Tek tıkla workflow tetikleme
- **Durum göstergeleri:** Aktif/pasif durum rozetleri
- **Tag filtreleme:** Etiket bazlı filtreleme
- **Yenileme butonu:** Workflow listesini manuel yenileme

### Workflow İşlemleri
- **Prompt düzenleme:** Kullanıcı bazlı prompt kaydetme
- **Dosya ile çalıştırma:** Workflow'u dosya ile tetikleme
- **Chat input:** Mesaj ile workflow tetikleme
- **Webhook path:** Özel webhook path belirleme
- **User ID yönetimi:** Kullanıcı bazlı işlemler

### Yedekleme ve Yönetim
- **Workflow yedekleme:** Tüm workflow'ları veritabanına kaydetme
- **Hata yönetimi:** Bağlantı hatalarında bilgilendirme
- **Boş durum:** Workflow yoksa kullanıcı dostu mesaj
- **Yükleme durumları:** Tüm işlemlerde loading göstergeleri

---

## 🧠 Models Sayfası - Gerçek Özellikler

### Model Görüntüleme
- **Ollama entegrasyonu:** Yerel Ollama modellerini listeleme
- **Model detayları:** Boyut, parametre sayısı, aile bilgisi
- **Renk kodlu kartlar:** Model ailesine göre renkli gösterim
- **Durum rozetleri:** Model durumunu görsel gösterme
- **Boyut formatı:** Okunabilir dosya boyutu gösterimi

### Model Bilgileri
- **Model ailesi:** Llama, Mistral, Phi, Gemma vb.
- **Parametre sayısı:** Model büyüklüğü bilgisi
- **Quantization seviyesi:** Sıkıştırma seviyesi
- **Son güncelleme:** Model değiştirilme tarihi
- **Format bilgisi:** Model formatı

---

## 🏠 Ana Sayfa Özellikleri

### Landing Page
- **Hero bölümü:** Etkileyici başlık ve açıklama
- **Animasyonlu arka plan:** Fare hareketine göre değişen gradient
- **Logo gösterimi:** Büyük, görsel logo
- **CTA butonları:** Hemen başla butonları
- **Marka gösterimi:** Powered by bilgisi

### Navigasyon
- **Üst menü:** Login ve kayıt linkleri
- **Otomatik yönlendirme:** Giriş yapmış kullanıcıları agents sayfasına yönlendirme
- **Responsive:** Tüm ekran boyutlarında çalışır

---

## 🔐 Kimlik Doğrulama Sayfaları

### Login Sayfası
- **E-posta/şifre girişi:** Standart kimlik doğrulama
- **Beni hatırla:** Oturum bilgilerini saklama
- **Şifremi unuttum:** Şifre sıfırlama linki
- **Hata mesajları:** Kullanıcı dostu hata gösterimi
- **Yükleme durumu:** Giriş işlemi sırasında loading

### Register Sayfası
- **Kapsamlı form:** Ad, soyad, e-posta, şifre
- **Form validasyonu:** Boş alan kontrolü
- **Hata yönetimi:** Sunucu hatalarında bilgilendirme
- **Otomatik giriş:** Kayıt sonrası otomatik giriş
- **Geri dönüş linki:** Login sayfasına dönüş

---

## 🎯 Sidebar (Yan Menü) Özellikleri

### Navigasyon
- **Ana menü:** Agents, Models, Chat linkleri
- **Aktif sayfa göstergesi:** Hangi sayfada olduğunuzu gösterir
- **Renkli noktalar:** Her sayfa için farklı renk
- **Hover efektleri:** Menü öğelerinde hover animasyonları

### Kullanıcı Bilgileri
- **Kullanıcı kartı:** Ad, soyad, e-posta gösterimi
- **Çıkış butonu:** Güvenli oturum kapatma
- **Microsoft entegrasyonu:** Microsoft hesap bağlantısı
- **Credentials panel:** API anahtarları yönetimi

---

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary:** Mor tonları (purple-500)
- **Secondary:** Mavi tonları (blue-500)
- **Success:** Yeşil tonları (green-500)
- **Error:** Kırmızı tonları (red-500)
- **Background:** Koyu mavi tonları (slate-900)

### Tipografi
- **Başlıklar:** Bold, büyük fontlar
- **Alt başlıklar:** Orta boyut, medium weight
- **Gövde metni:** Küçük, normal weight
- **Etiketler:** Çok küçük, uppercase

### Bileşenler
- **Glass panel:** Şeffaf, blur efektli kartlar
- **Gradient butonlar:** Gradient arka planlı butonlar
- **Durum rozetleri:** Renk kodlu durum göstergeleri
- **Input alanları:** Şeffaf, border'lı input'lar

---

## ⚡ Performans Özellikleri

### Optimizasyonlar
- **Next.js 16:** En son framework versiyonu
- **React 19:** En yeni React özellikleri
- **Tailwind CSS 4:** Hızlı stil yönetimi
- **Lazy loading:** Gerektiğinde yükleme
- **Code splitting:** Otomatik kod bölme

### Hız
- **Hızlı yükleme:** Optimize edilmiş asset'ler
- **Smooth animasyonlar:** 60fps animasyonlar
- **Hızlı geçişler:** Anında sayfa geçişleri
- **Efficient re-renders:** Gereksiz render'ları önleme

---

## 🔄 Entegrasyonlar

### Backend Entegrasyonu
- **RESTful API:** Tüm backend işlemleri API üzerinden
- **JWT Authentication:** Güvenli token tabanlı kimlik doğrulama
- **Error handling:** API hatalarında kullanıcı dostu mesajlar
- **Loading states:** Tüm API çağrılarında loading göstergeleri

### AI Engine Entegrasyonu
- **Direct connection:** Chat için doğrudan AI Engine bağlantısı
- **File upload:** Dosya yükleme için özel endpoint
- **Model selection:** Ollama model seçimi
- **Streaming support:** Gelecekte streaming desteği

### N8N Entegrasyonu
- **Workflow listesi:** N8N workflow'larını görüntüleme
- **Workflow execution:** Workflow'ları tetikleme
- **Status management:** Workflow durumlarını yönetme
- **Tag filtering:** Etiket bazlı filtreleme

---

## 🔧 Backend API Özellikleri

### Chat API
- **POST /api/v1/chat:** Mesaj gönderme ve AI yanıtı alma
- **GET /api/v1/chat/history:** Chat geçmişini getirme
- **GET /api/v1/chat/sessions:** Tüm oturumları listeleme
- **DELETE /api/v1/chat/history:** Chat geçmişini silme
- **POST /api/v1/chat/session:** Yeni oturum oluşturma

### N8N Workflow API
- **GET /api/v1/n8n/workflows:** Tüm workflow'ları listeleme
- **POST /api/v1/n8n/workflows/backup:** Workflow'ları yedekleme
- **POST /api/v1/n8n/workflows/:id/execute:** Workflow çalıştırma
- **POST /api/v1/n8n/workflows/:id/activate:** Workflow aktifleştirme
- **POST /api/v1/n8n/workflows/:id/deactivate:** Workflow pasifleştirme
- **GET /api/v1/n8n/workflows/:id/prompt:** Prompt getirme
- **POST /api/v1/n8n/workflows/:id/prompt:** Prompt kaydetme

### Model API
- **GET /api/v1/models:** Tüm modelleri listeleme
- **GET /api/v1/models/ollama:** Ollama modellerini getirme
- **POST /api/v1/models:** Yeni model kaydetme
- **GET /api/v1/models/:id/stats:** Model istatistikleri

### Auth API
- **POST /api/v1/auth/register:** Kullanıcı kaydı
- **POST /api/v1/auth/login:** Kullanıcı girişi
- **GET /api/v1/auth/me:** Kullanıcı bilgileri
- **POST /api/v1/auth/api-key:** API anahtarı oluşturma

## 🧠 AI Engine Özellikleri

### Master Agent Yetenekleri
- **Intent Detection:** Kullanıcı niyetini otomatik algılama
- **Workflow Tetikleme:** Uygun workflow'u otomatik çalıştırma
- **Dosya İşleme:** Yüklenen dosyaları analiz etme
- **Bağlam Anlama:** Konuşma geçmişini kullanma
- **Çoklu Dil Desteği:** Türkçe ve İngilizce anlama

### Desteklenen Workflow'lar
- **Todo Workflow:** Görev çıkarma ve oluşturma
- **Calendar Workflow:** Takvim etkinliği oluşturma
- **Drive Workflow:** Dosya buluta kaydetme
- **Mail Categorization:** E-posta kategorilendirme
- **Mail Prioritizing:** E-posta önceliklendirme

### AI Araçları (Tools)
- **Web Search:** İnternet arama (hazır altyapı)
- **Code Executor:** Kod çalıştırma (Python desteği)
- **File Manager:** Dosya yönetimi (okuma, yazma, listeleme)
- **API Caller:** HTTP istekleri gönderme
- **Data Processor:** Veri işleme ve dönüşüm

### Özelleştirilmiş Ajanlar
- **CodeAgent:** Kod üretimi, hata ayıklama, refactoring
- **DataAnalysisAgent:** Veri analizi ve görselleştirme
- **ResearchAgent:** Araştırma ve bilgi toplama
- **TaskPlannerAgent:** Görev planlama ve yönetimi

## 🚀 Potansiyel ve Gelecek Özellikler

### Kısa Vadeli Potansiyel
- **Gerçek zamanlı chat:** WebSocket ile anlık mesajlaşma
- **Sesli asistan:** Mikrofon ile sesli komutlar
- **Görüntü analizi:** Resim yükleme ve analiz
- **Dark/Light mode:** Tema değiştirme seçeneği
- **Dil seçimi:** Çoklu dil desteği

### Orta Vadeli Potansiyel
- **Mobil uygulama:** iOS ve Android uygulamaları
- **Offline mod:** İnternet olmadan çalışma
- **Gelişmiş filtreleme:** Çoklu filtre seçenekleri
- **Arama özelliği:** Chat geçmişinde arama
- **Export özelliği:** Chat'leri dışa aktarma

### Uzun Vadeli Potansiyel
- **Çoklu kullanıcı:** Takım çalışması desteği
- **Plugin sistemi:** Üçüncü taraf eklentiler
- **Özelleştirilebilir tema:** Kullanıcı bazlı tema
- **AI model eğitimi UI:** Model eğitimi arayüzü
- **Analitik dashboard:** Detaylı kullanım istatistikleri

---

## 💡 Gerçek Kullanım Senaryoları

### Senaryo 1: E-posta Yönetimi
**Kullanıcı:** "E-postalarımı önceliklendir"
**Sistem:** Master Agent mesajı analiz eder, mail_prioritizing_workflow'u tetikler, e-postalar öncelik sırasına göre düzenlenir.

### Senaryo 2: Görev Çıkarma
**Kullanıcı:** [PDF dosyası yükler] "Bu dosyadan görevleri çıkar"
**Sistem:** Dosya analiz edilir, todo_workflow tetiklenir, görevler Microsoft To-Do'ya eklenir.

### Senaryo 3: Takvim Yönetimi
**Kullanıcı:** "Yarın saat 14:00'da takım toplantısı ekle"
**Sistem:** Tarih ve saat bilgisi çıkarılır, calendar_workflow tetiklenir, etkinlik oluşturulur.

### Senaryo 4: Dosya Kaydetme
**Kullanıcı:** [Dosya yükler] "Bu dosyayı OneDrive'a kaydet"
**Sistem:** drive_workflow tetiklenir, dosya OneDrive'a yüklenir.

### Senaryo 5: Kod Geliştirme
**Kullanıcı:** "Python'da fibonacci fonksiyonu yaz"
**Sistem:** CodeAgent devreye girer, kod üretilir ve test edilir.

### Senaryo 6: Veri Analizi
**Kullanıcı:** [CSV dosyası yükler] "Bu veriyi analiz et"
**Sistem:** DataAnalysisAgent devreye girer, veri analiz edilir ve rapor oluşturulur.

### Bireysel Kullanıcılar
- **Günlük görev yönetimi:** Chat ile görev oluşturma
- **Dosya analizi:** PDF'lerden bilgi çıkarma
- **Hızlı araştırma:** AI ile konu araştırma
- **Kod yardımı:** Programlama sorularına yanıt

### İş Kullanıcıları
- **E-posta yönetimi:** Otomatik e-posta işleme
- **Takvim entegrasyonu:** Otomatik toplantı oluşturma
- **Rapor hazırlama:** Veri analizi ve raporlama
- **Workflow otomasyonu:** N8N ile iş akışı yönetimi

### Geliştiriciler
- **API entegrasyonu:** Backend API kullanımı
- **Model yönetimi:** AI model seçimi ve yönetimi
- **Workflow geliştirme:** N8N workflow oluşturma
- **Özelleştirme:** Prompt düzenleme ve kaydetme

---

## 📊 Teknik Kapasiteler

### Performans
- **Chat yanıt süresi:** 2-5 saniye (model bağımlı)
- **Dosya işleme:** 10MB'a kadar destek
- **Eşzamanlı kullanıcı:** Sınırsız (ölçeklenebilir)
- **Veritabanı:** PostgreSQL ile güvenli saklama
- **API yanıt süresi:** < 500ms (ortalama)

### Sınırlar
- **Dosya boyutu:** 10MB maksimum
- **Chat geçmişi:** Oturum başına 50 mesaj (ayarlanabilir)
- **Workflow timeout:** 120 saniye
- **Model seçimi:** Ollama modelleri (yerel)

### Entegrasyonlar
- **Microsoft 365:** To-Do, Calendar, OneDrive, Outlook
- **N8N:** Tam workflow yönetimi
- **PostgreSQL:** Veri saklama
- **Ollama:** Yerel AI modelleri

### Kullanıcı Deneyimi Metrikleri
- **Sayfa yükleme süresi:** < 2 saniye
- **İlk etkileşim süresi:** < 1 saniye
- **Animasyon FPS:** 60 fps
- **Mobil uyumluluk:** %100 responsive

### Özellik Kapsamı
- **Sayfa sayısı:** 7 ana sayfa
- **Bileşen sayısı:** 8+ yeniden kullanılabilir bileşen
- **API endpoint entegrasyonu:** 15+ endpoint
- **Dosya formatı desteği:** 8+ format

---

## 🎯 Öne Çıkan Özellikler

### En Değerli Özellikler
1. **Akıllı Chat:** Doğal dil ile AI konuşması ve dosya işleme
2. **Otomatik Workflow Tetikleme:** Master Agent ile akıllı workflow seçimi
3. **Microsoft 365 Entegrasyonu:** To-Do, Calendar, OneDrive tam entegrasyonu
4. **Dosya Analizi:** PDF, Word, Excel'den otomatik bilgi çıkarma
5. **Chat Geçmişi:** Tüm konuşmaları saklama ve yönetme

### Fark Yaratıcı Özellikler
- **Intent Detection:** Kullanıcı niyetini otomatik algılama
- **Düşünce süreci gösterimi:** AI'ın nasıl düşündüğünü görme
- **Workflow versiyon kontrolü:** 3 versiyon otomatik saklama
- **Kullanıcı bazlı prompt:** Her kullanıcı için özel prompt kaydetme
- **Dosya ile workflow:** Dosya yükleyerek otomatik işlem başlatma
- **Tag bazlı filtreleme:** Workflow'ları hızlı bulma
- **PostgreSQL senkronizasyonu:** Workflow metadata'sını veritabanında tutma

---

## 🔮 Gelecek Vizyonu

### Kullanıcı Deneyimi
- **Kişiselleştirilmiş dashboard:** Kullanıcıya özel ana sayfa
- **Akıllı öneriler:** AI destekli özellik önerileri
- **Öğrenen arayüz:** Kullanıcı davranışlarına göre adaptasyon
- **Sesli komutlar:** Tam sesli kontrol

### Teknik Gelişmeler
- **PWA desteği:** Progressive Web App özellikleri
- **Offline çalışma:** İnternet olmadan temel özellikler
- **Real-time sync:** Anlık veri senkronizasyonu
- **Edge computing:** Daha hızlı yanıt süreleri

---

---

## 📝 Özet: MindCubes Ne Yapabilir?

### Temel Yetenekler
✅ **AI Chat:** Doğal dil ile konuşma, dosya analizi, çoklu oturum  
✅ **Workflow Otomasyonu:** N8N entegrasyonu, otomatik tetikleme, versiyon kontrolü  
✅ **Görev Yönetimi:** E-postalardan görev çıkarma, Microsoft To-Do entegrasyonu  
✅ **Takvim Yönetimi:** Otomatik etkinlik oluşturma, Microsoft Calendar entegrasyonu  
✅ **Dosya Yönetimi:** Buluta kaydetme, OneDrive entegrasyonu, dosya analizi  
✅ **E-posta Otomasyonu:** Kategorilendirme, önceliklendirme, organizasyon  
✅ **Model Yönetimi:** Ollama modelleri görüntüleme ve seçme  
✅ **Veri Saklama:** PostgreSQL ile güvenli veri yönetimi  

### Teknik Özellikler
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Node.js, Express, MongoDB, PostgreSQL
- **AI Engine:** Python, FastAPI, Master Agent, N8N Tools
- **Entegrasyonlar:** Microsoft 365, N8N, Ollama
- **Güvenlik:** JWT, API Keys, PostgreSQL

### Kullanım Alanları
1. **Günlük İş Yönetimi:** E-posta, görev, takvim otomasyonu
2. **Dosya İşleme:** Belge analizi, görev çıkarma, bulut yedekleme
3. **AI Asistanlık:** Doğal dil ile işlem yapma, soru-cevap
4. **Workflow Otomasyonu:** Karmaşık iş akışlarını otomatikleştirme
5. **Veri Analizi:** Dosyalardan bilgi çıkarma ve analiz

---

**Son Güncelleme:** Kasım 2025  
**Versiyon:** 1.1.0

