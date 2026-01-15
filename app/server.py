import os
import json
import uvicorn
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import APIKeyHeader
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.chatbot.llm import create_travai_graph
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from dotenv import load_dotenv

load_dotenv()


# Global state for the graph
graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the lifecycle of the application.
    """
    global graph
    DB_PATH = "checkpoints.sqlite"

    async with AsyncSqliteSaver.from_conn_string(DB_PATH) as checkpointer:
        graph = create_travai_graph(checkpointer)
        yield


# Initialize FastAPI app with lifespan
app = FastAPI(title="Travai Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Configuration
API_KEY_NAME = "X-API-Key"
API_KEY = os.environ.get("TRAVAI_API_KEY", "change-me-to-a-secure-key")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verifies the API key from the request header."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
        )
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key",
        )
    return api_key


@app.get("/history/{thread_id}", dependencies=[Depends(verify_api_key)])
async def get_history(thread_id: str):
    """
    Retrieves the chat history for a given thread ID from the graph state.
    """
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    config = {"configurable": {"thread_id": thread_id}}

    # Get the state snapshot from the checkpointer
    try:
        snapshot = await graph.aget_state(config)  # pyright: ignore[reportArgumentType]

        # Snapshot.values contains the state dict (e.g. {"messages": [...]})
        if snapshot.values and "messages" in snapshot.values:
            messages = snapshot.values["messages"]

            # Convert messages to simple dicts for JSON response
            history = []
            for msg in messages:
                role = "assistant"
                if msg.type == "human":
                    role = "user"
                elif msg.type == "ai":
                    role = "assistant"
                elif msg.type == "system":
                    role = "system"

                history.append({"role": role, "content": msg.content})

            return {"messages": history}

        return {"messages": []}

    except Exception as e:
        print(f"Error fetching history: {e}")
        return {"messages": []}


@app.post("/stream", dependencies=[Depends(verify_api_key)])
async def stream_agent(request: Request):
    """
    Streams the agent's response using Server-Sent Events (SSE).
    """
    if not graph:
        raise HTTPException(status_code=503, detail="Graph not initialized")

    try:
        input_payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # Extract messages and thread_id
    messages = input_payload.get("messages")
    if not messages:
        raise HTTPException(status_code=400, detail="Missing 'messages' in body")

    thread_id = input_payload.get("thread_id")
    if not thread_id:
        # Generate a random thread_id if not provided
        thread_id = str(uuid.uuid4())

    async def event_generator():
        try:
            # Prepare the config with thread_id
            config = {"configurable": {"thread_id": thread_id}}

            async for event in graph.astream_events(  # pyright: ignore[reportOptionalMemberAccess]
                {"messages": messages},
                config=config,  # pyright: ignore[reportArgumentType]
                version="v2",  # pyright: ignore[reportArgumentType]
            ):
                kind = event["event"]

                # Stream tokens from the Chat Model
                if kind == "on_chat_model_stream":
                    if "chunk" in event["data"]:
                        data_chunk = event["data"]["chunk"]

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
