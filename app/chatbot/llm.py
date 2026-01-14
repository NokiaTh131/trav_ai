from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from memvid_sdk import use


load_dotenv()


class ChatBot:
    def __init__(self, memory_path: str):
        self.mem = use("langchain", memory_path, mode="read_only")
        self.tool = self.mem.tools
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.7,
            max_tokens=4048,
            max_retries=2,
        )

    def new_agent(self):
        agent = create_agent(self.llm, tools=[self.tool], checkpointer=InMemorySaver())
        return agent
