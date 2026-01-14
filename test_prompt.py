from app.chatbot.llm import graph
from langchain_core.messages import HumanMessage
import sys

# Suppress other output
sys.stdout = open("/dev/stdout", "w")

print("--- Testing System Prompt Adherence ---")
inputs = {"messages": [HumanMessage(content="Hello, who are you?")]}

try:
    # Use invoke instead of stream for a simple final result check
    response = graph.invoke(inputs)
    final_message = response["messages"][-1].content
    print(f"\nFinal Response:\n{final_message}")

    if "BANANA" in final_message:
        print("\n[SUCCESS] System prompt is WORKING (BANANA found).")
    else:
        print("\n[FAILURE] System prompt seems IGNORED (BANANA not found).")

except Exception as e:
    print(f"Error: {e}")
