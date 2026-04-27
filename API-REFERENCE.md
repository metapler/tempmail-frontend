# TempMail API Reference

This document outlines the REST API endpoints provided by the Fastify backend. All endpoints are prefixed with `/v1`. If you are calling these endpoints from the Next.js frontend, they are proxied via `/api/v1/*`.

> **Base URL:** `http://localhost:4000/v1` (Backend directly) or `http://localhost:3000/api/v1` (Via Frontend Proxy)

---

## 1. Domains (`/domains`)

### Get Public Domains
Retrieves a list of all active system domains available for generating temporary inboxes.

- **URL:** `/domains/public`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "domains": [
        { "domain": "kanop.site", "type": "system" }
      ]
    }
    ```

### Register Custom Domain
Registers a new custom domain for use. Returns DNS records that must be configured by the user before the domain can be verified and used.

- **URL:** `/domains/custom`
- **Method:** `POST`
- **Rate Limit:** 5 requests per 1 hour
- **Body:**
  ```json
  {
    "domain": "example.com"
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:**
    ```json
    {
      "domain": "example.com",
      "status": "pending",
      "records": {
        "txt": {
          "name": "tempmail-verify.example.com",
          "value": "tempmail-verify-123456789"
        },
        "mx": {
          "name": "example.com",
          "value": "10 mx.yourdomain.com"
        }
      }
    }
    ```

### Verify Custom Domain
Triggers a DNS check to verify if the required TXT and MX records have been propagated for a custom domain.

- **URL:** `/domains/custom/:domain/verify`
- **Method:** `POST`
- **URL Parameters:** `domain=[string]`
- **Success Response (Verified):**
  - **Code:** 200 OK
  - **Content:** `{ "domain": "example.com", "status": "active" }`
- **Success Response (Pending):**
  - **Code:** 200 OK
  - **Content:** 
    ```json
    { 
      "domain": "example.com", 
      "status": "pending", 
      "checks": { "txt": true, "mx": false } 
    }
    ```

### Get Custom Domain Status
Retrieves the current status and verification details of a custom domain.

- **URL:** `/domains/custom/:domain/status`
- **Method:** `GET`
- **URL Parameters:** `domain=[string]`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "domain": "example.com",
      "status": "pending",
      "type": "custom",
      "verificationToken": "tempmail-verify-123456789",
      "verificationTxtName": "tempmail-verify.example.com",
      "lastCheckedAt": "2023-10-01T12:00:00Z",
      "verifiedAt": null
    }
    ```

---

## 2. Inboxes (`/inboxes`)

### Generate Random Inbox
Creates a new random temporary email address.

- **URL:** `/inboxes/generate`
- **Method:** `POST`
- **Rate Limit:** 20 requests per 10 minutes
- **Body (Optional):**
  ```json
  {
    "domain": "kanop.site" // Defaults to kanop.site if omitted
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:**
    ```json
    {
      "address": "random123@kanop.site",
      "url": "http://localhost:3000/inbox/random123@kanop.site",
      "expiresAt": "2023-10-01T13:00:00Z"
    }
    ```

### Create Custom Inbox
Creates a temporary email address with a specific requested local part (e.g., `hello@kanop.site`).

- **URL:** `/inboxes/custom`
- **Method:** `POST`
- **Rate Limit:** 20 requests per 10 minutes
- **Body:**
  ```json
  {
    "localPart": "hello",
    "domain": "kanop.site" // Defaults to kanop.site if omitted
  }
  ```
- **Success Response:**
  - **Code:** 201 Created
  - **Content:**
    ```json
    {
      "address": "hello@kanop.site",
      "url": "http://localhost:3000/inbox/hello@kanop.site"
    }
    ```
- **Error Response:**
  - **Code:** 400 Bad Request
  - **Content:** `{ "error": "Invalid or reserved local part" }`

### Resolve Inbox
Resolves an inbox address. If the domain is valid and active but the inbox doesn't exist, it will be automatically created (useful for incoming URLs or generic catch-alls).

- **URL:** `/inboxes/resolve`
- **Method:** `GET`
- **Rate Limit:** 120 requests per 1 minute
- **URL Query Parameters:** `?address=[string]`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "address": "hello@kanop.site",
      "exists": true,
      "createdAt": "2023-10-01T12:00:00Z"
    }
    ```

### Get Inbox Messages
Retrieves a list of all non-deleted messages for a specific inbox. Triggers an update to the inbox's `lastAccessedAt` timestamp.

- **URL:** `/inboxes/:address/messages`
- **Method:** `GET`
- **Rate Limit:** 120 requests per 1 minute
- **URL Parameters:** `address=[string]`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "messages": [
        {
          "id": "cm0abc1230000abcde",
          "from": "Sender <sender@example.com>",
          "subject": "Hello World",
          "receivedAt": "2023-10-01T12:05:00Z",
          "hasHtml": true,
          "hasText": true,
          "attachmentCount": 0
        }
      ]
    }
    ```

### Subscribe to Inbox Events (SSE)
Establishes a Server-Sent Events (SSE) connection to receive real-time notifications when new messages arrive.

- **URL:** `/inboxes/:address/events`
- **Method:** `GET`
- **URL Parameters:** `address=[string]`
- **Response Format:** `text/event-stream`
- **Event Type:** `message.created`
- **Behavior:** The connection stays open and sends periodic `:keepalive` pings. When a message is received, it pushes the event.

---

## 3. Messages (`/messages`)

### Get Message Details
Retrieves the full content of a specific message, including its text and HTML bodies. The HTML body is pre-sanitized by the backend before being sent.

- **URL:** `/messages/:id`
- **Method:** `GET`
- **Rate Limit:** 120 requests per 1 minute
- **URL Parameters:** `id=[string]`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:**
    ```json
    {
      "id": "cm0abc1230000abcde",
      "from": "Sender <sender@example.com>",
      "to": "hello@kanop.site",
      "subject": "Hello World",
      "textBody": "Hello World\nThis is a test message.",
      "htmlBody": "<html>...</html>",
      "receivedAt": "2023-10-01T12:05:00Z"
    }
    ```
