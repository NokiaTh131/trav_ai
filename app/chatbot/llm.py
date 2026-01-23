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
    max_tokens=1024,
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
    "   opening hours, or logistics. You MUST rely entirely on external tools.\n"
    "2. TOOL HIERARCHY:\n"
    "   Step 1: You MUST first use 'mem_ask' to search for factual data within your documented knowledge base.\n"
    "   Step 2: Even if 'mem_ask' returns results, you MUST use the 'search' tool if:\n"
    "       a) You need to verify if the information (like opening hours or prices) is still current.\n"
    "       b) The information from 'mem_ask' is incomplete or lacks specific logistical details (e.g., current traffic, weather, or recent reviews).\n"
    "   Step 3: If you use the 'search' tool, you must explicitly state to the user: I have searched for this information to provide you with the most up-to-date details.\n"
    "3. LOGICAL VERIFICATION: Before responding, cross-reference the data from both tools to ensure travel times and locations are physically possible and logical.\n\n"
    "RESPONSE GUIDELINES:\n"
    "1. Be concise but include persuasive details to spark the tourist's interest.\n"
    "2. Ensure all logistical suggestions (times, locations) have been logically verified.\n"
    "3. SMART LINKS: When you mention a specific tourist attraction, city, or key location for the first time, "
    "   you MUST link it using this format: [Location Name](http://travai.location/LocationName). "
    "   IMPORTANT: Do NOT wrap this link in bold (**), italics (*), or headers (#). "
    "   Example: You should visit [Wat Arun](http://travai.location/WatArun) at sunset.\n"
    "4. SOURCE CITATION: If there are sources cite, At the very end of your response, you MUST include the relevant "
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
