from functools import partial

from langchain_core.messages import AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from .state import BookingAgentState


async def agent_node(state: BookingAgentState, llm, tools) -> dict:
    response = await llm.bind_tools(tools).ainvoke(state["messages"])
    return {"messages": [response]}


def route_from_agent(state: BookingAgentState) -> str:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return END


def build_booking_graph(tools: list, checkpointer):
    from langchain_google_genai import ChatGoogleGenerativeAI
    from config import get_settings

    settings = get_settings()
    from langchain_groq import ChatGroq
    agent_llm = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct",api_key=settings.groq_api_key, temperature=0.2)

    tools_node = ToolNode(tools)

    graph = StateGraph(BookingAgentState)
    graph.add_node("agent", partial(agent_node, llm=llm, tools=tools))
    graph.add_node("tools", tools_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", route_from_agent, {
        "tools": "tools",
        END: END,
    })
    graph.add_edge("tools", "agent")

    return graph.compile(checkpointer=checkpointer)
