from app.chatbot.llm import TouristGuideAgent
import os


def main():
    print("Initializing Tourist Guide Agent...")

    mem_path = "app/mem/thai_guide.mv2"

    if not os.path.exists(mem_path):
        print(f"Error: Database not found at {mem_path}")
        print(
            "Please run 'python app/mem/build_mem.py' first if you haven't built the DB."
        )

    try:
        agent = TouristGuideAgent(memory_path=mem_path)
        print("Welcome to the Thailand Tourist Guide! (Type 'exit' or 'quit' to stop)")
        print("-" * 10)

        while True:
            try:
                user_input = input("\nYou: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ["exit", "quit"]:
                    print("Goodbye! Have a nice trip.")
                    break

                response = agent.chat(user_input)
                print(f"Agent: {response}")

            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"\nAn error occurred: {e}")

    except Exception as e:
        print(f"Failed to initialize agent: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
