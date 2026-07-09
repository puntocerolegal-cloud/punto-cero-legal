"""
Security Feedback Loop — Adaptive System Learning
═══════════════════════════════════════════════════════════════════

Purpose:
  Learn from real outcomes and adjust security parameters.
  
  Captures:
  - False positives (blocked valid access)
  - False negatives (missed attacks)
  - Admin overrides (manual decisions)
  
  Adjusts:
  - Risk thresholds
  - Behavioral baselines
  - Attack detection sensitivity
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SecurityFeedbackLoop:
    """Learn from security outcomes and adjust models."""
    
    def __init__(self):
        self.decisions: List[Dict[str, Any]] = []
        self.false_positives = 0
        self.false_negatives = 0
        self.correct_blocks = 0
        self.correct_allows = 0
        logger.info("[FEEDBACK_LOOP] Initialized")
    
    def record_decision(
        self,
        user_id: str,
        event_id: str,
        decision: str,  # "allow", "block"
        actual_outcome: str,  # "benign", "malicious"
        confidence: float = 0.5,
    ) -> None:
        """
        Record a security decision and its actual outcome.
        
        Args:
            user_id: User ID
            event_id: Event ID
            decision: What we decided ("allow" or "block")
            actual_outcome: What actually happened ("benign" or "malicious")
            confidence: System confidence in decision (0-1)
        """
        
        is_correct = (
            (decision == "allow" and actual_outcome == "benign") or
            (decision == "block" and actual_outcome == "malicious")
        )
        
        is_false_positive = (decision == "block" and actual_outcome == "benign")
        is_false_negative = (decision == "allow" and actual_outcome == "malicious")
        
        # Update counters
        if is_correct and decision == "allow":
            self.correct_allows += 1
        elif is_correct and decision == "block":
            self.correct_blocks += 1
        elif is_false_positive:
            self.false_positives += 1
        elif is_false_negative:
            self.false_negatives += 1
        
        # Record decision
        record = {
            "user_id": user_id,
            "event_id": event_id,
            "decision": decision,
            "actual_outcome": actual_outcome,
            "is_correct": is_correct,
            "is_false_positive": is_false_positive,
            "is_false_negative": is_false_negative,
            "confidence": confidence,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        self.decisions.append(record)
        
        # Log concerning outcomes
        if is_false_negative:
            logger.critical(
                f"[FEEDBACK] FALSE NEGATIVE: allowed malicious activity "
                f"user={user_id} event={event_id}"
            )
        elif is_false_positive:
            logger.warning(
                f"[FEEDBACK] FALSE POSITIVE: blocked benign activity "
                f"user={user_id} event={event_id}"
            )
    
    def record_admin_override(
        self,
        user_id: str,
        event_id: str,
        system_decision: str,
        admin_decision: str,
        reason: str,
    ) -> None:
        """Record when admin overrides system decision."""
        logger.info(
            f"[FEEDBACK] Admin override: user={user_id} "
            f"system={system_decision} admin={admin_decision} "
            f"reason={reason}"
        )
        
        # This feedback should adjust models
        # If admin frequently overrides, adjust thresholds
    
    def get_accuracy_metrics(self) -> Dict[str, float]:
        """Get system accuracy metrics."""
        total = (
            self.correct_allows + self.correct_blocks +
            self.false_positives + self.false_negatives
        )
        
        if total == 0:
            return {"accuracy": 0.0}
        
        correct = self.correct_allows + self.correct_blocks
        accuracy = correct / total
        
        false_positive_rate = (
            self.false_positives / (self.false_positives + self.correct_allows)
            if (self.false_positives + self.correct_allows) > 0 else 0.0
        )
        
        false_negative_rate = (
            self.false_negatives / (self.false_negatives + self.correct_blocks)
            if (self.false_negatives + self.correct_blocks) > 0 else 0.0
        )
        
        return {
            "accuracy": accuracy,
            "false_positive_rate": false_positive_rate,
            "false_negative_rate": false_negative_rate,
            "correct_blocks": self.correct_blocks,
            "correct_allows": self.correct_allows,
            "false_positives": self.false_positives,
            "false_negatives": self.false_negatives,
        }
    
    def should_adjust_threshold(self) -> bool:
        """Determine if thresholds need adjustment."""
        metrics = self.get_accuracy_metrics()
        
        # Adjust if FPR > 5% or FNR > 5%
        return (
            metrics.get("false_positive_rate", 0) > 0.05 or
            metrics.get("false_negative_rate", 0) > 0.05
        )


def initialize_feedback_loop() -> SecurityFeedbackLoop:
    """Initialize global feedback loop."""
    return SecurityFeedbackLoop()


def get_feedback_loop() -> SecurityFeedbackLoop:
    """Get global feedback loop."""
    return SecurityFeedbackLoop()
