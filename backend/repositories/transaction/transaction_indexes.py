"""
Transaction Repository Index Definitions
Comprehensive index configuration for transaction collection
"""

from typing import List, Dict, Any


class TransactionIndexes:
    """Index specifications for transactions collection"""

    # Required indexes following Golden Repository Template v1.0
    # Each index supports specific queries and maintains performance SLA

    @staticmethod
    def get_all_indexes() -> List[Dict[str, Any]]:
        """
        Returns all index specifications for transactions collection.
        
        Indexes are grouped by purpose:
        - Multi-tenant isolation
        - Query optimization
        - Unique constraints
        - Soft delete support
        - Workflow optimization
        
        Returns:
            List of index specifications
        """
        return [
            # ════════════════════════════════════════════════════════════════════
            # MULTI-TENANT ISOLATION (Primary)
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "firm_id_1",
                "spec": [("firm_id", 1)],
                "description": "Multi-tenant isolation (mandatory first field)"
            },

            # ════════════════════════════════════════════════════════════════════
            # UNIQUE CONSTRAINTS (Preserved from existing)
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "payment_id_unique",
                "spec": [("payment_id", 1)],
                "kwargs": {"unique": True},
                "description": "Unique payment identifier across all tenants"
            },

            # ════════════════════════════════════════════════════════════════════
            # COMPOUND INDEXES FOR MAIN QUERIES (Multi-tenant variants)
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "firm_id_user_email_1",
                "spec": [("firm_id", 1), ("user_email", 1)],
                "description": "Find transactions by tenant + user email"
            },
            {
                "name": "firm_id_payment_id_1",
                "spec": [("firm_id", 1), ("payment_id", 1)],
                "description": "Find transaction by tenant + payment_id"
            },
            {
                "name": "firm_id_status_1",
                "spec": [("firm_id", 1), ("status", 1)],
                "description": "Filter by tenant + status (reports)"
            },
            {
                "name": "firm_id_type_status_1",
                "spec": [("firm_id", 1), ("type", 1), ("status", 1)],
                "description": "Renewal automatics: filter by tenant + type + status"
            },
            {
                "name": "firm_id_referrer_id_status_1",
                "spec": [("firm_id", 1), ("referrer_id", 1), ("status", 1)],
                "description": "Referral rewards: paid transactions by tenant + referrer"
            },
            {
                "name": "firm_id_user_email_status_1",
                "spec": [("firm_id", 1), ("user_email", 1), ("status", 1)],
                "description": "Find last paid transaction by tenant + user + status"
            },
            {
                "name": "firm_id_user_email_plan_id_status_1",
                "spec": [("firm_id", 1), ("user_email", 1), ("plan_id", 1), ("status", 1)],
                "description": "Find last paid transaction by tenant + user + plan + status"
            },

            # ════════════════════════════════════════════════════════════════════
            # DATE-BASED QUERIES (For reporting and cleanup)
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "firm_id_created_at_1",
                "spec": [("firm_id", 1), ("created_at", -1)],
                "description": "Transactions by tenant, sorted by creation date (newest first)"
            },
            {
                "name": "status_created_at_1",
                "spec": [("status", 1), ("created_at", 1)],
                "description": "Old pending transactions (by creation date ascending, for retries)"
            },

            # ════════════════════════════════════════════════════════════════════
            # SOFT DELETE SUPPORT
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "firm_id_deleted_at_1",
                "spec": [("firm_id", 1), ("deleted_at", 1)],
                "kwargs": {"sparse": True},
                "description": "Find deleted transactions by tenant (sparse: only documents with deleted_at)"
            },

            # ════════════════════════════════════════════════════════════════════
            # INDIVIDUAL FIELD INDEXES (Backward compatibility)
            # ════════════════════════════════════════════════════════════════════
            {
                "name": "user_email_1",
                "spec": [("user_email", 1)],
                "description": "Find transactions by user email (preserved from existing)"
            },
            {
                "name": "plan_id_1",
                "spec": [("plan_id", 1)],
                "description": "Filter by plan (preserved from existing)"
            },
            {
                "name": "type_1",
                "spec": [("type", 1)],
                "description": "Filter by transaction type (preserved from existing)"
            },
        ]

    @staticmethod
    def get_index_by_name(name: str) -> Dict[str, Any]:
        """Get a specific index definition by name"""
        indexes = TransactionIndexes.get_all_indexes()
        for idx in indexes:
            if idx["name"] == name:
                return idx
        return None

    @staticmethod
    def get_critical_indexes() -> List[Dict[str, Any]]:
        """
        Get critical indexes that MUST exist for correctness
        (multi-tenant isolation, uniqueness)
        """
        return [
            idx for idx in TransactionIndexes.get_all_indexes()
            if "firm_id" in idx["spec"][0] or idx["name"] == "payment_id_unique"
        ]
