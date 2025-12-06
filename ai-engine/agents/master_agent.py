"""
Master Agent - Orchestrates sub-agents and tools based on user intent
This agent analyzes user messages and delegates tasks to appropriate tools/workflows
"""

import json
import re
from typing import Any, Dict, List, Optional, Tuple
from core.base_agent import BaseAgent
from core.base_tool import BaseTool
from core.llm_provider import LLMProvider
from core.memory import Memory
from core.task import Task
from core.logger import get_logger


logger = get_logger(__name__)


# Intent detection keywords and patterns
INTENT_PATTERNS = {
    "todo": {
        "keywords": [
            "görev", "task", "todo", "yapılacak", "yapılacaklar", "görev çıkar", 
            "görev oluştur", "task extract", "action item", "to-do", "iş listesi",
            "görev ekle", "yapılacaklar listesi", "görevleri çıkar", "görevleri bul",
            "aksiyon", "eylem", "görev listesi"
        ],
        "patterns": [
            r"görev.*çıkar", r"task.*extract", r"görev.*oluştur", r"todo.*create",
            r"yapılacak.*bul", r"yapılacak.*çıkar", r"görev.*ekle"
        ],
        "description": "görev oluşturma",
        "needs_details": False  # Dosya varsa detay sorma
    },
    "calendar": {
        "keywords": [
            "takvim", "calendar", "randevu", "toplantı", "meeting", "etkinlik",
            "event", "schedule", "planla", "rezervasyon", "ajanda",
            "hatırlat", "reminder", "buluşma"
        ],
        "patterns": [
            r"takvim.*ekle", r"calendar.*add", r"toplantı.*oluştur", r"meeting.*create",
            r"randevu.*al", r"etkinlik.*planla", r"takvime.*kaydet"
        ],
        "description": "takvim etkinliği",
        "needs_details": True,  # Tarih, saat, başlık lazım
        "required_info": ["etkinlik adı", "tarih", "saat"]
    },
    "drive": {
        "keywords": [
            "kaydet", "save", "dosya", "file", "drive", "onedrive", "google drive",
            "bulut", "cloud", "yükle", "upload", "depolama", "storage", "sakla",
            "yedekle", "backup"
        ],
        "patterns": [
            r"dosya.*kaydet", r"file.*save", r"drive.*yükle", r"cloud.*upload",
            r"bulut.*kaydet", r"dosya.*sakla", r"dosyayı.*yükle"
        ],
        "description": "dosya kaydetme",
        "needs_details": False  # Dosya ekli olmalı
    },
    "mail_categorization": {
        "keywords": [
            "kategorile", "categorize", "sınıflandır", "organize", "düzenle",
            "etiketle", "label", "mail organize", "posta düzenle", "inbox"
        ],
        "patterns": [
            r"mail.*kategorile", r"email.*categorize", r"posta.*düzenle",
            r"inbox.*organize"
        ],
        "description": "e-posta kategorilendirme",
        "needs_details": False
    },
    "mail_prioritizing": {
        "keywords": [
            "öncelik", "priority", "önemli", "important", "acil", "urgent",
            "sırala", "sort", "önceliklendir", "prioritize",
            "öncelik ata", "öncelik ver", "acil olarak işaretle", "sadece önemli mailleri göster",
            "önemli mailleri listele", "acil mailleri göster", "high priority", "low priority",
            "show urgent", "show important", "highlight important", "önemli mailleri vurgula",
            "acil mailleri filtrele"
        ],
        "patterns": [
            r"mail.*öncelik", r"email.*priority", r"posta.*sırala",
            r"önemli.*mail", r"öncelik.*ata", r"öncelik.*ver", r"acil.*işaretle",
            r"sadece.*önemli.*mail", r"önemli.*mailleri.*listele", r"acil.*mailleri.*göster",
            r"high.*priority", r"low.*priority", r"show.*urgent", r"show.*important",
            r"highlight.*important", r"acil.*mailleri.*filtrele"
        ],
        "description": "e-posta önceliklendirme",
        "needs_details": False
    }
}


def extract_event_details(message: str) -> Dict[str, Any]:
    """Extract event details from message using patterns."""
    details = {
        "title": None,
        "date": None,
        "time": None
    }
    
    # Time patterns (14:00, 14.00, saat 14)
    time_patterns = [
        r'(\d{1,2})[:\.](\d{2})',
        r'saat\s*(\d{1,2})',
    ]
    for pattern in time_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                details["time"] = f"{match.group(1)}:{match.group(2)}"
            else:
                details["time"] = f"{match.group(1)}:00"
            break
    
    # Date patterns
    date_keywords = {
        "bugün": "bugün",
        "yarın": "yarın",
        "öbür gün": "öbür gün",
        "pazartesi": "pazartesi",
        "salı": "salı",
        "çarşamba": "çarşamba",
        "perşembe": "perşembe",
        "cuma": "cuma",
        "cumartesi": "cumartesi",
        "pazar": "pazar"
    }
    for keyword, value in date_keywords.items():
        if keyword in message.lower():
            details["date"] = value
            break
    
    # Also check for explicit dates like "15 Aralık", "15/12"
    date_pattern = r'(\d{1,2})[/\.\s-]*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|\d{1,2})'
    match = re.search(date_pattern, message, re.IGNORECASE)
    if match:
        details["date"] = match.group(0)
    
    return details


class MasterAgent(BaseAgent):
    """
    Master Agent that orchestrates sub-agents and tools.
    Analyzes user intent and delegates to appropriate n8n workflows or tools.
    Asks for details before executing actions when needed.
    """
    
    def __init__(
        self,
        llm_provider: LLMProvider,
        tools: Optional[List[BaseTool]] = None,
        memory: Optional[Memory] = None,
        use_llm_for_intent: bool = True
    ):
        super().__init__(
            name="MasterAgent",
            description=(
                "Master orchestrator agent that analyzes user requests and delegates "
                "to appropriate tools and workflows."
            ),
            llm_provider=llm_provider,
            tools=tools,
            memory=memory
        )
        self.use_llm_for_intent = use_llm_for_intent
        self._tool_map = {tool.name: tool for tool in (tools or [])}

    def _is_datetime_question(self, message: str) -> bool:
        """Detect if the user is asking about current date or time."""
        msg = message.lower()

        date_patterns = [
            "bugün günlerden ne",
            "bugün günlerden",
            "bugün hangi gün",
            "bugün ne gün",
            "bugünün tarihi",
            "tarih nedir",
            "tarih ne",
            "şu an hangi gün",
            "hangi gündeyiz",
            "hangi tarihteyiz",
            "hangi gün",
            "what day is it",
            "today's date",
            "what is the date",
        ]

        time_patterns = [
            "saat kaç",
            "şu an saat kaç",
            "şuan saat kaç",
            "şu an saat",
            "what time is it",
            "current time",
        ]

        return any(p in msg for p in date_patterns + time_patterns)
    
    def _default_system_prompt(self) -> str:
        return """Sen MindCubes platformunun AI asistanısın. Kullanıcılarla doğal ve samimi bir şekilde sohbet ediyorsun.

Görevlerin:
- Görev oluşturma (Microsoft To-Do)
- Takvim etkinlikleri oluşturma
- Dosyaları buluta kaydetme
- E-posta yönetimi

Önemli kurallar:
- Bir işlem yapmadan önce gerekli bilgileri sor
- Takvim için: etkinlik adı, tarih ve saat gerekli
- Dosya kaydetme için: dosya ekli olmalı
- Kullanıcının dilinde (Türkçe/İngilizce) yanıt ver
- Kısa ve öz ol
- Samimi ama profesyonel ol"""
    
    def _build_conversation_context(self, history: List[Dict[str, Any]]) -> str:
        """Build conversation context from history."""
        if not history:
            return ""
        
        context_parts = []
        for msg in history[-6:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                context_parts.append(f"Kullanıcı: {content}")
            else:
                context_parts.append(f"Asistan: {content}")
        
        return "\n".join(context_parts)
    
    def _detect_intent_keywords(self, message: str) -> Optional[str]:
        """Detect intent using keyword matching."""
        message_lower = message.lower()
        
        best_match = None
        best_score = 0
        
        for intent_name, intent_data in INTENT_PATTERNS.items():
            score = 0
            
            for keyword in intent_data["keywords"]:
                if keyword in message_lower:
                    score += 1
            
            for pattern in intent_data["patterns"]:
                if re.search(pattern, message_lower):
                    score += 2
            
            if score > best_score:
                best_score = score
                best_match = intent_name
        
        return best_match if best_score > 0 else None
    
    async def detect_intent(
        self,
        message: str,
        has_file: bool = False
    ) -> Tuple[Optional[str], Optional[Dict]]:
        """Detect user intent and extract details."""
        keyword_intent = self._detect_intent_keywords(message)
        
        if keyword_intent:
            intent_data = INTENT_PATTERNS.get(keyword_intent, {})
            tool_name = f"{keyword_intent}_workflow"
            
            if tool_name in self._tool_map:
                return tool_name, intent_data
        
        return None, None
    
    async def execute_tool(
        self,
        tool_name: str,
        chat_input: str,
        user_id: str = "anonymous",
        file_data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute a specific tool."""
        tool = self._tool_map.get(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"'{tool_name}' aracı bulunamadı",
                "available_tools": list(self._tool_map.keys())
            }
        
        try:
            result = await tool.run(
                chat_input=chat_input,
                user_id=user_id,
                file_data=file_data,
                **kwargs
            )
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "tool": tool_name
            }
    
    def _check_missing_details(
        self,
        intent_name: str,
        intent_data: Dict,
        message: str,
        has_file: bool
    ) -> Optional[str]:
        """Check if required details are missing and return a question if so."""
        
        # Calendar needs date, time, title
        if intent_name == "calendar_workflow":
            details = extract_event_details(message)
            missing = []
            
            if not details.get("date"):
                missing.append("tarih (örn: yarın, pazartesi, 15 Aralık)")
            if not details.get("time"):
                missing.append("saat (örn: 14:00)")
            
            # Try to extract title - anything that's not date/time related
            title_indicators = ["toplantı", "meeting", "randevu", "etkinlik", "görüşme", "buluşma"]
            has_title = any(ind in message.lower() for ind in title_indicators)
            
            if not has_title and len(message.split()) < 5:
                missing.append("etkinlik başlığı (ne için?)")
            
            if missing:
                return f"Takvime eklemek için şu bilgilere ihtiyacım var:\n• " + "\n• ".join(missing) + "\n\nBu bilgileri verir misiniz?"
        
        # Drive needs file
        if intent_name == "drive_workflow":
            if not has_file:
                return "Buluta kaydetmek için bir dosya eklemeniz gerekiyor. Lütfen dosyanızı yükleyin."
        
        return None
    
    async def process(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Process user input with conversation context."""
        context = context or {}
        file_data = context.get("file_data")
        user_id = context.get("user_id", "anonymous")
        history = context.get("history", [])
        has_file = file_data is not None
        self._current_model = context.get("model")  # Store model for LLM calls

        # Special case: questions about current date/time -> use DateTimeTool
        if self._is_datetime_question(user_input):
            datetime_tool = self._tool_map.get("current_datetime")
            if datetime_tool:
                try:
                    # We don't need extra parameters; tool uses server time
                    result = await datetime_tool.run()
                    if result.get("success"):
                        payload = result.get("result") or {}
                        # Prefer natural language text if available
                        text = payload.get("natural_text_tr") or payload.get("natural_text")
                        if text:
                            return text

                        # Fallback: build a simple sentence from fields
                        date = payload.get("date")
                        time_val = payload.get("time")
                        weekday = payload.get("weekday")
                        if date and weekday:
                            base = f"Bugün {weekday}, {date}."
                            if time_val:
                                base += f" Şu an saat {time_val}."
                            return base
                except Exception as e:
                    logger.exception(
                        "Error while using current_datetime tool",
                        extra={"error": str(e)},
                    )
            # If tool is missing or fails, we fall through to normal behavior

        # Detect intent
        tool_name, intent_data = await self.detect_intent(user_input, has_file)
        
        if tool_name and intent_data:
            # Check if we need more details before executing
            missing_details = self._check_missing_details(tool_name, intent_data, user_input, has_file)
            
            if missing_details:
                return missing_details
            
            # Execute workflow tool
            print(f"🎯 Executing workflow: {tool_name}")
            
            result = await self.execute_tool(
                tool_name=tool_name,
                chat_input=user_input,
                user_id=user_id,
                file_data=file_data
            )
            
            # Check result properly
            if result.get("success"):
                # Check if the workflow actually returned data
                workflow_result = result.get("result")
                
                # If result is empty or has error indicators, report failure
                if not workflow_result:
                    return f"⚠️ İşlem başlatıldı ancak sonuç alınamadı. Lütfen n8n'de '{tool_name}' workflow'unun aktif olduğundan emin olun."
                
                # Generate organic success response
                return await self._generate_organic_response(
                    tool_name=tool_name,
                    result=result,
                    user_input=user_input,
                    history=history
                )
            else:
                # Report actual error
                error = result.get("error", "Bilinmeyen hata")
                
                # Check for common error types
                if "Connection" in error or "connection" in error or "ECONNREFUSED" in error:
                    return f"❌ n8n servisine bağlanılamadı. Lütfen n8n'in çalıştığından emin olun."
                elif "404" in error or "not found" in error.lower():
                    return f"❌ Workflow bulunamadı. '{tool_name}' için webhook yapılandırmasını kontrol edin."
                elif "timeout" in error.lower():
                    return f"❌ İşlem zaman aşımına uğradı. Lütfen tekrar deneyin."
                else:
                    return f"❌ İşlem sırasında hata oluştu: {error}"
        
        # No tool needed - generate conversational response
        return await self._generate_conversation_response(user_input, history)
    
    async def _generate_organic_response(
        self,
        tool_name: str,
        result: Dict[str, Any],
        user_input: str,
        history: List[Dict[str, Any]]
    ) -> str:
        """Generate organic, natural response using LLM."""
        workflow_result = result.get("result", {})
        
        # Build action description
        action_descriptions = {
            "todo_workflow": "görevler To-Do listesine eklendi",
            "calendar_workflow": "etkinlik takvime eklendi",
            "drive_workflow": "dosya bulut depolamaya kaydedildi",
            "mail_categorization_workflow": "e-postalar kategorilendi",
            "mail_prioritizing_workflow": "e-postalar önceliklendirildi"
        }
        action = action_descriptions.get(tool_name, "işlem tamamlandı")
        
        # Extract details from result if available
        details = ""
        if isinstance(workflow_result, dict):
            tasks = workflow_result.get("tasks", [])
            if tasks and len(tasks) > 0:
                task_names = [t.get('title', str(t)) if isinstance(t, dict) else str(t) for t in tasks[:3]]
                details = f"Oluşturulan görevler: {', '.join(task_names)}"
        
        # Build context
        conv_context = self._build_conversation_context(history)
        
        prompt = f"""Kullanıcının isteği başarıyla tamamlandı. Kısa ve doğal bir yanıt yaz.

Önceki konuşma:
{conv_context}

Kullanıcının mesajı: "{user_input}"
Yapılan işlem: {action}
{f'Detaylar: {details}' if details else ''}

Kurallar:
- Başarı işareti (✅) ile başla
- Maksimum 2 cümle
- Samimi ve doğal ol
- Markdown kullanma (**, * vb.)
- Ne yapıldığını kısaca açıkla"""

        try:
            response = await self.llm_provider.generate(
                prompt,
                system_prompt="Kısa ve doğal yanıtlar ver. Markdown formatı kullanma.",
                model=getattr(self, '_current_model', None)  # Pass selected model
            )
            
            response = response.strip()
            # Clean any markdown
            response = response.replace("**", "").replace("*", "")
            
            if not response.startswith("✅"):
                response = "✅ " + response
            
            return response
            
        except Exception as e:
            logger.exception(
                "Error generating organic response",
                extra={"error": str(e), "tool_name": tool_name},
            )
            return f"✅ İşlem tamamlandı - {action}."
    
    async def _generate_conversation_response(
        self,
        user_input: str,
        history: List[Dict[str, Any]]
    ) -> str:
        """Generate natural conversational response."""
        conv_context = self._build_conversation_context(history)
        
        prompt = f"""Kullanıcıyla sohbet et.

Önceki konuşma:
{conv_context}

Kullanıcının mesajı: "{user_input}"

Yapabileceklerin:
- Görev oluşturma (To-Do)
- Takvim etkinliği ekleme
- Dosya kaydetme (bulut)
- E-posta yönetimi

Kurallar:
- Doğal ve samimi ol
- Kısa cevap ver (1-3 cümle)
- Markdown kullanma (**, * vb.)
- Eğer yardım istiyorsa, nasıl yardımcı olabileceğini söyle"""

        try:
            response = await self.llm_provider.generate(
                prompt,
                system_prompt=self._default_system_prompt(),
                model=getattr(self, '_current_model', None)  # Pass selected model
            )
            # Clean markdown
            response = response.strip().replace("**", "").replace("*", "")
            return response
            
        except Exception as e:
            logger.exception(
                "Error generating conversation",
                extra={"error": str(e)},
            )
            return "Size nasıl yardımcı olabilirim? Görev oluşturma, takvim yönetimi veya dosya kaydetme konularında yardımcı olabilirim."
    
    async def execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a task using the master agent."""
        user_input = task.input_data.get("message", task.description)
        context = {
            "file_data": task.input_data.get("file_data"),
            "user_id": task.input_data.get("user_id", "anonymous"),
            "history": task.input_data.get("history", [])
        }
        
        response = await self.process(user_input, context)
        
        return {
            "response": response,
            "task_id": task.task_id,
            "status": "completed"
        }
    
    def get_available_tools(self) -> List[Dict[str, Any]]:
        """Get list of available tools and their descriptions."""
        return [
            {
                "name": tool.name,
                "description": tool.description
            }
            for tool in self.tools
        ]
