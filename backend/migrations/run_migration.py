#!/usr/bin/env python3
"""
Migration Runner: AI Security Hardening
Purpose: Create MongoDB indexes for production AI functionality

BLOQUEADOR 4: Database Indexes

USAGE:
    python3 backend/migrations/run_migration.py

REQUIREMENTS:
    - MONGO_URL environment variable set
    - pymongo installed
    - Write permissions to MongoDB

SAFETY:
    - This script is idempotent (safe to run multiple times)
    - It only ADDS indexes, never drops or modifies existing ones
    - It validates indexes after creation
"""

import asyncio
import os
import sys
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase):
    """Create all necessary indexes for AI security hardening."""
    
    print("=" * 60)
    print("MIGRATION: AI Security Hardening")
    print("=" * 60)
    print()
    
    indexes_created = []
    indexes_failed = []
    
    # ===== ai_sessions indexes =====
    print("Creating indexes for ai_sessions collection...")
    
    try:
        await db.ai_sessions.create_index([("session_id", 1)])
        indexes_created.append("ai_sessions.session_id")
        print("  ✓ Created index on ai_sessions.session_id")
    except Exception as e:
        indexes_failed.append(f"ai_sessions.session_id: {e}")
        logger.error(f"Failed to create index on ai_sessions.session_id: {e}")
    
    try:
        await db.ai_sessions.create_index(
            [("owner_user_id", 1), ("tenant_id", 1)]
        )
        indexes_created.append("ai_sessions(owner_user_id, tenant_id)")
        print("  ✓ Created index on ai_sessions(owner_user_id, tenant_id)")
    except Exception as e:
        indexes_failed.append(f"ai_sessions(owner_user_id, tenant_id): {e}")
        logger.error(f"Failed: {e}")
    
    try:
        await db.ai_sessions.create_index(
            [("tenant_id", 1), ("updated_at", -1)]
        )
        indexes_created.append("ai_sessions(tenant_id, updated_at)")
        print("  ✓ Created index on ai_sessions(tenant_id, updated_at)")
    except Exception as e:
        indexes_failed.append(f"ai_sessions(tenant_id, updated_at): {e}")
        logger.error(f"Failed: {e}")
    
    try:
        await db.ai_sessions.create_index(
            [("session_id", 1), ("owner_user_id", 1)]
        )
        indexes_created.append("ai_sessions(session_id, owner_user_id)")
        print("  ✓ Created index on ai_sessions(session_id, owner_user_id)")
    except Exception as e:
        indexes_failed.append(f"ai_sessions(session_id, owner_user_id): {e}")
        logger.error(f"Failed: {e}")
    
    # ===== ai_usage indexes =====
    print("\nCreating indexes for ai_usage collection...")
    
    try:
        await db.ai_usage.create_index(
            [("user_id", 1), ("period", 1)],
            unique=True
        )
        indexes_created.append("ai_usage(user_id, period) [UNIQUE]")
        print("  ✓ Created UNIQUE index on ai_usage(user_id, period)")
    except Exception as e:
        if "already exists" in str(e):
            indexes_created.append("ai_usage(user_id, period) [UNIQUE - already exists]")
            print("  ✓ Index ai_usage(user_id, period) already exists")
        else:
            indexes_failed.append(f"ai_usage(user_id, period): {e}")
            logger.error(f"Failed: {e}")
    
    try:
        await db.ai_usage.create_index(
            [("tenant_id", 1), ("period", 1)]
        )
        indexes_created.append("ai_usage(tenant_id, period)")
        print("  ✓ Created index on ai_usage(tenant_id, period)")
    except Exception as e:
        indexes_failed.append(f"ai_usage(tenant_id, period): {e}")
        logger.error(f"Failed: {e}")
    
    # ===== rate_limit_logs indexes =====
    print("\nCreating indexes for rate_limit_logs collection...")
    
    try:
        await db.rate_limit_logs.create_index(
            [("user_id", 1), ("timestamp", -1)]
        )
        indexes_created.append("rate_limit_logs(user_id, timestamp)")
        print("  ✓ Created index on rate_limit_logs(user_id, timestamp)")
    except Exception as e:
        indexes_failed.append(f"rate_limit_logs(user_id, timestamp): {e}")
        logger.error(f"Failed: {e}")
    
    try:
        await db.rate_limit_logs.create_index(
            [("tenant_id", 1), ("severity", 1)]
        )
        indexes_created.append("rate_limit_logs(tenant_id, severity)")
        print("  ✓ Created index on rate_limit_logs(tenant_id, severity)")
    except Exception as e:
        indexes_failed.append(f"rate_limit_logs(tenant_id, severity): {e}")
        logger.error(f"Failed: {e}")
    
    # ===== soc_events indexes =====
    print("\nCreating indexes for soc_events collection...")
    
    try:
        await db.soc_events.create_index(
            [("user_id", 1), ("timestamp", -1)]
        )
        indexes_created.append("soc_events(user_id, timestamp)")
        print("  ✓ Created index on soc_events(user_id, timestamp)")
    except Exception as e:
        indexes_failed.append(f"soc_events(user_id, timestamp): {e}")
        logger.error(f"Failed: {e}")
    
    try:
        await db.soc_events.create_index(
            [("event_type", 1), ("severity", 1)]
        )
        indexes_created.append("soc_events(event_type, severity)")
        print("  ✓ Created index on soc_events(event_type, severity)")
    except Exception as e:
        indexes_failed.append(f"soc_events(event_type, severity): {e}")
        logger.error(f"Failed: {e}")
    
    # ===== ai_conversation_logs indexes =====
    print("\nCreating indexes for ai_conversation_logs collection...")
    
    try:
        await db.ai_conversation_logs.create_index(
            [("user_id", 1), ("timestamp", -1)]
        )
        indexes_created.append("ai_conversation_logs(user_id, timestamp)")
        print("  ✓ Created index on ai_conversation_logs(user_id, timestamp)")
    except Exception as e:
        indexes_failed.append(f"ai_conversation_logs(user_id, timestamp): {e}")
        logger.error(f"Failed: {e}")
    
    try:
        await db.ai_conversation_logs.create_index(
            [("tenant_id", 1), ("timestamp", -1)]
        )
        indexes_created.append("ai_conversation_logs(tenant_id, timestamp)")
        print("  ✓ Created index on ai_conversation_logs(tenant_id, timestamp)")
    except Exception as e:
        indexes_failed.append(f"ai_conversation_logs(tenant_id, timestamp): {e}")
        logger.error(f"Failed: {e}")
    
    # ===== Summary =====
    print("\n" + "=" * 60)
    print("MIGRATION RESULTS")
    print("=" * 60)
    print(f"\n✓ Indexes created: {len(indexes_created)}")
    for idx in indexes_created:
        print(f"  • {idx}")
    
    if indexes_failed:
        print(f"\n✗ Indexes failed: {len(indexes_failed)}")
        for idx in indexes_failed:
            print(f"  • {idx}")
        print("\nWARNING: Some indexes failed to create.")
        print("Please check the error messages above and retry if necessary.")
        return False
    else:
        print("\n" + "=" * 60)
        print("✓ MIGRATION COMPLETE - ALL INDEXES CREATED")
        print("=" * 60)
        return True


async def verify_indexes(db: AsyncIOMotorDatabase):
    """Verify that all indexes were created successfully."""
    
    print("\n" + "=" * 60)
    print("VERIFYING INDEXES")
    print("=" * 60 + "\n")
    
    collections = [
        "ai_sessions",
        "ai_usage",
        "rate_limit_logs",
        "soc_events",
        "ai_conversation_logs"
    ]
    
    for collection_name in collections:
        collection = db[collection_name]
        try:
            indexes = await collection.list_indexes().to_list(None)
            print(f"Indexes in {collection_name}:")
            for idx in indexes:
                print(f"  • {idx['name']}")
            print()
        except Exception as e:
            logger.error(f"Failed to list indexes for {collection_name}: {e}")


async def main():
    """Main migration runner."""
    
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "puntocero_legal")
    
    print(f"Connecting to MongoDB: {mongo_url}")
    print(f"Database: {db_name}\n")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        # Test connection
        await db.command("ping")
        print("✓ Connected to MongoDB\n")
        
        # Create indexes
        success = await create_indexes(db)
        
        # Verify indexes
        await verify_indexes(db)
        
        if not success:
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
