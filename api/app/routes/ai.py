"""AI endpoints: interpretation + streaming chat."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    ChatRequest,
    InterpretRequest,
    InterpretResponse,
)
from app.services.openai_service import interpret_natal, stream_chat


router = APIRouter(prefix="/api/v1", tags=["ai"])


@router.post("/interpret/natal", response_model=InterpretResponse)
async def interpret(req: InterpretRequest) -> InterpretResponse:
    return await interpret_natal(req)


@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    async def event_stream():
        async for delta in stream_chat(req.messages, req.chart):
            payload = delta.replace("\n", "\\n")
            yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
