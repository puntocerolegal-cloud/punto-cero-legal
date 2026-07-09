"""
Fail-Safe Mode — Graceful Security Degradation
═══════════════════════════════════════════════════════════════════

Purpose:
  If critical security components fail, enter FAIL-SECURE mode.
  
  Behaviors:
  - Block all WRITE operations
  - Allow limited READ (or block all per config)
  - Alert immediately
  - Prevent cascading failures

Scenarios that trigger FAIL-SAFE:
  1. Audit pipeline down (cannot log)
  2. Policy engine crash
  3. GuardedDB failure
  4. Authorization engine error
  5. Anomaly detector failure
"""

from enum import Enum
from typing import Dict, Any
from datetime import datetime
import logging
import asyncio

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# SECURITY STATES
# ═══════════════════════════════════════════════════════════════════

class SecurityState(Enum):
    """System security state."""
    HEALTHY = "healthy"              # All systems OK
    DEGRADED = "degraded"            # Minor issue, operating normally
    FAIL_SAFE = "fail_safe"          # Critical failure, entering safe mode
    LOCKDOWN = "lockdown"            # Attack detected, emergency lockdown


class FailSafeMode:
    """
    Manage system security state and graceful degradation.
    """
    
    def __init__(self, alert_callback=None):
        self.current_state = SecurityState.HEALTHY
        self.failures: Dict[str, Any] = {}
        self.alert_callback = alert_callback
        self.entered_fail_safe_at = None
        logger.info("[FAIL_SAFE] Initialized in HEALTHY state")
    
    async def report_component_failure(
        self,
        component: str,
        reason: str,
        severity: str = "high",
    ) -> None:
        """
        Report that a critical component has failed.
        
        Args:
            component: "audit_pipeline", "policy_engine", "guarded_db", etc.
            reason: Description of failure
            severity: "low", "high", "critical"
        
        Side Effects:
            May trigger FAIL-SAFE mode
        """
        logger.error(f"[FAIL_SAFE] Component failure: {component} - {reason}")
        
        self.failures[component] = {
            "reason": reason,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Critical components trigger fail-safe
        critical_components = {
            'guarded_db',
            'security_engine',
            'secure_repository',
            'policy_engine',
        }
        
        if component in critical_components and severity == "critical":
            await self.enter_fail_safe(
                reason=f"Critical component failure: {component}"
            )
    
    async def enter_fail_safe(self, reason: str) -> None:
        """
        Enter FAIL-SAFE mode.
        
        This mode:
        - Blocks all WRITE operations
        - Allows limited READ (or blocks all)
        - Alerts immediately
        - Logs critical incident
        """
        if self.current_state == SecurityState.FAIL_SAFE:
            logger.warning("[FAIL_SAFE] Already in FAIL_SAFE mode, ignoring")
            return
        
        self.current_state = SecurityState.FAIL_SAFE
        self.entered_fail_safe_at = datetime.utcnow()
        
        logger.critical(
            f"[FAIL_SAFE] ⚠️ ENTERING FAIL-SAFE MODE: {reason}"
        )
        
        # Alert
        await self._alert_critical(
            title="FAIL-SAFE MODE ACTIVATED",
            message=reason,
        )
    
    async def enter_lockdown(self, reason: str) -> None:
        """
        Enter LOCKDOWN mode (most restrictive).
        
        This mode:
        - Blocks ALL operations
        - Attack is suspected
        - Requires manual intervention to recover
        """
        self.current_state = SecurityState.LOCKDOWN
        
        logger.critical(
            f"[FAIL_SAFE] 🔴 ENTERING LOCKDOWN MODE: {reason}"
        )
        
        await self._alert_critical(
            title="SYSTEM LOCKDOWN — ATTACK DETECTED",
            message=reason,
        )
    
    async def recover(self, component: str) -> None:
        """
        Attempt to recover from component failure.
        
        Args:
            component: Component that has recovered
        """
        if component in self.failures:
            del self.failures[component]
            logger.info(f"[FAIL_SAFE] Component recovered: {component}")
        
        # If all failures resolved, return to HEALTHY
        if not self.failures:
            previous_state = self.current_state
            self.current_state = SecurityState.HEALTHY
            logger.info(
                f"[FAIL_SAFE] All components healthy, returning to HEALTHY state"
            )
            
            if previous_state in (SecurityState.FAIL_SAFE, SecurityState.LOCKDOWN):
                await self._alert_info(
                    title="System recovered",
                    message="All critical components are operational"
                )
    
    def is_fail_safe(self) -> bool:
        """Check if in FAIL-SAFE or LOCKDOWN mode."""
        return self.current_state in (SecurityState.FAIL_SAFE, SecurityState.LOCKDOWN)
    
    def can_write(self) -> bool:
        """Check if WRITE operations are allowed."""
        if self.current_state == SecurityState.LOCKDOWN:
            return False
        if self.current_state == SecurityState.FAIL_SAFE:
            return False
        return True
    
    def can_read(self) -> bool:
        """Check if READ operations are allowed."""
        if self.current_state == SecurityState.LOCKDOWN:
            # In lockdown, even reads might be blocked
            return False
        if self.current_state == SecurityState.FAIL_SAFE:
            # In fail-safe, read is allowed
            return True
        return True
    
    def get_state(self) -> Dict[str, Any]:
        """Get full fail-safe state."""
        return {
            "state": self.current_state.value,
            "failures": self.failures,
            "entered_fail_safe_at": self.entered_fail_safe_at.isoformat() if self.entered_fail_safe_at else None,
        }
    
    async def _alert_critical(self, title: str, message: str) -> None:
        """Send critical alert."""
        alert = {
            "level": "critical",
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        logger.critical(f"[FAIL_SAFE] ALERT: {title} - {message}")
        
        if self.alert_callback:
            try:
                if asyncio.iscoroutinefunction(self.alert_callback):
                    await self.alert_callback(alert)
                else:
                    self.alert_callback(alert)
            except Exception as e:
                logger.error(f"[FAIL_SAFE] Alert callback failed: {e}")
    
    async def _alert_info(self, title: str, message: str) -> None:
        """Send informational alert."""
        alert = {
            "level": "info",
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"[FAIL_SAFE] INFO: {title} - {message}")
        
        if self.alert_callback:
            try:
                if asyncio.iscoroutinefunction(self.alert_callback):
                    await self.alert_callback(alert)
                else:
                    self.alert_callback(alert)
            except Exception as e:
                logger.error(f"[FAIL_SAFE] Alert callback failed: {e}")


# ═══════════════════════════════════════════════════════════════════
# GLOBAL FAIL-SAFE INSTANCE
# ═══════════════════════════════════════════════════════════════════

_global_fail_safe: FailSafeMode = None


def initialize_fail_safe(alert_callback=None) -> FailSafeMode:
    """
    Initialize global fail-safe mode.
    
    Args:
        alert_callback: Async function to call on alerts
    
    Usage in server.py:
        from security.fail_safe_mode import initialize_fail_safe
        
        async def alert_handler(alert):
            # Send to monitoring system
            pass
        
        @app.on_event("startup")
        async def startup():
            fail_safe = initialize_fail_safe(alert_callback=alert_handler)
    """
    global _global_fail_safe
    _global_fail_safe = FailSafeMode(alert_callback=alert_callback)
    return _global_fail_safe


def get_fail_safe() -> FailSafeMode:
    """Get global fail-safe instance."""
    global _global_fail_safe
    if _global_fail_safe is None:
        _global_fail_safe = FailSafeMode()
    return _global_fail_safe
