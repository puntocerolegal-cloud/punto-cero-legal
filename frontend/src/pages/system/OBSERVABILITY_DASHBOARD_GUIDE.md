# Observability Dashboard Guide

## Location
**URL:** `/admin/observability`  
**Navigation:** Admin Sidebar → Sistema → Observability

## Data Source
All data is read from `window.__PC_OBSERVABILITY__`, an in-memory event store populated by:
- `requestLogger` — tracks all HTTP requests
- `errorClassifier` — classifies errors by type/severity
- `errorAggregator` — groups errors by fingerprint

## Features

### 1. Real-Time Summary Metrics
- **Total Requests** — cumulative count of all logged requests
- **Success Rate** — percentage of successful requests
- **Avg Response Time** — average duration across all endpoints
- **Total Errors** — count of failed requests

### 2. Recent Requests Table
Displays the latest 50 requests with:
- **Time** — when the request was made
- **Method** — HTTP method (GET, POST, etc.)
- **Endpoint** — API path
- **Status** — HTTP status code (color-coded)
- **Duration** — response time in milliseconds
- **Tenant** — tenant ID (if multi-tenant request)

### 3. Recent Errors Table
Shows the latest errors with:
- **Time** — when the error occurred
- **Type** — error classification (network, auth, validation, etc.)
- **Severity** — critical/high/medium/low
- **Message** — truncated error message (full on hover)
- **Endpoint** — API path that failed
- **Status** — HTTP status code

### 4. Performance Metrics
"Slowest Endpoints" section showing:
- **Endpoint** — API path
- **Avg Duration** — average response time (highlighted red if >1000ms)
- **Requests** — total calls to this endpoint
- **Error Rate** — percentage of failed requests

### 5. Active Tenants
Card-based list of tenants currently making requests:
- **Tenant ID** — unique tenant identifier
- **Events** — total events logged for this tenant
- **Errors** — count of failed requests (colored by severity)

## Controls

### Auto-Refresh Toggle
- **⏸ Auto** (off) — pause auto-refresh
- **▶ Auto** (on) — auto-refresh every 2 seconds

### Clear All Events
Clears the in-memory event store and resets the dashboard.

### Event Count
Shows current event count and maximum capacity (0–500).

## Filters

### Status Filter
- **All** — show all requests
- **Success** — show only successful requests
- **Error** — show only failed requests

### Endpoint Filter
Text search to filter requests by endpoint path.

### Tenant Filter
Dropdown to filter requests by tenant ID.

### Error Type Filter
Dropdown to filter by error classification:
- Network Error
- Auth Error
- Validation Error
- Not Found
- Conflict
- Server Error
- Rate Limit Error

## Visual Cues

### Status Codes
- **2xx (green)** — successful
- **4xx (red)** — client error
- **5xx (dark red)** — server error
- **429 (yellow)** — rate limited

### Severity Badges
- **Critical** (red) — requires immediate attention
- **High** (amber) — important to investigate
- **Medium** (blue) — worth monitoring
- **Low** (green) — informational

### Row Highlighting
- **Green rows** — successful requests
- **Red rows** — failed requests

## Data Limits

The event store maintains a **rolling window of 500 events** to prevent memory bloat.
Older events are automatically purged as new ones arrive.

## Debugging Tips

1. **Make a request** → The dashboard auto-populates when requests are made
2. **Monitor errors** → Watch the Recent Errors table for patterns
3. **Identify slow endpoints** → Check the Slowest Endpoints section
4. **Check tenant health** → Use Active Tenants to see error rates per tenant
5. **Use filters** → Narrow down to specific status codes, endpoints, or error types
6. **DevTools access** — Open console and call:
   - `window.__PC_OBSERVABILITY__.getLatest(n)` — get latest N events
   - `window.__PC_OBSERVABILITY__.getErrors()` — get all errors
   - `window.__PC_OBSERVABILITY__.getStats()` — get performance stats
   - `window.__PC_OBSERVABILITY__.getByTenant(tenantId)` — filter by tenant
   - `window.__PC_OBSERVABILITY__.clear()` — clear all events

## Implementation Details

### Event Store Capacity
- **Max Events:** 500 (sliding window)
- **Storage:** `window.__PC_OBSERVABILITY__`
- **Persistence:** In-memory only (clears on page reload)

### Request Events
```js
{
  requestId,        // UUID for correlation
  method,           // HTTP method
  url,              // API endpoint
  status,           // HTTP status code
  duration,         // milliseconds
  success,          // boolean
  timestamp,        // ISO 8601
  userId,           // from context
  tenantId,         // from context
  type: 'request:success' | 'request:error'
}
```

### Error Events
```js
{
  requestId,            // UUID correlation
  errorType,            // classification
  errorSeverity,        // critical|high|medium|low
  errorMessage,         // error text
  userFriendlyMessage,  // user-safe message
  isRetryable,          // can retry
  timestamp,            // ISO 8601
  userId,               // from context
  tenantId,             // from context
  type: 'request:error'
}
```

## Next Steps

### Backend Integration
- Export events to backend for long-term storage
- Set up alerts for high error rates
- Build dashboards in analytics platform

### Production Use
- Integrate with APM (DataDog, New Relic, etc.)
- Add custom metrics (business KPIs, etc.)
- Set up dashboard alerts

### Development
- Use for debugging during development
- Monitor performance in QA
- Correlate errors with user reports
