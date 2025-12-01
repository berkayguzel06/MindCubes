"""
Date/Time Tool - Provides current date and time from the server
"""

from datetime import datetime
from typing import Any, Dict, Optional

from core.base_tool import BaseTool, ToolParameter


WEEKDAY_TR = {
    0: "Pazartesi",
    1: "Salı",
    2: "Çarşamba",
    3: "Perşembe",
    4: "Cuma",
    5: "Cumartesi",
    6: "Pazar",
}

MONTH_TR = {
    1: "Ocak",
    2: "Şubat",
    3: "Mart",
    4: "Nisan",
    5: "Mayıs",
    6: "Haziran",
    7: "Temmuz",
    8: "Ağustos",
    9: "Eylül",
    10: "Ekim",
    11: "Kasım",
    12: "Aralık",
}


class DateTimeTool(BaseTool):
    """
    Custom tool that returns the current real date and time from the server.
    
    Agents should use this tool whenever the user asks questions like:
    - "Bugün günlerden ne?"
    - "Tarih nedir?"
    - "Şu an saat kaç?" (saat bilgisi de döner)
    """

    def __init__(self) -> None:
        super().__init__(
            name="current_datetime",
            description=(
                "Gerçek sistem saatine göre güncel tarih ve saati döner. "
                "Kullanıcı bugünün tarihi, haftanın günü veya şu anki saat "
                "hakkında soru sorarsa bu tool'u kullan."
            ),
            parameters=[
                ToolParameter(
                    name="include_time",
                    type="boolean",
                    description="Yanıtta saat bilgisini de dahil et (varsayılan: true)",
                    required=False,
                    default=True,
                ),
            ],
        )

    async def execute(self, include_time: Optional[bool] = True, **kwargs: Any) -> Dict[str, Any]:
        now = datetime.now()

        weekday_name = WEEKDAY_TR[now.weekday()]
        month_name = MONTH_TR[now.month]

        # Örnek: "Bugün Pazartesi, 1 Aralık 2025."
        date_sentence = f"Bugün {weekday_name}, {now.day} {month_name} {now.year}."

        time_str = now.strftime("%H:%M")

        if include_time:
            date_sentence = f"{date_sentence} Şu an saat {time_str}."

        return {
            "date": now.date().isoformat(),
            "time": time_str,
            "weekday": weekday_name,
            "month": month_name,
            "timestamp": now.isoformat(),
            "natural_text_tr": date_sentence,
        }



