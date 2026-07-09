"""
Conversation agents interface and implementations
"""

from .base_agent import BaseAgent
from .commercial_agent import CommercialAgent
from .lawyer_agent import LawyerAgent
from .firm_agent import FirmAgent
from .support_agent import SupportAgent
from .client_agent import ClientAgent

__all__ = [
    "BaseAgent",
    "CommercialAgent",
    "LawyerAgent",
    "FirmAgent",
    "SupportAgent",
    "ClientAgent"
]
