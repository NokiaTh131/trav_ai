from app.chatbot.llm import TouristGuideAgent
import sys


def test_multi_session():
    print("Initializing Agent for Multi-Session Testing...")
    mem_path = "app/mem/thai_guide.mv2"
    agent = TouristGuideAgent(memory_path=mem_path)

    # Session A interaction
    print("\n--- Session A: Setting name to Alice ---")
    agent.chat("My name is Alice. Please remember it.", session_id="session_A")

    # Session B interaction
    print("\n--- Session B: Setting name to Bob ---")
    agent.chat("My name is Bob. Please remember it.", session_id="session_B")

    # Verify Session A
    print("\n--- Verifying Session A ---")
    response_a = agent.chat("What is my name?", session_id="session_A")
    print(f"Session A Response: {response_a}")

    # Verify Session B
    print("\n--- Verifying Session B ---")
    response_b = agent.chat("What is my name?", session_id="session_B")
    print(f"Session B Response: {response_b}")

    # Simple check logic
    success = True
    if "Alice" not in response_a:
        print("Error: Session A did not recall 'Alice'")
        success = False

    if "Bob" not in response_b:
        print("Error: Session B did not recall 'Bob'")
        success = False

    if success:
        print("\nSUCCESS: Sessions are isolated.")
    else:
        print("\nFAILURE: Session isolation failed.")


if __name__ == "__main__":
    test_multi_session()
