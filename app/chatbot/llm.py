from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain_core.callbacks import StdOutCallbackHandler
from memvid_sdk import use

from app.chatbot.middleware import state_aware_prompt

load_dotenv()


class TouristGuideAgent:
    def __init__(self, memory_path: str):
        self.memory_path = memory_path

        # Load Memvid RAG Tool
        self.mem = use("langchain", self.memory_path, mode="open")

        # Memvid returns a tool or list of tools
        # Ensure self.tools is a list
        if isinstance(self.mem.tools, list):
            self.tools = self.mem.tools
        else:
            self.tools = [self.mem.tools]

        # Initialize LLM
        # self.llm = ChatGoogleGenerativeAI(
        #     model="gemini-2.5-flash",
        #     temperature=0.6,
        #     max_tokens=4048,
        #     max_retries=2,
        # )

        self.llm = ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=0,
            max_tokens=4048,
            timeout=None,
            max_retries=2,
        )

        self.summarizer = {
            "model": "llama-3.3-70b-versatile",
            "trigger": {"tokens": 4000},
            "keep": {"messages": 20},
        }

        self.checkpointer = InMemorySaver()

        # System Prompt
        system_prompt = (
            "You are a helpful tourist guide assistant for Thailand. "
            "You have access to a knowledge base about Thailand tourism via the 'memvid_ask' tool. "
            "You MUST use 'memvid_ask' to retrieve information before answering any questions about "
            "Thailand places, culture, or travel advice. "
            "Do not answer from your own internal knowledge if the information might be in the knowledge base.\n\n"
            "Response Guidelines:\n"
            "1. Be concise but include enough persuasive detail to spark the tourist's interest.\n"
            "2. At the very end of your response, you MUST include the relevant source pages in a JSON block.\n"
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

        # Create the ReAct Agent using LangGraph
        self.agent = create_agent(
            self.llm,
            self.tools,
            checkpointer=self.checkpointer,
            system_prompt=system_prompt,
            middleware=[
                state_aware_prompt,
            ],
        )

        # Default configuration for the session
        # self.config = {"configurable": {"thread_id": "default_user"}}

    def chat(self, user_input: str, session_id: str = "default_user"):
        """
        Sends a message to the agent and returns the response.
        Uses ConsoleCallbackHandler to visualize tool calls and streaming.
        """
        print(f"\n--- Debug: Agent Trace (Session: {session_id}) ---")

        # Prepare the input state
        inputs = {"messages": [("user", user_input)]}

        try:
            response = self.agent.invoke(
                inputs,  # pyright: ignore[reportArgumentType]
                config={
                    "configurable": {"thread_id": session_id},
                    "callbacks": [StdOutCallbackHandler()],
                },  # pyright: ignore[reportArgumentType]
            )

            print("--- End Debug ---\n")

            # Extract the final response message
            if response and "messages" in response and response["messages"]:
                content = response["messages"][-1].content

                if isinstance(content, list):
                    text_parts = []
                    for part in content:
                        if isinstance(part, dict) and "text" in part:
                            text_parts.append(part["text"])
                    return "\n".join(text_parts)

                return content
            return "Sorry, I couldn't generate a response."

        except Exception as e:
            print(f"Error during execution: {e}")
            return f"An error occurred: {str(e)}"
