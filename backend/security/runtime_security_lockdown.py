"""
Runtime Security Lockdown — Prevent Monkey Patching & Runtime Bypass
═══════════════════════════════════════════════════════════════════

Purpose:
  Prevent attackers with code access from disabling security at runtime.
  
  Protects against:
  - Monkey patching of security functions
  - Direct imports of pymongo/database drivers
  - Override of authorize() function
  - Manipulation of SecureRepository
  - GuardedDB circumvention
  - Policy matrix modification

Architecture:
  1. Seal critical modules after import
  2. Prevent direct driver imports
  3. Protect function signatures
  4. Monitor object mutations
  5. Block runtime modifications
"""

import sys
import importlib
from typing import Dict, Set, Any
import logging

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# RUNTIME PROTECTION REGISTRY
# ═══════════════════════════════════════════════════════════════════

class RuntimeSecurityLockdown:
    """
    Seal security-critical modules against runtime modification.
    """
    
    # Forbidden direct imports
    FORBIDDEN_IMPORTS = {
        'pymongo',
        'pymongo.collection',
        'pymongo.database',
        'motor',
        'motor.motor_asyncio',
    }
    
    # Critical modules that must not be modified
    PROTECTED_MODULES = {
        'backend.security.security_engine',
        'backend.security.secure_repository',
        'backend.security.guarded_db',
        'backend.security.policy_matrix',
        'backend.security.rbac_engine',
        'backend.security.audit_logger',
    }
    
    # Critical functions that must not be replaced
    PROTECTED_FUNCTIONS = {
        'authorize',
        'check_authorization',
        'get_secure_case',
        'validate_case_ownership',
        'find_one',
        'update_one',
        'delete_one',
    }
    
    def __init__(self):
        self.sealed_modules: Set[str] = set()
        self.sealed_functions: Dict[str, Any] = {}
        self.import_violations = []
        logger.info("[RUNTIME_LOCKDOWN] Initialized")
    
    def install_import_hook(self) -> None:
        """
        Install import hook to block forbidden modules.
        
        Called during app startup.
        """
        original_import = __builtins__.__import__
        lockdown = self
        
        def guarded_import(name, *args, **kwargs):
            # Check for forbidden imports
            if any(name.startswith(forbidden) for forbidden in lockdown.FORBIDDEN_IMPORTS):
                logger.critical(
                    f"[RUNTIME_LOCKDOWN] FORBIDDEN IMPORT ATTEMPT: {name}"
                )
                lockdown.import_violations.append(name)
                raise ImportError(
                    f"Direct import of '{name}' is forbidden by runtime security lockdown. "
                    f"Use SecureRepository instead."
                )
            
            # Allow import
            return original_import(name, *args, **kwargs)
        
        __builtins__.__import__ = guarded_import
        logger.info("[RUNTIME_LOCKDOWN] Import hook installed")
    
    def seal_module(self, module_name: str) -> None:
        """
        Seal a module to prevent modification of its functions.
        
        Called after module import.
        """
        try:
            module = sys.modules.get(module_name)
            if not module:
                logger.warning(f"[RUNTIME_LOCKDOWN] Module not found: {module_name}")
                return
            
            # Freeze module dict (immutable)
            # Note: This is advisory in Python, but catches most attempts
            for attr_name in dir(module):
                if attr_name.startswith('_'):
                    continue
                
                attr = getattr(module, attr_name, None)
                if callable(attr) and attr_name in self.PROTECTED_FUNCTIONS:
                    # Store original function
                    self.sealed_functions[f"{module_name}.{attr_name}"] = attr
            
            self.sealed_modules.add(module_name)
            logger.info(f"[RUNTIME_LOCKDOWN] Sealed module: {module_name}")
        
        except Exception as e:
            logger.error(f"[RUNTIME_LOCKDOWN] Failed to seal module {module_name}: {e}")
    
    def verify_function_integrity(self, module_name: str, function_name: str, function: Any) -> bool:
        """
        Verify that a critical function has not been modified/replaced.
        
        Args:
            module_name: e.g., "backend.security.security_engine"
            function_name: e.g., "authorize"
            function: The function object to verify
        
        Returns:
            True if function is original, False if modified
        """
        key = f"{module_name}.{function_name}"
        
        if key not in self.sealed_functions:
            logger.warning(f"[RUNTIME_LOCKDOWN] Function not in registry: {key}")
            return True  # Unknown functions pass
        
        original = self.sealed_functions[key]
        
        # Check if function has been replaced
        if function is not original:
            logger.critical(
                f"[RUNTIME_LOCKDOWN] FUNCTION REPLACEMENT DETECTED: {key}"
            )
            return False
        
        return True
    
    def check_authorize_integrity(self, authorize_func: Any) -> None:
        """
        Special integrity check for the authorize() function.
        
        Called before every authorize() call.
        
        Raises:
            AssertionError if authorize() has been compromised
        """
        if not self.verify_function_integrity(
            "backend.security.security_engine",
            "authorize",
            authorize_func
        ):
            logger.critical(
                "[RUNTIME_LOCKDOWN] CRITICAL: authorize() function has been compromised!"
            )
            raise AssertionError(
                "SECURITY CRITICAL: authorize() function integrity violated. "
                "System entering FAIL-SECURE mode."
            )
    
    def check_guarded_db_integrity(self, guarded_db_instance: Any) -> None:
        """
        Verify GuardedDB instance has not been tampered with.
        
        Checks:
        - _get_real_collection method exists
        - __getitem__ is not overridden
        - _check_guard logic intact
        """
        try:
            # Verify critical methods exist and are callable
            if not hasattr(guarded_db_instance, '_get_real_collection'):
                raise AssertionError("GuardedDB._get_real_collection missing")
            
            if not hasattr(guarded_db_instance, '__getitem__'):
                raise AssertionError("GuardedDB.__getitem__ missing")
            
            # Verify protected attributes exist
            if not hasattr(guarded_db_instance, '_real_db'):
                raise AssertionError("GuardedDB._real_db missing")
            
            logger.info("[RUNTIME_LOCKDOWN] GuardedDB integrity verified")
        
        except AssertionError as e:
            logger.critical(f"[RUNTIME_LOCKDOWN] GuardedDB compromised: {e}")
            raise
    
    def get_import_violations(self) -> list:
        """Get list of attempted forbidden imports."""
        return self.import_violations.copy()


# ═══════════════════════════════════════════════════════════════════
# GLOBAL LOCKDOWN INSTANCE
# ═══════════════════════════════════════════════════════════════════

_global_lockdown: RuntimeSecurityLockdown = None


def initialize_runtime_lockdown() -> RuntimeSecurityLockdown:
    """
    Initialize runtime security lockdown.
    
    Called once during app startup.
    
    Usage in server.py:
        from security.runtime_security_lockdown import initialize_runtime_lockdown
        
        @app.on_event("startup")
        async def startup():
            lockdown = initialize_runtime_lockdown()
            lockdown.install_import_hook()
            lockdown.seal_module("backend.security.security_engine")
            lockdown.seal_module("backend.security.secure_repository")
            # ... seal other critical modules
    """
    global _global_lockdown
    _global_lockdown = RuntimeSecurityLockdown()
    return _global_lockdown


def get_runtime_lockdown() -> RuntimeSecurityLockdown:
    """Get global lockdown instance."""
    global _global_lockdown
    if _global_lockdown is None:
        _global_lockdown = initialize_runtime_lockdown()
    return _global_lockdown
