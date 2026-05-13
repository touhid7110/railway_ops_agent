# test_qwen2.5vl:7b.py

import base64
import httpx
import json
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

# ─── 1. Check if Ollama server is running ───────────────────────────────────
def check_ollama_running():
    try:
        httpx.get("http://localhost:11434", timeout=3)
        print("✅ Ollama server is running")
        return True
    except Exception:
        print("❌ Ollama server not running. Open the Ollama app or run `ollama serve`")
        return False

# ─── 2. Check if qwen2.5vl:7b model is pulled ──────────────────────────────────
def check_model_available():
    try:
        res = httpx.get("http://localhost:11434/api/tags", timeout=5)
        models = [m["name"] for m in res.json().get("models", [])]
        if any("qwen2.5vl:7b" in m for m in models):
            print(f"✅ qwen2.5vl:7b model found: {[m for m in models if 'qwen2.5vl:7b' in m]}")
            return True
        else:
            print("❌ qwen2.5vl:7b not found. Run: `ollama pull qwen2.5vl:7b`")
            print(f"   Available models: {models}")
            return False
    except Exception as e:
        print(f"❌ Could not fetch model list: {e}")
        return False

# ─── 3. Test text-only response ─────────────────────────────────────────────
def test_text():
    print("\n🧪 Test 1: Text-only prompt")
    llm = ChatOllama(model="qwen2.5vl:7b")
    response = llm.invoke("Say 'qwen2.5vl:7b is working!' in one sentence.")
    print(f"   Response: {response.content}")

# ─── 4. Test vision with a sample image ─────────────────────────────────────
def test_vision():
    print("\n🧪 Test 2: Vision / Multimodal prompt")
    img_url = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Blue-eyed_domestic_cat_%28Felis_silvestris_catus%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original"
    img_bytes = httpx.get(img_url).content
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")

    llm = ChatOllama(model="qwen2.5vl:7b")
    message = HumanMessage(
        content=[
            {"type": "text", "text": "What do you see in this image? Describe briefly."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
        ]
    )
    response = llm.invoke([message])
    print(f"   Response: {response.content}")

# ─── 5. Test tool calling ────────────────────────────────────────────────────
def test_tool_calling():
    print("\n🧪 Test 3: Tool Calling")

    # Define a simple dummy tool
    @tool
    def get_weather(city: str) -> str:
        """Get the current weather for a given city."""
        return f"The weather in {city} is 28°C and sunny."

    @tool
    def add_numbers(a: int, b: int) -> int:
        """Add two numbers together."""
        return a + b

    tools = [get_weather, add_numbers]

    try:
        llm = ChatOllama(model="qwen2.5vl:7b")
        llm_with_tools = llm.bind_tools(tools)

        response = llm_with_tools.invoke("What is the weather in Mumbai?")

        if response.tool_calls:
            print(f"   ✅ Tool call detected!")
            for tc in response.tool_calls:
                print(f"      Tool name : {tc['name']}")
                print(f"      Arguments : {tc['args']}")

            # Execute the tool and show result
            tool_map = {t.name: t for t in tools}
            for tc in response.tool_calls:
                result = tool_map[tc["name"]].invoke(tc["args"])
                print(f"      Tool result: {result}")
        else:
            print(f"   ⚠️  No tool call made. Model responded directly:")
            print(f"      {response.content}")
            print("   ℹ️  qwen2.5vl:7b is a tiny vision model — tool calling may not be supported.")
            print("   💡 Consider switching to `qwen2.5vl:7b` for full tool calling support.")

    except Exception as e:
        print(f"   ❌ Tool calling failed: {e}")
        print("   ℹ️  qwen2.5vl:7b does not natively support function/tool calling.")
        print("   💡 Switch to `qwen2.5vl:7b` or `llama3.2-vision` for tool calling in LangGraph.")

# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("   qwen2.5vl:7b + LangChain Health Check (with Tool Call)")
    print("=" * 55)

    if not check_ollama_running():
        exit(1)

    if not check_model_available():
        exit(1)

    test_text()
    test_vision()
    test_tool_calling()

    print("\n" + "=" * 55)
    print("   Health check complete!")
    print("=" * 55)