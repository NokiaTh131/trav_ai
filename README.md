# Travai 

**Travai** is an experimental project designed to demonstrate the power of **Memvid (OpenSource)** when integrated with **LangChain**.

The goal is to explore how Memvid can serve as an efficient knowledge retrieval layer for LLM agents. This specific implementation builds a **Thailand Tourist Guide** that strictly answers questions based on ingested PDF guidebooks, providing precise page citations.

## The Experiment
This project tests:
- **Memvid SDK Integration**: Using Memvid as a custom tool within LangGraph/LangChain.
- **Contextual Indexing**: Extracting entities (Locations, Organizations, Persons) from PDF pages to create rich metadata for Memvid frames before storage.
- **Strict RAG (Retrieval-Augmented Generation)**: Ensuring the LLM relies *only* on the retrieved context via `memvid_ask` and strictly cites its sources.

## Features
- **Grounded Answers**: The agent explicitly states if it doesn't know the answer based on the documents, preventing hallucinations.
- **Source Citations**: Every response includes a JSON block citing the specific source file and page number.
- **Entity-Aware Storage**: Data is indexed with local NER (Named Entity Recognition) for high-fidelity retrieval.

## 🛠️ Installation

### Prerequisites
- Python 3.12+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

### Setup

1. **Clone the repository**

2. **Install dependencies**:
   ```bash
   uv sync
   # or
   pip install .
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory with your LLM provider credentials (currently configured for Groq):
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

## Usage

### 1. Build the Memory
First, parse the PDF documents and build the Memvid index. This runs the entity extraction and stores the data in a `.mv2` file.

```bash
python app/mem/build_mem.py
```
*Note: This processes PDFs located in `app/mem/`.*

### 2. Run the Chatbot
Use the LangGraph CLI to start the agent server.

```bash
langgraph dev
```

## Project Structure

```text
travai/
├── app/
│   ├── chatbot/
│   │   └── llm.py        # Agent definition, LangGraph setup, and System Prompt
│   └── mem/
│       ├── build_mem.py  # Ingestion script: PDF parsing + NER + Memvid storage
│       └── *.pdf         # Source documents
├── langgraph.json        # LangGraph configuration
└── pyproject.toml        # Project dependencies
```
