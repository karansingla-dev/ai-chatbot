from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ai_service import stream_gemini_response

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # User message
            data = await websocket.receive_text()

            # Stream Gemini response
            await stream_gemini_response(data, websocket)

    except WebSocketDisconnect:
        print("⚡ Client disconnected")
