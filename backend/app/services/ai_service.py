import json
import google.genai as genai
from app.config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

async def stream_gemini_response(user_msg: str, websocket):
    try:
        stream = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=f"""
You are a helpful support assistant.
User said: "{user_msg}".

1. First generate a natural, human-like reply (stream it).
2. At the end, also give 3 short possible user replies in JSON only:
   {{"suggestions": ["...", "...", "..."]}}
            """,
            config={"temperature": 0.7, "top_p": 0.9, "max_output_tokens": 1024},
        )

        collected_text = ""

        # Send reply chunks
        for event in stream:
            if event.candidates and event.candidates[0].content.parts:
                part = event.candidates[0].content.parts[0]
                if hasattr(part, "text") and part.text:
                    chunk = part.text
                    collected_text += chunk
                    await websocket.send_json({"type": "chunk", "text": chunk})

        # Extract suggestions
        suggestions = []
        if "{" in collected_text and "}" in collected_text:
            try:
                json_str = collected_text[collected_text.index("{"):collected_text.rindex("}")+1]
                data = json.loads(json_str)
                suggestions = data.get("suggestions", [])
                # remove JSON from text
                collected_text = (
                    collected_text.replace(json_str, "")
                    .replace("```json", "")
                    .replace("```", "")
                    .strip()
                )
            except Exception as e:
                print("⚠️ JSON parse failed:", e)

        # Finalize
        await websocket.send_json({
            "type": "end",
            "reply": collected_text.strip(),
            "suggestions": suggestions
        })

    except Exception as e:
        print("⚠️ Streaming error:", e)
        await websocket.send_json({"type": "error", "text": "Something went wrong."})
