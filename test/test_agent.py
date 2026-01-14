from app.chatbot.llm import TouristGuideAgent
import sys


def test_agent():
    print("Initializing Agent for Testing...")
    mem_path = "app/mem/thai_guide.mv2"

    try:
        agent = TouristGuideAgent(memory_path=mem_path)

        print(f"Tools available: {len(agent.tools)}")
        for t in agent.tools:
            print(f" - Name: {t.name}")
            print(f" - Description: {t.description}")

        question = "What are the top 3 places to visit in Bangkok?"
        print(f"Asking: {question}")

        response = agent.chat(question)
        print("\nFinal Response:")
        print(response)

    except Exception as e:
        print(f"Test failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_agent()
