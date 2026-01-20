import os
import json
import re
import uvicorn
import uuid
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import APIKeyHeader
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.chatbot.llm import create_travai_graph
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

# Global state
graph = None
checkpointer_instance = None
DB_PATH = "checkpoints.sqlite"

FOUND_RESULTS_REGEX = re.compile(r"^Found\s+\d+\s+(?:search\s+)?results", re.IGNORECASE)


# Helper for metadata management (synchronous sqlite3 for simplicity in metadata operations)
def init_metadata_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS threads (
                thread_id TEXT PRIMARY KEY,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


def save_thread_metadata(thread_id: str, title: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO threads (thread_id, title) VALUES (?, ?)",
            (thread_id, title),
        )
        conn.commit()


def update_thread_title(thread_id: str, title: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE threads SET title = ? WHERE thread_id = ?", (title, thread_id)
        )
        conn.commit()


def get_all_threads():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            "SELECT thread_id, title, created_at FROM threads ORDER BY created_at DESC"
        )
        return [dict(row) for row in cursor.fetchall()]


def delete_thread_metadata(thread_id: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM threads WHERE thread_id = ?", (thread_id,))
        conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph, checkpointer_instance

    # Initialize metadata table
    init_metadata_db()

    # Initialize AsyncSqliteSaver for LangGraph
    async with AsyncSqliteSaver.from_conn_string(DB_PATH) as checkpointer:
        print("Initializing AsyncSqliteSaver and Graph...")
        checkpointer_instance = checkpointer
        graph = await create_travai_graph(checkpointer)
        yield
        print("Closing AsyncSqliteSaver...")


app = FastAPI(title="Travai Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY_NAME = "X-API-Key"
API_KEY = os.environ.get("TRAVAI_API_KEY", "change-me-to-a-secure-key")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def verify_api_key(api_key: str = Depends(api_key_header)):
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key


# --- Pydantic Models ---
class ThreadUpdate(BaseModel):
    title: str


# --- Endpoints ---


@app.get("/threads", dependencies=[Depends(verify_api_key)])
async def list_threads():
    """List all available chat sessions."""
    try:
        threads = get_all_threads()
        # Map to frontend format
        return [
            {
                "id": t["thread_id"],
                "title": t["title"] or "Untitled Chat",
                "createdAt": t[
                    "created_at"
                ],  # You might want to format this or send raw
            }
            for t in threads
        ]
    except Exception as e:
        print(f"Error listing threads: {e}")
        return []


@app.patch("/threads/{thread_id}", dependencies=[Depends(verify_api_key)])
async def update_thread(thread_id: str, payload: ThreadUpdate):
    """Update the title of a chat session."""
    try:
        update_thread_title(thread_id, payload.title)
        return {"status": "updated", "thread_id": thread_id, "title": payload.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{thread_id}", dependencies=[Depends(verify_api_key)])
async def get_history(thread_id: str):
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = await graph.aget_state(config)  # pyright: ignore[reportArgumentType]
        if snapshot.values and "messages" in snapshot.values:
            messages = snapshot.values["messages"]
            history = []
            for msg in messages:
                content = msg.content
                if isinstance(content, list):
                    text_parts = []
                    for part in content:
                        if isinstance(part, str):
                            text_parts.append(part)
                        elif isinstance(part, dict) and "text" in part:
                            text_parts.append(part["text"])
                    content = "".join(text_parts)

                if (
                    not content
                    or content.startswith("Answer: ")
                    or FOUND_RESULTS_REGEX.match(content.strip())
                ):
                    continue
                role = "assistant"
                if msg.type == "human":
                    role = "user"
                elif msg.type == "ai":
                    role = "assistant"
                elif msg.type == "system":
                    role = "system"
                history.append({"role": role, "content": content})
            return {"messages": history}
        return {"messages": []}
    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"messages": []}


@app.delete("/thread/{thread_id}", dependencies=[Depends(verify_api_key)])
async def delete_thread(thread_id: str):
    if not checkpointer_instance:
        raise HTTPException(status_code=503, detail="Database not initialized")
    try:
        print(f"Deleting thread: {thread_id}")
        # Delete from LangGraph checkpoint
        await checkpointer_instance.adelete_thread(thread_id)
        # Delete from metadata table
        delete_thread_metadata(thread_id)
        return {"status": "deleted", "thread_id": thread_id}
    except Exception as e:
        print(f"Error deleting thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stream", dependencies=[Depends(verify_api_key)])
async def stream_agent(request: Request):
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")
    try:
        input_payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    messages = input_payload.get("messages")
    if not messages:
        raise HTTPException(status_code=400, detail="Missing 'messages'")

    thread_id = input_payload.get("thread_id")
    if not thread_id:
        thread_id = str(uuid.uuid4())

    save_thread_metadata(thread_id, "New Chat")

    async def event_generator():
        try:
            config = {"configurable": {"thread_id": thread_id}}
            async for event in graph.astream_events(  # pyright: ignore[reportOptionalMemberAccess]
                {"messages": messages},
                config=config,  # pyright: ignore[reportArgumentType]
                version="v2",  # pyright: ignore[reportArgumentType]
            ):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    if "chunk" in event["data"]:
                        data_chunk = event["data"]["chunk"]

                        # Stream tool calls
                        if (
                            hasattr(data_chunk, "tool_call_chunks")
                            and data_chunk.tool_call_chunks
                        ):
                            for tc_chunk in data_chunk.tool_call_chunks:
                                name = tc_chunk.get("name")
                                args = tc_chunk.get("args")
                                index = tc_chunk.get("index")

                                # Send to frontend
                                tool_payload = {
                                    "type": "tool_call",
                                    "index": index,
                                    "name": name,
                                    "args": args,
                                }
                                yield f"data: {json.dumps(tool_payload)}\n\n"

                        if hasattr(data_chunk, "content"):
                            content = data_chunk.content
                            if content:
                                payload = json.dumps({"content": content})
                                yield f"data: {payload}\n\n"

            yield "event: end\ndata: {}\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    print("Starting Secure Server on port 2024...")
    print(f"API Key protection enabled. Current key: {API_KEY}")
    uvicorn.run(app, host="0.0.0.0", port=2024)
