# CIVICTAX Backend Error Handling & Response Standards

## 1. Standard Error Envelope

All API errors return a consistent JSON error envelope:

```json
{
  "success": false,
  "error": "HUMAN_READABLE_ERROR_MESSAGE",
  "errorId": "ERR-2024-TIMESTAMP",
  "status": 400
}
```

---

## 2. HTTP Status Code Mapping

| Status Code | Scenario | Example Response |
| :--- | :--- | :--- |
| **200 OK** | Successful retrieval / update | `{ "success": true, "data": { ... } }` |
| **201 Created** | Record created (Property, Payment, Ticket) | `{ "success": true, "data": { ... } }` |
| **400 Bad Request** | Validation violation (e.g. Area $\le 0$, Overpayment) | `{ "success": false, "error": "Built-up area must be strictly greater than zero" }` |
| **401 Unauthorized**| Missing or expired session cookie | `{ "success": false, "error": "Authentication required" }` |
| **404 Not Found** | Record identifier does not exist | `{ "success": false, "error": "Property record not found" }` |
| **500 Internal Error**| Unexpected server failure (Secrets redacted) | `{ "success": false, "error": "An internal server error occurred" }` |
