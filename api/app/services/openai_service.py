"""OpenAI integration: one-shot interpretations + streaming chat.

Uses gpt-4o-mini by default for cost. The system prompt is intentionally large
and stable so OpenAI's server-side prompt caching kicks in.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import AsyncIterator

from openai import AsyncOpenAI, OpenAI

from app.config import get_settings
from app.models.schemas import (
    ChatMessage,
    InterpretRequest,
    InterpretResponse,
    NatalChartResponse,
)


_settings = get_settings()


def _client_async() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=_settings.openai_api_key)


def _client_sync() -> OpenAI:
    return OpenAI(api_key=_settings.openai_api_key)


SYSTEM_PROMPT_NATAL = """You are an astrologer who reads charts in the tradition of Liz Greene and Robert Hand: psychological depth, archetypal language, no fortune-telling. Be kind, specific, and non-deterministic. Translate technical terms when first used.

Guidelines:
- Output Markdown. Sections: Overview, Luminaries & Ascendant, Personal Planets, Social Planets, Outer Planets, Major Aspects, Themes & Integration.
- Maximum ~700 words.
- Do not invent positions; use only the structured data provided.
- Acknowledge house-system and zodiac (tropical/sidereal) chosen by the user.
- For mundane focus, frame the chart as collective rather than personal."""


SYSTEM_PROMPT_CHAT = """You are an astrology assistant. The user has provided a birth chart as JSON. Answer questions about it grounded ONLY in the given data. If you don't know, say so. Be warm, concise, and avoid prediction language. Use Markdown."""


def _format_chart_for_prompt(chart: NatalChartResponse) -> str:
    lines: list[str] = []
    lines.append(f"ZODIAC: {chart.config.zodiac}")
    lines.append(f"HOUSE_SYSTEM: {chart.config.house_system}")
    if chart.config.zodiac == "sidereal":
        lines.append(f"AYANAMSA: {chart.config.ayanamsa}")
    lines.append(
        f"BIRTH: {chart.birth.birth_date} {chart.birth.birth_time}"
        f" ({chart.birth.location.timezone or 'UTC'})"
    )
    place = chart.birth.location.place_label or "—"
    lines.append(
        f"PLACE: {place} ({chart.birth.location.latitude:.4f}, {chart.birth.location.longitude:.4f})"
    )
    lines.append(f"ASC: {chart.houses.ascendant:.2f}°  MC: {chart.houses.midheaven:.2f}°")
    lines.append("PLANETS:")
    for p in chart.planets:
        retro = " R" if p.retrograde else ""
        lines.append(
            f"  - {p.name}: {p.sign} {p.sign_degree:.2f}° (house {p.house}{retro})"
        )
    lines.append("MAJOR ASPECTS (orb<=8°):")
    for a in chart.aspects:
        applying = "applying" if a.applying else "separating"
        lines.append(
            f"  - {a.body_a} {a.aspect} {a.body_b} (orb {a.orb:.1f}°, {applying})"
        )
    return "\n".join(lines)


def chart_cache_key(chart: NatalChartResponse, focus: str, model: str) -> str:
    payload = chart.model_dump(mode="json")
    payload["__focus__"] = focus
    payload["__model__"] = model
    payload["__prompt_version__"] = "natal_v1"
    blob = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(blob.encode()).hexdigest()


_INTERPRETATION_CACHE: dict[str, tuple[InterpretResponse, datetime]] = {}


async def interpret_natal(req: InterpretRequest) -> InterpretResponse:
    if not _settings.openai_api_key:
        return _stub_interpretation(req)

    model = _settings.openai_model
    key = chart_cache_key(req.chart, req.focus, model)
    cached = _INTERPRETATION_CACHE.get(key)
    if cached:
        return cached[0]

    user = (
        _format_chart_for_prompt(req.chart)
        + f"\n\nUSER FOCUS: {req.focus}\n\nWrite the interpretation now."
    )
    client = _client_async()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_NATAL},
            {"role": "user", "content": user},
        ],
        temperature=0.7,
        max_tokens=1200,
    )
    text = response.choices[0].message.content or ""
    result = InterpretResponse(focus=req.focus, interpretation=text, model=model)
    _INTERPRETATION_CACHE[key] = (result, datetime.utcnow())
    return result


def _stub_interpretation(req: InterpretRequest) -> InterpretResponse:
    """Fallback when OPENAI_API_KEY is not configured.

    Returns a deterministic placeholder so the UI is testable without spending
    OpenAI credits.
    """
    chart = req.chart
    sun = next((p for p in chart.planets if p.name == "Sun"), None)
    moon = next((p for p in chart.planets if p.name == "Moon"), None)
    asc = chart.houses.ascendant
    text = (
        f"# {req.focus.title()} Reading (offline mode)\n\n"
        f"_OpenAI is not configured on this deployment, so this is a structured "
        f"summary rather than a full AI interpretation._\n\n"
        f"## Luminaries & Ascendant\n\n"
        f"- **Sun** in {sun.sign if sun else '—'} (house {sun.house if sun else '—'})\n"
        f"- **Moon** in {moon.sign if moon else '—'} (house {moon.house if moon else '—'})\n"
        f"- **Ascendant** at {asc:.2f}°\n\n"
        f"## Aspects\n\n" +
        "\n".join(f"- {a.body_a} {a.aspect} {a.body_b} (orb {a.orb:.1f}°)"
                 for a in chart.aspects[:10])
    )
    return InterpretResponse(
        focus=req.focus, interpretation=text, model="offline-stub"
    )


async def stream_chat(
    messages: list[ChatMessage], chart: NatalChartResponse | None
) -> AsyncIterator[str]:
    if not _settings.openai_api_key:
        yield "OpenAI is not configured on this deployment. Add OPENAI_API_KEY in the Render environment to enable chat."
        return

    system_content = SYSTEM_PROMPT_CHAT
    if chart:
        system_content += "\n\nCHART CONTEXT:\n" + _format_chart_for_prompt(chart)

    payload = [{"role": "system", "content": system_content}]
    for m in messages:
        payload.append({"role": m.role, "content": m.content})

    client = _client_async()
    stream = await client.chat.completions.create(
        model=_settings.openai_chat_model,
        messages=payload,
        temperature=0.7,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield delta
