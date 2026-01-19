**Travai** is Thailand tourist guide agent with blazing fast RAG query. 

![Langchain](https://img.shields.io/badge/langchain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![FastAPI](https://img.shields.io/badge/fastapi-109989?style=for-the-badge&logo=FASTAPI&logoColor=white)
![Sqlite](https://img.shields.io/badge/Sqlite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MIT](https://img.shields.io/badge/MIT-green?style=for-the-badge)

*this is an experimental project designed to demonstrate the power of **[memvid](https://github.com/memvid/memvid)** when integrated with **LangChain**.*

<img width="1919" height="940" alt="screenshot-travai" src="https://github.com/user-attachments/assets/5b9b590f-b174-4b74-b0ae-bcbce66b24c7" />

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

## Installation

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
   Create a `.env` file in the root directory look templete at `.env.example`

## Usage

### 1. Build the Memory

```bash
python app/mem/build_mem.py
```
*Note: This processes PDFs located in `app/mem/`.*

### 2. Run the Chatbot Server

```bash
uv run -m app.server
```
### 3. Run the UI

```bash
npm run dev
```

## Project Structure

```text
travai/
├── app/
│   ├── server.py        # FastAPI server
│   │           
│   ├── chatbot/
│   │   └── llm.py        # Agent definition, LangGraph setup, and System Prompt
│   └── mem/
│       ├── build_mem.py  # Ingestion script: PDF parsing + NER + Memvid storage
│       └── *.pdf         # Source documents
├── langgraph.json        # LangGraph configuration
└── pyproject.toml        # Project dependencies
```
