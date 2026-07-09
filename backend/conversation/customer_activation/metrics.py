"""
CONVERSATION METRICS
Measures performance of conversations and activations.

Metrics Tracked:
- First response time
- Total conversation time
- Open conversations
- Closed conversations
- Conversion rate
- Abandonment rate
- Transfer count
- Sales generated
- Cases created
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from enum import Enum


class MetricType(str, Enum):
    """Types of metrics tracked."""
    RESPONSE_TIME = "response_time"
    CONVERSATION_DURATION = "conversation_duration"
    CONVERSION = "conversion"
    ABANDONMENT = "abandonment"
    TRANSFER = "transfer"
    CASE_CREATION = "case_creation"
    SALES = "sales"
    ESCALATION = "escalation"


@dataclass
class ConversationMetrics:
    """Metrics for a single conversation."""
    conversation_id: str
    created_at: datetime
    channel: str
    
    # Timing
    first_response_time: Optional[float] = None  # seconds
    total_duration: Optional[float] = None  # seconds
    activation_time: Optional[float] = None  # milliseconds
    classification_time: Optional[float] = None  # milliseconds
    
    # Status
    is_open: bool = True
    closed_at: Optional[datetime] = None
    
    # Outcomes
    converted: bool = False
    abandoned: bool = False
    transferred: bool = False
    case_created: bool = False
    opportunity_created: bool = False
    sales_generated: float = 0.0
    
    # Quality
    darwin_routed: bool = False
    escalated: bool = False
    escalation_count: int = 0
    
    # Additional tracking
    notes: Dict[str, Any] = field(default_factory=dict)
    
    def duration_in_seconds(self) -> Optional[float]:
        """Calculate total duration if closed."""
        if self.closed_at:
            return (self.closed_at - self.created_at).total_seconds()
        return None


@dataclass
class AggregatedMetrics:
    """Aggregated metrics for a time period or group."""
    period_start: datetime
    period_end: datetime
    
    # Counts
    total_conversations: int = 0
    open_conversations: int = 0
    closed_conversations: int = 0
    
    # Averages
    avg_response_time: float = 0.0
    avg_conversation_duration: float = 0.0
    avg_activation_time: float = 0.0
    
    # Rates
    conversion_rate: float = 0.0
    abandonment_rate: float = 0.0
    escalation_rate: float = 0.0
    
    # Outcomes
    total_sales: float = 0.0
    total_cases_created: int = 0
    total_opportunities: int = 0
    total_transfers: int = 0
    
    # Breakdown
    by_channel: Dict[str, int] = field(default_factory=dict)
    by_profile: Dict[str, int] = field(default_factory=dict)
    by_intent: Dict[str, int] = field(default_factory=dict)


class MetricsCollector:
    """
    Collects and analyzes conversation metrics.
    
    Tracks performance across all conversations.
    Identifies trends and bottlenecks.
    """
    
    def __init__(self):
        """Initialize metrics collection."""
        self.conversations: Dict[str, ConversationMetrics] = {}
        self.historical_data: List[ConversationMetrics] = []
    
    def start_conversation(
        self,
        conversation_id: str,
        channel: str
    ) -> ConversationMetrics:
        """Record start of new conversation."""
        metrics = ConversationMetrics(
            conversation_id=conversation_id,
            created_at=datetime.now(),
            channel=channel
        )
        self.conversations[conversation_id] = metrics
        return metrics
    
    def record_first_response(self, conversation_id: str, response_time: float):
        """Record first response time (in seconds)."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].first_response_time = response_time
    
    def record_activation(self, conversation_id: str, activation_time: float):
        """Record activation processing time (in milliseconds)."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].activation_time = activation_time
    
    def record_conversion(self, conversation_id: str, sales_amount: float = 0.0):
        """Record conversation resulted in conversion."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].converted = True
            self.conversations[conversation_id].sales_generated = sales_amount
    
    def record_abandonment(self, conversation_id: str):
        """Record conversation was abandoned."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].abandoned = True
    
    def record_case_created(self, conversation_id: str):
        """Record case was created from conversation."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].case_created = True
    
    def record_escalation(self, conversation_id: str):
        """Record escalation occurred."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].escalated = True
            self.conversations[conversation_id].escalation_count += 1
    
    def record_transfer(self, conversation_id: str):
        """Record conversation was transferred."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].transferred = True
    
    def record_darwin_routed(self, conversation_id: str):
        """Record conversation routed to Darwin."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id].darwin_routed = True
    
    def close_conversation(self, conversation_id: str):
        """Record conversation as closed."""
        if conversation_id in self.conversations:
            metrics = self.conversations[conversation_id]
            metrics.is_open = False
            metrics.closed_at = datetime.now()
            metrics.total_duration = (metrics.closed_at - metrics.created_at).total_seconds()
            
            # Move to historical
            self.historical_data.append(metrics)
            del self.conversations[conversation_id]
    
    def get_metrics(self, conversation_id: str) -> Optional[ConversationMetrics]:
        """Get metrics for a specific conversation."""
        return self.conversations.get(conversation_id)
    
    def get_aggregated(
        self,
        period_days: int = 7,
        channel: Optional[str] = None,
        profile: Optional[str] = None
    ) -> AggregatedMetrics:
        """
        Get aggregated metrics for a time period.
        
        Can filter by channel or customer profile.
        """
        cutoff_date = datetime.now() - timedelta(days=period_days)
        
        # Filter conversations
        relevant = [
            m for m in self.historical_data
            if m.created_at >= cutoff_date and
            (channel is None or m.channel == channel)
        ]
        
        if not relevant:
            return AggregatedMetrics(
                period_start=cutoff_date,
                period_end=datetime.now()
            )
        
        # Calculate aggregates
        total_conversations = len(relevant)
        closed = [m for m in relevant if not m.is_open]
        
        response_times = [m.first_response_time for m in relevant if m.first_response_time]
        durations = [m.total_duration for m in relevant if m.total_duration]
        
        converted = len([m for m in relevant if m.converted])
        abandoned = len([m for m in relevant if m.abandoned])
        escalated = len([m for m in relevant if m.escalated])
        
        return AggregatedMetrics(
            period_start=cutoff_date,
            period_end=datetime.now(),
            total_conversations=total_conversations,
            closed_conversations=len(closed),
            open_conversations=len([m for m in self.conversations.values()]),
            avg_response_time=sum(response_times) / len(response_times) if response_times else 0,
            avg_conversation_duration=sum(durations) / len(durations) if durations else 0,
            conversion_rate=converted / total_conversations if total_conversations > 0 else 0,
            abandonment_rate=abandoned / total_conversations if total_conversations > 0 else 0,
            escalation_rate=escalated / total_conversations if total_conversations > 0 else 0,
            total_sales=sum(m.sales_generated for m in relevant),
            total_cases_created=len([m for m in relevant if m.case_created]),
            total_opportunities=len([m for m in relevant if m.opportunity_created]),
            total_transfers=len([m for m in relevant if m.transferred]),
        )


# Backward compatibility: No impact on existing systems
