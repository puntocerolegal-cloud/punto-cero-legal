"""
METRICS COLLECTOR

Collects production metrics for monitoring and analytics.

Tracks:
- Conversation metrics (count, duration, etc)
- Response metrics (latency, quality)
- Conversion metrics (leads, cases, opportunities)
- Channel metrics (WhatsApp, landing, etc)
- Country metrics (geographic distribution)
- Performance metrics (system health)
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List
from collections import defaultdict


@dataclass
class ConversationMetric:
    """Single conversation metric"""
    conversation_id: str
    timestamp: datetime
    channel: str  # whatsapp, landing, etc
    profile: str  # client, lawyer, firm, etc
    intent: str  # sales, support, etc
    country: str
    language: str
    duration_seconds: float
    message_count: int
    response_time_ms: float
    was_escalated: bool
    led_to_lead: bool
    led_to_case: bool
    led_to_opportunity: bool
    estimated_value: float


@dataclass
class AggregatedMetrics:
    """Aggregated metrics for dashboard"""
    timestamp: datetime
    total_conversations: int
    total_leads: int
    total_cases: int
    total_opportunities: int
    avg_response_time_ms: float
    avg_conversation_duration: float
    escalation_rate: float  # % of conversations escalated
    conversion_rate: float  # % of conversations that became leads
    by_channel: Dict[str, int]
    by_country: Dict[str, int]
    by_profile: Dict[str, int]
    by_intent: Dict[str, int]


class MetricsCollector:
    """
    Collects and aggregates metrics for production monitoring.
    
    Minimal memory footprint, suitable for high-volume collection.
    Real-time data available, historical data stored to database.
    """
    
    def __init__(self):
        """Initialize metrics collector"""
        self.in_memory_metrics: List[ConversationMetric] = []
        self.aggregates = {
            "conversations": 0,
            "leads": 0,
            "cases": 0,
            "opportunities": 0,
            "escalations": 0,
            "by_channel": defaultdict(int),
            "by_country": defaultdict(int),
            "by_profile": defaultdict(int),
            "by_intent": defaultdict(int),
            "response_times": [],
            "durations": [],
        }
        self.mongodb = None  # Will be injected
    
    def record_conversation(
        self,
        conversation_id: str,
        channel: str,
        profile: str,
        intent: str,
        country: str,
        language: str,
        duration_seconds: float,
        message_count: int,
        response_time_ms: float,
        was_escalated: bool,
        led_to_lead: bool,
        led_to_case: bool,
        led_to_opportunity: bool,
        estimated_value: float = 0.0
    ) -> None:
        """
        Record a conversation metric.
        
        Called after each conversation completes.
        """
        
        metric = ConversationMetric(
            conversation_id=conversation_id,
            timestamp=datetime.now(),
            channel=channel,
            profile=profile,
            intent=intent,
            country=country,
            language=language,
            duration_seconds=duration_seconds,
            message_count=message_count,
            response_time_ms=response_time_ms,
            was_escalated=was_escalated,
            led_to_lead=led_to_lead,
            led_to_case=led_to_case,
            led_to_opportunity=led_to_opportunity,
            estimated_value=estimated_value
        )
        
        # Store in memory (for current session)
        self.in_memory_metrics.append(metric)
        
        # Update aggregates
        self.aggregates["conversations"] += 1
        if led_to_lead:
            self.aggregates["leads"] += 1
        if led_to_case:
            self.aggregates["cases"] += 1
        if led_to_opportunity:
            self.aggregates["opportunities"] += 1
        if was_escalated:
            self.aggregates["escalations"] += 1
        
        # By dimension
        self.aggregates["by_channel"][channel] += 1
        self.aggregates["by_country"][country] += 1
        self.aggregates["by_profile"][profile] += 1
        self.aggregates["by_intent"][intent] += 1
        
        # Timings
        self.aggregates["response_times"].append(response_time_ms)
        self.aggregates["durations"].append(duration_seconds)
        
        # Store to database
        try:
            if self.mongodb:
                self.mongodb.db.metrics.insert_one({
                    "conversation_id": conversation_id,
                    "timestamp": metric.timestamp.isoformat(),
                    "channel": channel,
                    "profile": profile,
                    "intent": intent,
                    "country": country,
                    "language": language,
                    "duration_seconds": duration_seconds,
                    "message_count": message_count,
                    "response_time_ms": response_time_ms,
                    "was_escalated": was_escalated,
                    "led_to_lead": led_to_lead,
                    "led_to_case": led_to_case,
                    "led_to_opportunity": led_to_opportunity,
                    "estimated_value": estimated_value,
                })
        except Exception:
            # Silently fail - don't break conversation on metrics error
            pass
    
    def get_current_aggregates(self) -> AggregatedMetrics:
        """Get current aggregated metrics"""
        
        response_times = self.aggregates["response_times"]
        durations = self.aggregates["durations"]
        
        avg_response_time = (
            sum(response_times) / len(response_times)
            if response_times else 0.0
        )
        
        avg_duration = (
            sum(durations) / len(durations)
            if durations else 0.0
        )
        
        total_convs = self.aggregates["conversations"]
        escalation_rate = (
            self.aggregates["escalations"] / total_convs
            if total_convs > 0 else 0.0
        )
        
        conversion_rate = (
            self.aggregates["leads"] / total_convs
            if total_convs > 0 else 0.0
        )
        
        return AggregatedMetrics(
            timestamp=datetime.now(),
            total_conversations=total_convs,
            total_leads=self.aggregates["leads"],
            total_cases=self.aggregates["cases"],
            total_opportunities=self.aggregates["opportunities"],
            avg_response_time_ms=avg_response_time,
            avg_conversation_duration=avg_duration,
            escalation_rate=escalation_rate,
            conversion_rate=conversion_rate,
            by_channel=dict(self.aggregates["by_channel"]),
            by_country=dict(self.aggregates["by_country"]),
            by_profile=dict(self.aggregates["by_profile"]),
            by_intent=dict(self.aggregates["by_intent"]),
        )
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get data formatted for admin dashboard"""
        
        aggregates = self.get_current_aggregates()
        
        return {
            "summary": {
                "total_conversations": aggregates.total_conversations,
                "total_leads": aggregates.total_leads,
                "conversion_rate": f"{aggregates.conversion_rate * 100:.1f}%",
                "escalation_rate": f"{aggregates.escalation_rate * 100:.1f}%",
            },
            "performance": {
                "avg_response_time_ms": f"{aggregates.avg_response_time_ms:.0f}ms",
                "avg_duration_seconds": f"{aggregates.avg_conversation_duration:.0f}s",
            },
            "by_channel": aggregates.by_channel,
            "by_country": aggregates.by_country,
            "by_profile": aggregates.by_profile,
            "by_intent": aggregates.by_intent,
            "funnel": {
                "conversations": aggregates.total_conversations,
                "leads": aggregates.total_leads,
                "cases": aggregates.total_cases,
                "opportunities": aggregates.total_opportunities,
            },
            "timestamp": aggregates.timestamp.isoformat(),
        }
    
    def clear_memory(self) -> None:
        """Clear in-memory metrics (called periodically)"""
        self.in_memory_metrics = []
    
    def reset_aggregates(self) -> None:
        """Reset aggregates for new period"""
        self.aggregates = {
            "conversations": 0,
            "leads": 0,
            "cases": 0,
            "opportunities": 0,
            "escalations": 0,
            "by_channel": defaultdict(int),
            "by_country": defaultdict(int),
            "by_profile": defaultdict(int),
            "by_intent": defaultdict(int),
            "response_times": [],
            "durations": [],
        }


# Singleton instance
_collector_instance = None

def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector instance"""
    global _collector_instance
    if _collector_instance is None:
        _collector_instance = MetricsCollector()
    return _collector_instance
