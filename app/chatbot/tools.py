from langchain_mcp_adapters.client import MultiServerMCPClient

mcp_client = MultiServerMCPClient(
    # {
    #     "sequential-thinking": {
    #         "transport": "stdio",
    #         "command": "npx",
    #         "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    #     }
    # }
)
