# BugBounty
Overview of successful bounties 


# SSRF via Webhook Endpoint URL: DNS Rebinding to Localhost

**Severity:** P5 (Informational)  
**Category:** Server-Side Request Forgery (SSRF)  
**CWE:** CWE-918 : Server-Side Request Forgery

---

## Summary

The webhook configuration API (`/api/v2/webhooks`) accepts arbitrary endpoint URLs without validating that the resolved IP address belongs to an external, publicly routable host. A vendor-owned domain was discovered resolving to `127.0.0.1`, which could be supplied as a webhook target to direct server-initiated HTTP requests to the loopback interface.

## Technical Details

1. **Endpoint:** `POST /api/v2/webhooks` used to register a URL that receives event-driven HTTP callbacks.
2. **Root Cause:** The API performs no DNS resolution check or IP allowlist/denylist validation on the user-supplied `endpoint` parameter before persisting the webhook configuration.
3. **Attack Vector:** A domain owned by the vendor itself was found resolving to `127.0.0.1` via public DNS. By setting this domain as the webhook target, outbound requests are routed to the server's loopback adapter.

```
$ dig +short vendor-dev.example.com
127.0.0.1
```

```json
POST /api/v2/webhooks
{
  "webhook": {
    "name": "test",
    "endpoint": "http://vendor-dev.example.com/ssrf-test",
    "http_method": "POST",
    "request_format": "json",
    "status": "active"
  }
}
```

4. **Impact (Theoretical):** In a more permissive environment this pattern enables scanning internal services, accessing cloud metadata endpoints (`169.254.169.254`), or exfiltrating internal data. Actual exploitability was limited, hence the informational rating.

## Remediation Recommendation

- Resolve the target URL at webhook creation time and reject any destination that maps to private/reserved IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`).
- Re-validate at request dispatch time to prevent TOCTOU / DNS rebinding bypasses.




# Broken Access Control : Unauthenticated Organization Join

**Severity:** P5 (Informational)  
**Category:** Improper Authentication / Broken Access Control  
**CWE:** CWE-287 : Improper Authentication

---

## Summary

An identity federation platform's sandbox environment exposed a `/users/join-organization` endpoint that allowed any authenticated user to join arbitrary organizations without invitation or approval, bypassing the intended organization membership workflow.

## Technical Details

1. **Endpoint:** `POST /users/join-organization` on the sandbox identity provider.
2. **Root Cause:** The endpoint validates that the caller holds a valid session but does **not** verify that the user was invited to, or has any prior relationship with, the target organization. The `organization_id` parameter is fully attacker-controlled.
3. **Attack Flow:**

```
1. Authenticate as a regular user → obtain session cookie
2. Enumerate or guess organization IDs (sequential / UUID)
3. POST /users/join-organization
   Body: { "organization_id": "<target_org_id>" }
4. Server returns 200 — user is now a member of the target org
```

4. **Impact:** An attacker with a valid low-privilege account could join any organization on the platform, potentially gaining access to organization-scoped resources, user directories, or elevated roles inherited from org membership. Finding was on a sandbox environment, limiting real-world impact.

## Remediation Recommendation

- Enforce server-side authorization: verify the user holds a valid invitation token or is on an allowlist before processing the join request.
- Implement rate limiting and logging on organization-join actions to detect enumeration attempts.
