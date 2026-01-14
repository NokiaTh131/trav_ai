from memvid_sdk import use
import pprint
import os

path = "app/mem/thai_guide.mv2"

if os.path.exists(path):
    mem = use("langchain", path)

    results = mem.find("Island in Pattaya", k=3)
    # pprint.pp([[h["title"], h["labels"]] for h in results["hits"]])  # pyright: ignore[reportTypedDictNotRequiredAccess]
    pprint.pp(results["hits"])
    pprint.pp(mem.timeline(limit=5))
