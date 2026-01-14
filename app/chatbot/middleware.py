from langchain.agents.middleware import dynamic_prompt, ModelRequest


@dynamic_prompt
def state_aware_prompt(request: ModelRequest) -> str:
    message_count = len(request.messages)

    base = "You are a helpful assistant."

    if message_count > 10:
        base += "\nThis is a long conversation - be extra concise."

    return base
