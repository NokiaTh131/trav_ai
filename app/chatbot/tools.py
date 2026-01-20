from langchain_mcp_adapters.client import MultiServerMCPClient

mcp_client = MultiServerMCPClient(
    {
        "ddg-search": {
            "transport": "stdio",
            "command": "uvx",
            "args": ["duckduckgo-mcp-server"],
        }
    }
)
