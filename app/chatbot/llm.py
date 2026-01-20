from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from langchain.agents import create_agent
from memvid_sdk import use
import os
from app.chatbot.tools import mcp_client

load_dotenv()

# Configuration
MEMORY_PATH = "app/mem/thai_guide.mv2"

# 1. Initialize Tools
if not os.path.exists(MEMORY_PATH):
    print(f"Warning: Memory path {MEMORY_PATH} does not exist.")


_MEM_INSTANCE = None


async def get_all_tools():
    global _MEM_INSTANCE

    if _MEM_INSTANCE is None:
        try:
            _MEM_INSTANCE = use("langchain", MEMORY_PATH, mode="open")
        except Exception as e:
            print(f"Failed to open memory: {e}")
            raise e

    memvid_tools = (
        _MEM_INSTANCE.tools
        if isinstance(_MEM_INSTANCE.tools, list)
        else [_MEM_INSTANCE.tools]
    )

    mcp_tools = await mcp_client.get_tools()
    return memvid_tools + mcp_tools


# 2. Initialize LLM
llm = init_chat_model(
    model=os.getenv("MODEL"),
    temperature=0.1,
    max_tokens=4048,
    timeout=None,
    max_retries=2,
)

# 3. System Prompt
system_prompt = (
    "You are a specialized tourist guide assistant for Thailand. "
    "Your goal is to provide high-quality, logically sound travel advice by combining "
    "documented knowledge with rigorous reasoning.\n\n"
    "CORE CONSTRAINTS:\n"
    "1. NO INTERNAL KNOWLEDGE: You have no internal memory of Thailand's attractions, "
    "   opening hours, or logistics. You MUST use 'memvid_ask' for all factual data.\n"
    "2. SEQUENTIAL THINKING: For any complex request (itineraries, multi-destination trips, "
    "   or logistical planning), you MUST use the 'sequential_thinking' tool FIRST to "
    "   break down the problem, identify dependencies, and validate the logic of your plan.\n"
    "3. GROUNDED ANSWERS: If 'memvid_ask' returns no results, state that you don't know "
    "   rather than hallucinating.\n\n"
    "TOOL USING:\n"
    "- Before answering ANY user query, you MUST first analyze the request and determine "
    "  whether one or more tools are relevant and available.\n"
    "- If a relevant tool EXISTS for the query, you MUST use that tool to obtain information "
    "  or validate your reasoning. You are NOT allowed to answer directly when a suitable tool "
    "  can improve factual accuracy, grounding, or logical correctness.\n"
    "- If MULTIPLE tools are applicable, you MUST choose the most appropriate tool or use them "
    "  in a logical sequence.\n"
    "- If NO tool is applicable, explicitly reason why and proceed with a direct response.\n"
    "- Tool usage decisions must be intentional, justified, and aligned with the goal of "
    "  providing the most accurate and verifiable answer.\n"
    "RESPONSE GUIDELINES:\n"
    "1. Be concise but include persuasive details to spark the tourist's interest.\n"
    "2. Ensure all logistical suggestions (times, locations) have been logically verified.\n"
    "3. SOURCE CITATION: At the very end of your response, you MUST include the relevant "
    "   source pages in a JSON block using 'page_number' and 'source_file'.\n\n"
    "Format:\n"
    "```json\n"
    "{\n"
    '  "sources": [\n'
    '    {"file": "filename.pdf", "page": 1}\n'
    "  ]\n"
    "}\n"
    "```\n"
    "Ensure the JSON block is the very last thing in your response."
)


async def create_travai_graph(checkpointer=None):
    """
    Creates and compiles the agent graph with an optional checkpointer.
    """

    tools = await get_all_tools()
    return create_agent(
        llm,
        tools,
        system_prompt=system_prompt,
        checkpointer=checkpointer,
    )


async def make_graph():
    """
    Creates and compiles the agent graph with an optional checkpointer.
    """

    tools = await get_all_tools()
    return create_agent(
        llm,
        tools,
        system_prompt=system_prompt,
    )


graph = make_graph
