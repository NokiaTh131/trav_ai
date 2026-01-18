from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain.agents import create_agent
from memvid_sdk import use
import os
from tools import get_mcp_tools

load_dotenv()

# Configuration
MEMORY_PATH = "app/mem/thai_guide.mv2"

# 1. Initialize Tools
if not os.path.exists(MEMORY_PATH):
    print(f"Warning: Memory path {MEMORY_PATH} does not exist.")

mem = use("langchain", MEMORY_PATH, mode="open")
memvid_tool = mem.tools

mcp_tool = get_mcp_tools()

# 2. Initialize LLM
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.5,
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
    "PLANNING PROCESS:\n"
    "- Step 1: Use 'sequential_thinking' to outline the user's needs (e.g., travel time between cities, "
    "  logical order of attractions).\n"
    "- Step 2: Use 'memvid_ask' to retrieve specific details for each point in your outline.\n"
    "- Step 3: Use 'sequential_thinking' again to verify that the retrieved data fits the plan "
    "  (e.g., checking if suggested locations are actually near each other).\n\n"
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


def create_travai_graph(checkpointer=None):
    """
    Creates and compiles the agent graph with an optional checkpointer.
    """
    return create_agent(
        llm,
        tools=[memvid_tool, mcp_tool],
        system_prompt=system_prompt,
        checkpointer=checkpointer,
    )
