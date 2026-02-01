# Phase 1 API Testing Guide

Quick reference for testing all Phase 1 endpoints using curl or Postman.

## 🔑 Authentication

First, get an auth token:
```bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hande.com",
    "password": "Hande2026!"
  }'
```

Save the token from response and use in all subsequent requests:
```bash
TOKEN="your_token_here"
```

---

## 👤 Rider Management APIs

### List All Riders
```bash
curl -X GET "http://localhost:8000/api/admin/riders?page=1&search=john&status=active" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Rider Statistics
```bash
curl -X GET "http://localhost:8000/api/admin/riders/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Rider Details
```bash
curl -X GET "http://localhost:8000/api/admin/riders/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Suspend Rider
```bash
curl -X PUT "http://localhost:8000/api/admin/riders/1/suspend" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Repeated policy violations"
  }'
```

### Ban Rider
```bash
curl -X PUT "http://localhost:8000/api/admin/riders/1/ban" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Fraudulent activity detected"
  }'
```

### Unban Rider
```bash
curl -X PUT "http://localhost:8000/api/admin/riders/1/unban" \
  -H "Authorization: Bearer $TOKEN"
```

### Process Refund
```bash
curl -X POST "http://localhost:8000/api/admin/riders/refund" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": 123,
    "amount": 15.50,
    "reason": "Driver cancelled after long wait"
  }'
```

---

## 🚗 Trip Management APIs

### List Trips
```bash
# Live trips
curl -X GET "http://localhost:8000/api/admin/trips?type=live" \
  -H "Authorization: Bearer $TOKEN"

# History
curl -X GET "http://localhost:8000/api/admin/trips?type=history&status=completed&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Live Map Data
```bash
curl -X GET "http://localhost:8000/api/admin/trips/live-map" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Trip Details
```bash
curl -X GET "http://localhost:8000/api/admin/trips/123" \
  -H "Authorization: Bearer $TOKEN"
```

### Cancel Trip
```bash
curl -X PUT "http://localhost:8000/api/admin/trips/123/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Driver unavailable, no alternative found"
  }'
```

### Refund Trip
```bash
curl -X POST "http://localhost:8000/api/admin/trips/123/refund" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Service not delivered as expected"
  }'
```

### Resolve Dispute
```bash
curl -X PUT "http://localhost:8000/api/admin/trips/123/dispute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Adjusted fare due to route change",
    "adjusted_fare": 12.00
  }'
```

### Update Trip Status
```bash
curl -X PUT "http://localhost:8000/api/admin/trips/123/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

## 🎧 Support Ticket APIs

### List Tickets
```bash
curl -X GET "http://localhost:8000/api/admin/support/tickets?category=technical&priority=high&status=open&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Ticket Statistics
```bash
curl -X GET "http://localhost:8000/api/admin/support/tickets/stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Create Ticket
```bash
curl -X POST "http://localhost:8000/api/admin/support/tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 45,
    "subject": "Payment processing error",
    "category": "billing",
    "priority": "high",
    "description": "User unable to complete payment for trip #12345"
  }'
```

### Get Ticket Details
```bash
curl -X GET "http://localhost:8000/api/admin/support/tickets/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Update Ticket
```bash
curl -X PUT "http://localhost:8000/api/admin/support/tickets/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "urgent"
  }'
```

### Assign Ticket
```bash
curl -X PUT "http://localhost:8000/api/admin/support/tickets/1/assign" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_id": 2
  }'
```

### Add Message to Ticket
```bash
curl -X POST "http://localhost:8000/api/admin/support/tickets/1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Investigated issue. Payment gateway had temporary downtime.",
    "is_internal": true
  }'

# Public message (visible to user)
curl -X POST "http://localhost:8000/api/admin/support/tickets/1/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "We have identified and resolved the payment issue. Please try again.",
    "is_internal": false
  }'
```

### Close Ticket
```bash
curl -X PUT "http://localhost:8000/api/admin/support/tickets/1/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "Issue resolved. Payment gateway restored."
  }'
```

---

## 💰 Financial Dashboard APIs

### Get Financial Overview
```bash
curl -X GET "http://localhost:8000/api/admin/financial/overview?period=30" \
  -H "Authorization: Bearer $TOKEN"

# Period options: 7, 30, 90 (days)
```

### Get Revenue Trends
```bash
curl -X GET "http://localhost:8000/api/admin/financial/revenue-trends?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Driver Payouts
```bash
# Pending payouts
curl -X GET "http://localhost:8000/api/admin/financial/driver-payouts?status=pending&page=1" \
  -H "Authorization: Bearer $TOKEN"

# All payouts
curl -X GET "http://localhost:8000/api/admin/financial/driver-payouts?status=all&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Transactions
```bash
# All transactions
curl -X GET "http://localhost:8000/api/admin/financial/transactions?type=all&page=1" \
  -H "Authorization: Bearer $TOKEN"

# Trip payments only
curl -X GET "http://localhost:8000/api/admin/financial/transactions?type=trip&page=1" \
  -H "Authorization: Bearer $TOKEN"

# Subscriptions only
curl -X GET "http://localhost:8000/api/admin/financial/transactions?type=subscription&page=1" \
  -H "Authorization: Bearer $TOKEN"

# Refunds only
curl -X GET "http://localhost:8000/api/admin/financial/transactions?type=refund&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Process Driver Payout
```bash
curl -X POST "http://localhost:8000/api/admin/financial/payout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": 5,
    "amount": 1234.50,
    "payment_method": "bank_transfer"
  }'

# Payment method options: bank_transfer, mobile_money, cash
```

---

## 📊 Sample Responses

### Rider Details Response
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+263771234567",
  "status": "active",
  "is_banned": false,
  "total_trips": 45,
  "total_spent": 234.50,
  "rating": 4.8,
  "created_at": "2026-01-01T10:00:00Z",
  "trip_history": [
    {
      "id": 123,
      "pickup_location": "Downtown Plaza",
      "dropoff_location": "Airport Terminal 1",
      "fare": 15.50,
      "status": "completed",
      "created_at": "2026-01-31T14:30:00Z"
    }
  ],
  "payment_methods": [
    {
      "id": 1,
      "type": "card",
      "last_four": "4242",
      "is_default": true
    }
  ]
}
```

### Trip Details Response
```json
{
  "id": 123,
  "trip_id": "TRP-123456",
  "rider": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+263771234567"
  },
  "driver": {
    "id": 5,
    "name": "Mike Ross",
    "email": "mike@example.com",
    "phone": "+263779876543",
    "license_plate": "ABC-1234"
  },
  "pickup_location": "Downtown Plaza",
  "pickup_lat": -17.8252,
  "pickup_lng": 31.0335,
  "dropoff_location": "Airport Terminal 1",
  "dropoff_lat": -17.9318,
  "dropoff_lng": 31.0928,
  "distance": 15.5,
  "duration": 25,
  "fare": 15.50,
  "status": "completed",
  "payment_method": "card",
  "created_at": "2026-01-31T14:30:00Z",
  "completed_at": "2026-01-31T14:55:00Z"
}
```

### Support Ticket Response
```json
{
  "id": 1,
  "ticket_number": "T-0001",
  "user": {
    "id": 45,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+263778888888"
  },
  "subject": "Payment processing error",
  "category": "billing",
  "priority": "high",
  "status": "open",
  "assigned_to": {
    "id": 2,
    "name": "Admin User"
  },
  "created_at": "2026-01-31T10:00:00Z",
  "updated_at": "2026-01-31T10:15:00Z",
  "messages": [
    {
      "id": 1,
      "user_id": 45,
      "user_name": "Jane Smith",
      "message": "I'm unable to complete payment for my trip",
      "is_internal": false,
      "attachments": [],
      "created_at": "2026-01-31T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "user_name": "Admin User",
      "message": "Investigating payment gateway logs",
      "is_internal": true,
      "attachments": [],
      "created_at": "2026-01-31T10:10:00Z"
    }
  ]
}
```

### Financial Overview Response
```json
{
  "total_revenue": 45678.50,
  "total_payouts": 38210.25,
  "platform_earnings": 7468.25,
  "active_subscriptions": 234,
  "subscription_revenue": 234.00,
  "refunded_amount": 125.50,
  "average_trip_fare": 12.85,
  "total_trips": 3554,
  "period_days": 30
}
```

---

## 🔍 Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthenticated",
  "message": "Token is invalid or expired"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Admin privileges required"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Rider with ID 999 not found"
}
```

### 422 Validation Error
```json
{
  "error": "Validation Failed",
  "errors": {
    "amount": ["The amount field is required"],
    "reason": ["The reason must be at least 10 characters"]
  }
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to process payout"
}
```

---

## 🧪 Testing Checklist

Use this checklist to verify all endpoints work:

### Rider Management
- [ ] List riders with pagination
- [ ] Search riders by name/email
- [ ] Filter riders by status
- [ ] Get rider details with trip history
- [ ] Suspend a rider
- [ ] Ban a rider
- [ ] Unban a rider
- [ ] Process a refund
- [ ] Get rider statistics

### Trip Management
- [ ] List live trips
- [ ] List trip history
- [ ] Get live map data
- [ ] Get trip details
- [ ] Cancel an active trip
- [ ] Process trip refund
- [ ] Resolve fare dispute
- [ ] Update trip status

### Support Tickets
- [ ] List tickets with filters
- [ ] Get ticket statistics
- [ ] Create new ticket
- [ ] Get ticket details with messages
- [ ] Update ticket priority/status
- [ ] Assign ticket to admin
- [ ] Add internal note
- [ ] Add public message
- [ ] Close ticket

### Financial Dashboard
- [ ] Get financial overview
- [ ] Get revenue trends
- [ ] Get pending payouts
- [ ] Get transaction history
- [ ] Filter transactions by type
- [ ] Process driver payout

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Pagination defaults to 50 items per page
- All amounts are in USD with 2 decimal places
- Status enums are lowercase with underscores
- Search is case-insensitive
- Filters can be combined with &

---

**Ready to test Phase 1 APIs!** 🚀
