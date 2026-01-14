from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain.agents import create_agent
from memvid_sdk import use
import os

load_dotenv()

# Configuration
MEMORY_PATH = "app/mem/thai_guide.mv2"


# 1. Initialize Tools (Memvid)
# Ensure memory path exists or handle appropriately
if not os.path.exists(MEMORY_PATH):
    print(f"Warning: Memory path {MEMORY_PATH} does not exist.")

mem = use("langchain", MEMORY_PATH, mode="open")
tools = mem.tools if isinstance(mem.tools, list) else [mem.tools]


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
    "IMPORTANT: You have NO internal knowledge of specific tourist attractions, "
    "opening hours, or current travel advice in Thailand. "
    "For ANY question regarding Thailand tourism (places, culture, food, travel advice), "
    "you MUST use the 'memvid_ask' tool to retrieve accurate information. "
    "NEVER answer from memory. If the tool returns no results, state that you don't know.\n\n"
    "Response Guidelines:\n"
    "1. FIRST, check the 'memvid_ask' tool for information.\n"
    "2. Be concise but include enough persuasive detail to spark the tourist's interest.\n"
    "3. At the very end of your response, you MUST include the relevant source pages in a JSON block.\n"
    "   Use the 'page_number' and 'source_file' (or 'title') from the tool output.\n"
    "   Format:\n"
    "   ```json\n"
    "   {\n"
    '     "sources": [\n'
    '       {"file": "filename.pdf", "page": 1}\n'
    "     ]\n"
    "   }\n"
    "   ```\n"
    "   Ensure the JSON block is the very last thing in your response."
)

# 4. Create Graph
graph = create_agent(
    llm,
    tools,
    system_prompt=system_prompt,
)
