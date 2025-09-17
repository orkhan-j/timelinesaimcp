""
AI Agent Handlers Package
"""

# Import agent handlers to make them accessible when importing from agents package
from .agent1 import handle_agent1_request
from .agent2 import handle_agent2_request

__all__ = [
    'handle_agent1_request',
    'handle_agent2_request'
]
