/**
 * MIGRATION: AI Security Hardening
 * Purpose: Add indexes for AI sessions, usage, and security logging
 * Created: 2026-07-07
 * 
 * BLOQUEADOR 4: Database Indexes
 * 
 * This migration creates the necessary indexes for production-ready AI functionality:
 * 1. ai_sessions indexes (fast lookups by session_id, user_id, tenant_id)
 * 2. ai_usage indexes (rate limiting and usage tracking)
 * 3. Security logging indexes (SOC events, rate limit logs)
 * 
 * IMPORTANT: Do NOT execute in production without testing in staging first.
 * 
 * Usage:
 *   mongosh < 001_ai_security_hardening.js
 * 
 * Or in Node.js:
 *   const { MongoClient } = require('mongodb');
 *   const client = new MongoClient(process.env.MONGO_URL);
 *   const db = client.db(process.env.DB_NAME || 'puntocero_legal');
 *   await db.collection('ai_sessions').createIndex({ session_id: 1 });
 *   ... (see lines below)
 */

// Connect to database
use('puntocero_legal');

console.log('========================================');
console.log('MIGRATION: AI Security Hardening');
console.log('========================================');

// ===== ai_sessions collection indexes =====
console.log('Creating indexes for ai_sessions collection...');

// BLOQUEADOR 4: Index for session lookup by session_id
db.ai_sessions.createIndex(
  { session_id: 1 },
  { name: "idx_session_id", unique: false }
);
console.log('✓ Created index on ai_sessions.session_id');

// BLOQUEADOR 2: Index for user-based session queries
db.ai_sessions.createIndex(
  { owner_user_id: 1, tenant_id: 1 },
  { name: "idx_owner_tenant", unique: false }
);
console.log('✓ Created index on ai_sessions(owner_user_id, tenant_id)');

// BLOQUEADOR 2: Index for tenant isolation
db.ai_sessions.createIndex(
  { tenant_id: 1, updated_at: -1 },
  { name: "idx_tenant_updated", unique: false }
);
console.log('✓ Created index on ai_sessions(tenant_id, updated_at)');

// BLOQUEADOR 5: Index for race condition prevention (compound key)
db.ai_sessions.createIndex(
  { session_id: 1, owner_user_id: 1 },
  { name: "idx_session_owner", unique: false }
);
console.log('✓ Created index on ai_sessions(session_id, owner_user_id)');

// ===== ai_usage collection indexes =====
console.log('Creating indexes for ai_usage collection...');

// BLOQUEADOR 3: Index for rate limiting lookups
db.ai_usage.createIndex(
  { user_id: 1, period: 1 },
  { name: "idx_user_period", unique: true }
);
console.log('✓ Created UNIQUE index on ai_usage(user_id, period)');

// BLOQUEADOR 2: Index for tenant-based usage tracking
db.ai_usage.createIndex(
  { tenant_id: 1, period: 1 },
  { name: "idx_tenant_period", unique: false }
);
console.log('✓ Created index on ai_usage(tenant_id, period)');

// ===== rate_limit_logs collection indexes =====
console.log('Creating indexes for rate_limit_logs collection...');

db.rate_limit_logs.createIndex(
  { user_id: 1, timestamp: -1 },
  { name: "idx_user_timestamp", unique: false }
);
console.log('✓ Created index on rate_limit_logs(user_id, timestamp)');

db.rate_limit_logs.createIndex(
  { tenant_id: 1, severity: 1 },
  { name: "idx_tenant_severity", unique: false }
);
console.log('✓ Created index on rate_limit_logs(tenant_id, severity)');

// ===== soc_events collection indexes =====
console.log('Creating indexes for soc_events collection...');

db.soc_events.createIndex(
  { user_id: 1, timestamp: -1 },
  { name: "idx_soc_user_timestamp", unique: false }
);
console.log('✓ Created index on soc_events(user_id, timestamp)');

db.soc_events.createIndex(
  { event_type: 1, severity: 1 },
  { name: "idx_soc_type_severity", unique: false }
);
console.log('✓ Created index on soc_events(event_type, severity)');

// ===== ai_conversation_logs collection indexes =====
console.log('Creating indexes for ai_conversation_logs collection...');

db.ai_conversation_logs.createIndex(
  { user_id: 1, timestamp: -1 },
  { name: "idx_conv_user_timestamp", unique: false }
);
console.log('✓ Created index on ai_conversation_logs(user_id, timestamp)');

db.ai_conversation_logs.createIndex(
  { tenant_id: 1, timestamp: -1 },
  { name: "idx_conv_tenant_timestamp", unique: false }
);
console.log('✓ Created index on ai_conversation_logs(tenant_id, timestamp)');

// ===== Verify indexes were created =====
console.log('\n========================================');
console.log('Verifying indexes...');
console.log('========================================\n');

console.log('Indexes in ai_sessions:');
db.ai_sessions.getIndexes().forEach(idx => console.log('  -', idx.name));

console.log('\nIndexes in ai_usage:');
db.ai_usage.getIndexes().forEach(idx => console.log('  -', idx.name));

console.log('\nIndexes in rate_limit_logs:');
db.rate_limit_logs.getIndexes().forEach(idx => console.log('  -', idx.name));

console.log('\nIndexes in soc_events:');
db.soc_events.getIndexes().forEach(idx => console.log('  -', idx.name));

console.log('\nIndexes in ai_conversation_logs:');
db.ai_conversation_logs.getIndexes().forEach(idx => console.log('  -', idx.name));

console.log('\n========================================');
console.log('✓ MIGRATION COMPLETE');
console.log('========================================\n');
