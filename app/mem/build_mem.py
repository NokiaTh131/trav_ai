import fitz  # PyMuPDF
from pathlib import Path
from memvid_sdk import use
from memvid_sdk.entities import get_entity_extractor
from dotenv import load_dotenv

load_dotenv()

# Config
PROVIDER = "local"  # Use Local DistilBERT to keep RPM at 0
DATASET_DIR = Path("app/mem/")
OUTPUT_PATH = "app/mem/thai_guide.mv2"

# 1. Initialize
ner = get_entity_extractor(PROVIDER)
mem = use("langchain", OUTPUT_PATH, mode="auto")
mem.enable_lex()
mem.enable_vec()

pdf_files = list(DATASET_DIR.glob("*.pdf"))

for pdf_path in pdf_files:
    print(f"\nOpening: {pdf_path.name}")

    with fitz.open(pdf_path) as doc:
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text").strip()  # pyright: ignore[reportAttributeAccessIssue]

            if not page_text:
                continue

            # 2. Extract Entities for THIS PAGE ONLY
            # This makes the metadata highly specific to the content of this page
            entities = ner.extract(page_text, min_confidence=0.5)

            locations = list(
                set([e["name"] for e in entities if e["type"] == "LOCATION"])
            )
            misc = list(set([e["name"] for e in entities if e["type"] == "MISC"]))
            persons = list(set([e["name"] for e in entities if e["type"] == "PERSON"]))
            organizations = list(
                set([e["name"] for e in entities if e["type"] == "ORG"])
            )

            # 3. Store as an individual frame
            frame_id = mem.put(
                title=f"{pdf_path.stem} - Page {page_num + 1}",
                label="knowledge",
                text=page_text,
                metadata={
                    "source_file": pdf_path.name,
                    "page_number": page_num + 1,
                    "locations": locations,
                    "persons": persons,
                    "misc": misc,
                    "organizations": organizations,
                },
            )

            print(
                f"  Page {page_num + 1} stored (Frame: {frame_id}) | Found: {len(locations)} locs, {len(misc)} misc, {len(persons)} persons, {len(organizations)} orgs"
            )

mem.seal()
print("\n Mem built successfully.")
