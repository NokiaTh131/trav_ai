from memvid_sdk import use
import pprint

path = "app/mem/thai_guide_v2.mv2"
mem = use("langchain", path, mode="open")

print("\n--- Available Tools ---")
if hasattr(mem, "tools"):
    tools = mem.tools if isinstance(mem.tools, list) else [mem.tools]
    for t in tools:
        print(f"Tool: {t.name} - {t.description}")

print("\n--- Searching for 'Pattaya' (Vector only check?) ---")
# Try to force vector search if possible, or just see if 'Pattaya' works
results = mem.find("Pattaya", k=3)
pprint.pp(results["hits"])

print("\n--- Searching for 'Places in Pattaya' ---")
results_places = mem.find("Places in Pattaya", k=3)
pprint.pp(results_places["hits"])
