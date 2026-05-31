# Varanda Mart API

Node.js · Express · PostgreSQL (Neon) · Cloudinary

**Base URL:** `https://api.varanda.com/api/v1`  
**Local:** `http://localhost:4000/api/v1`

---

## Setup

```bash
npm install
cp .env.example .env   # fill in your secrets
node migrations/runner.js
node seeds/runner.js
npm run dev
```

---

## Conventions

**Success envelope**
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "perPage": 20, "total": 100, "totalPages": 5 } }
```

**Error envelope**
```json
{ "success": false, "error": { "code": "STRING_CODE", "message": "Human description", "details": [{ "field": "...", "message": "..." }] } }
```

**Auth headers by role**

| Role | Header |
|------|--------|
| Seller / Supplier / Hybrid / Admin | `Authorization: Bearer <accessToken>` |
| Customer (storefront) | `X-Customer-Token: Bearer <sessionToken>` |
| Developer (external API) | `X-Varanda-Public-Key` + `X-Varanda-Secret-Key` |

**Common error codes**

`VALIDATION_ERROR` 422 · `UNAUTHORIZED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `GONE` 410 · `PLAN_LIMIT` 403 · `SUBSCRIPTION_REQUIRED` 403 · `ROLE_REQUIRED` 403 · `RATE_LIMITED` 429 · `INTERNAL_ERROR` 500

---

## Phase 1 — Auth & Role System

### POST /auth/register

No auth. Creates a user account and sends a 6-digit OTP to the email address.

**Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "firstName": "Ade",
  "lastName": "Balogun",
  "phone": "+2348012345678"
}
```

**201**
```json
{ "data": { "message": "Verification email sent", "email": "user@example.com" } }
```

**Errors:** `409 CONFLICT` email taken · `422 VALIDATION_ERROR` weak password / missing fields

> **Dev note:** Set `OTP_FIXED_VALUE=654321` in `.env` to always receive code `654321` during development.

---

### POST /auth/verify-email

No auth. Verifies the OTP. Returns an access token — user must still select a role before accessing any dashboard endpoints.

**Body**
```json
{ "email": "user@example.com", "code": "654321" }
```

**200**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900,
    "user": { "id": "uuid", "email": "...", "firstName": "Ade", "role": null, "onboardingStep": "ROLE_SELECTION" }
  }
}
```

Cookie set: `refreshToken` (HttpOnly, 30 days)

**Errors:** `400 INVALID_CODE` · `410 GONE` expired · `422 MAX_ATTEMPTS` 5 wrong attempts

---

### POST /auth/role/select

**Auth: Bearer.** Called immediately after email verification. Creates the appropriate profile and sets the user's role permanently.

**Body**
```json
{ "role": "SELLER" | "SUPPLIER" | "DEVELOPER" }
```

- **SELLER** → creates `businesses` skeleton + `brand_settings`. `onboardingStep` → `PLAN_SELECTION`
- **SUPPLIER** → creates `supplier_profiles` skeleton. `onboardingStep` → `BUSINESS_SETUP`
- **DEVELOPER** → creates `developer_profiles` with status `PENDING`. `onboardingStep` → `COMPLETE`

**200**
```json
{
  "data": {
    "role": "SELLER",
    "onboardingStep": "PLAN_SELECTION",
    "business": { "id": "uuid", "slug": "ade-balogun", "status": "INCOMPLETE" },
    "supplierProfile": null,
    "developerProfile": null
  }
}
```

**Errors:** `409 CONFLICT` role already selected · `422 VALIDATION_ERROR` invalid role

---

### POST /auth/role/add

**Auth: Bearer.** Adds a second role to an existing account, creating a HYBRID user.

**Body**
```json
{ "addRole": "SUPPLIER" | "SELLER" }
```

**200**
```json
{
  "data": {
    "role": "HYBRID",
    "addedRole": "SUPPLIER",
    "onboardingStep": "COMPLETE",
    "nextAction": "Visit /supplier to complete supplier setup"
  }
}
```

**Errors:** `409 CONFLICT` already has that role · `400 INVALID_ADDITION` DEVELOPER cannot add roles

---

### POST /auth/login

**Body**
```json
{ "email": "user@example.com", "password": "SecurePass1!" }
```

**200** — same shape as `verify-email` response. Includes `role`, `onboardingStep`, `business`, `supplierProfile`, `developerProfile`, `subscription`.

> If email is not verified, a fresh OTP is automatically sent and `403 EMAIL_NOT_VERIFIED` is returned with the message "A new verification code has been sent to your email."

**Errors:** `401 INVALID_CREDENTIALS` · `403 EMAIL_NOT_VERIFIED` · `403 ACCOUNT_SUSPENDED`

---

### POST /auth/refresh

No body. Reads the `refreshToken` HttpOnly cookie.

**200**
```json
{ "data": { "accessToken": "eyJ...", "expiresIn": 900 } }
```

**Errors:** `401 UNAUTHORIZED` no/invalid cookie · `401 TOKEN_EXPIRED`

---

### POST /auth/logout

**Auth: Bearer.** Revokes the current refresh token and clears the cookie.

**200**
```json
{ "data": { "message": "Logged out" } }
```

---

### POST /auth/forgot-password

No auth. Always returns 200 (no email enumeration).

**Body:** `{ "email": "user@example.com" }`

---

### POST /auth/reset-password

No auth.

**Body**
```json
{ "email": "user@example.com", "code": "654321", "newPassword": "NewPass1!" }
```

**200** `{ "data": { "message": "Password updated successfully." } }`

**Errors:** `400 INVALID_CODE` · `410 GONE` · `422 VALIDATION_ERROR` weak password

---

### GET /auth/me

**Auth: Bearer.**

**200**
```json
{
  "data": {
    "user": { "id", "email", "firstName", "lastName", "role", "onboardingStep", "hasSellerProfile", "hasSupplierProfile", "hasDeveloperProfile" },
    "business": { "id", "name", "slug", "status", "currency", "logoUrl" },
    "supplierProfile": { "id", "displayName", "isVerified", "isActive" },
    "developerProfile": { "id", "businessName", "status" },
    "subscription": { "tier", "status", "trialEndsAt", "daysLeftInTrial", "features", "limits" }
  }
}
```

---

## Phase 2 — Business Setup, Subscriptions & Varanda Pay

### GET /plans

No auth. Returns all three seller plans.

**200**
```json
{
  "data": {
    "plans": [{
      "id", "tier", "displayName", "monthlyPriceUsd", "yearlyPriceUsd",
      "trialDays", "commissionRate", "platformServiceFeeRate",
      "maxProducts", "maxStores", "maxStaffSeats", "maxDropshipImports", "features"
    }]
  }
}
```

---

### GET /banks

No auth. Returns all Nigerian banks from Paystack (cached 24h). Use `code` when calling bank account endpoints.

**200**
```json
{ "data": { "banks": [{ "name": "Zenith Bank", "code": "057", "slug": "zenith-bank" }] } }
```

---

### POST /subscriptions/select-plan

**Auth: Bearer (seller).** Called after role selection. STARTER creates the subscription immediately. PRO/GROWTH returns a Flutterwave checkout URL.

**Body**
```json
{ "tier": "STARTER" | "PRO" | "GROWTH", "billingCycle": "MONTHLY" | "YEARLY" }
```

**STARTER → 201**
```json
{ "data": { "subscription": { "tier": "STARTER", "status": "ACTIVE", "commissionRate": 0.05 }, "nextStep": "BUSINESS_SETUP" } }
```

**PRO/GROWTH → 200**
```json
{ "data": { "checkoutUrl": "https://checkout.flutterwave.com/...", "tier": "PRO", "trialDays": 90, "firstChargeDate": "2024-10-15", "firstChargeAmount": 6.00 } }
```

**Errors:** `409 CONFLICT` already has subscription · `403 ROLE_REQUIRED`

---

### POST /subscriptions/initiate-paid

**Auth: Bearer (seller).** Explicit endpoint to start a PRO/GROWTH checkout. Returns Flutterwave hosted URL.

**Body:** `{ "tier": "PRO" | "GROWTH", "billingCycle": "MONTHLY" | "YEARLY" }`

**200** — same shape as PRO/GROWTH response above.

---

### GET /subscriptions/current

**Auth: Bearer (seller).**

**200**
```json
{
  "data": {
    "subscription": {
      "id", "tier", "status", "billingCycle",
      "trialEndsAt", "daysLeftInTrial",
      "currentPeriodStart", "currentPeriodEnd",
      "nextBillingDate", "nextBillingAmount",
      "card": { "last4", "expiry", "brand" },
      "features": { "canUseCustomDomain": true, ... },
      "limits": { "maxProducts": null, "maxStaffSeats": 5, "maxDropshipImports": null }
    }
  }
}
```

---

### POST /subscriptions/upgrade

**Auth: Bearer (seller).**

**Body:** `{ "tier": "PRO" | "GROWTH", "billingCycle": "MONTHLY" | "YEARLY" }`

Returns `{ "checkoutUrl": "..." }` if no card on file, or updated subscription if card exists.

---

### POST /subscriptions/cancel

**Auth: Bearer (seller).** No body. Access continues until `current_period_end`.

**200**
```json
{ "data": { "message": "Cancelled. Access continues until ...", "accessUntil": "2024-11-01T00:00:00Z" } }
```

---

### POST /webhooks/flutterwave

No auth. Verified by `verif-hash` header.

Events handled: `subscription.activated` · `subscription.charge.completed` · `subscription.charge.failed` · `subscription.cancelled`

**Response:** HTTP 200

---

## Cloudinary — Client-Side Direct Upload

All file uploads use a two-step flow. The server never handles file buffers directly.

**Step 1 — Get signed upload params**

### GET /cloudinary/sign

**Auth: Bearer (any authenticated user).**

**Query params**

| `type` | Description | Allowed formats | Max size |
|--------|-------------|-----------------|----------|
| `logo` | Business logo | jpg, jpeg, png, webp, svg | 5 MB |
| `favicon` | Business favicon | jpg, jpeg, png, webp, svg | 5 MB |
| `product` | Seller product image | jpg, jpeg, png, webp, svg | 5 MB |
| `supplier_product` | Supplier product image | jpg, jpeg, png, webp, svg | 5 MB |
| `document` | KYC / verification doc | jpg, jpeg, png, pdf | 10 MB |
| `avatar` | User avatar | jpg, jpeg, png, webp, svg | 5 MB |
| `category` | Category image | jpg, jpeg, png, webp, svg | 5 MB |
| `bundle` | Bundle image | jpg, jpeg, png, webp, svg | 5 MB |

Optional: `context` — extra path segment (e.g. a productId to scope the folder).

**200**
```json
{
  "data": {
    "timestamp": 1700000000,
    "folder": "varanda/businesses/<businessId>/logo",
    "allowed_formats": "jpg,jpeg,png,webp,svg",
    "max_file_size": 5242880,
    "signature": "abc123...",
    "api_key": "683634667241462",
    "cloud_name": "dpndpccww",
    "resource_type": "image",
    "upload_url": "https://api.cloudinary.com/v1_1/dpndpccww/image/upload"
  }
}
```

**Step 2 — Upload directly from the frontend**

Use the signed params to POST the file directly to `upload_url` (multipart/form-data). Cloudinary returns a `secure_url` and `public_id`.

**React hook — `useCloudinaryUpload`**

Drop this hook into your frontend. It handles fetching the signature, uploading to Cloudinary, and returning the result ready to send to the API.

```tsx
// hooks/useCloudinaryUpload.ts
import { useState } from 'react';

type UploadType =
  | 'logo' | 'favicon' | 'product' | 'supplier_product'
  | 'document' | 'avatar' | 'category' | 'bundle';

interface SignParams {
  timestamp: number;
  folder: string;
  allowed_formats: string;
  max_file_size: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  resource_type: string;
  upload_url: string;
  public_id?: string;
}

interface UploadResult {
  url: string;       // secure_url from Cloudinary — send this to the API
  publicId: string;  // public_id from Cloudinary — send this to the API
}

interface UseCloudinaryUpload {
  upload: (file: File, type: UploadType, context?: string) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;  // 0–100
  error: string | null;
}

/**
 * Fetches a signed upload signature from the Varanda API, then uploads
 * the file directly to Cloudinary. Returns { url, publicId } to pass
 * to the relevant POST/PUT endpoint.
 *
 * Usage:
 *   const { upload, uploading, progress } = useCloudinaryUpload();
 *   const { url, publicId } = await upload(file, 'logo');
 *   await api.post('/business/logo', { url, publicId });
 */
export function useCloudinaryUpload(): UseCloudinaryUpload {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    type: UploadType,
    context?: string
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: get signed params from our backend
      const query = new URLSearchParams({ type });
      if (context) query.set('context', context);

      const signRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/cloudinary/sign?${query}`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`, // your auth helper
          },
        }
      );

      if (!signRes.ok) throw new Error('Failed to get upload signature');
      const { data: params }: { data: SignParams } = await signRes.json();

      // Step 2: build the multipart form and upload directly to Cloudinary
      // Only send the params that were included in the signature — nothing extra.
      const form = new FormData();
      form.append('file', file);
      form.append('timestamp', String(params.timestamp));
      form.append('folder', params.folder);
      form.append('allowed_formats', params.allowed_formats);
      form.append('signature', params.signature);
      form.append('api_key', params.api_key);
      if (params.public_id) form.append('public_id', params.public_id);

      // Use XMLHttpRequest so we can track upload progress
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve({ url: res.secure_url, publicId: res.public_id });
          } else {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error?.message ?? 'Cloudinary upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', params.upload_url);
        xhr.send(form);
      });

      setProgress(100);
      return result;

    } catch (err: any) {
      const msg = err.message ?? 'Upload failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress, error };
}
```

**Example — logo upload**

```tsx
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

function LogoUploader() {
  const { upload, uploading, progress } = useCloudinaryUpload();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to Cloudinary, then save URL to our API
    const { url, publicId } = await upload(file, 'logo');
    await fetch('/api/v1/business/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, publicId }),
    });
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
      {uploading && <p>Uploading... {progress}%</p>}
    </div>
  );
}
```

**Example — document upload**

```tsx
// context scopes the Cloudinary folder to the document type
const { url, publicId } = await upload(file, 'document', 'national_id');

await fetch('/api/v1/business/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ url, publicId, type: 'NATIONAL_ID', fileName: file.name }),
});
```

**Step 3 — Save the URL to the API**

Send the resulting `secure_url` and `public_id` to the relevant endpoint (see below).

---

## Business Setup Endpoints

All require `Authorization: Bearer` + active subscription. Business ID is inferred from the JWT.

---

### GET /business

**200**
```json
{
  "data": {
    "business": { "id", "name", "slug", "sector", "tagline", "description", "status", "logoUrl", "faviconUrl", "currency", "timezone", "isPublished" },
    "address": { "streetLine1", "city", "state", "country" },
    "brandSettings": { "primaryColor", "fontHeading", ... },
    "bankAccount": { "bankName", "accountNumber", "paystackSubaccountCode", "isActive" },
    "documents": [{ "id", "type", "status", "rejectionReason" }],
    "paymentGateways": [{ "gateway", "isActive", "connectedAt" }]
  }
}
```

---

### PUT /business

**Body** (all optional)
```json
{ "name": "My Store", "sector": "FASHION_APPAREL", "tagline": "...", "description": "...", "currency": "NGN", "timezone": "Africa/Lagos" }
```

**Sectors:** `FASHION_APPAREL` · `ELECTRONICS` · `FOOD_BEVERAGE` · `HEALTH_BEAUTY` · `HOME_LIVING` · `BOOKS_STATIONERY` · `SPORTS_FITNESS` · `TOYS_GAMES` · `AUTOMOTIVE` · `JEWELRY_ACCESSORIES` · `ART_CRAFTS` · `DIGITAL_PRODUCTS` · `SERVICES` · `GENERAL_MERCHANDISE` · `OTHER`

---

### PUT /business/seo

**Body** (all optional)
```json
{ "seoTitle": "...", "seoDescription": "...", "seoKeywords": "...", "googleAnalyticsId": "G-XXX", "facebookPixelId": "..." }
```

---

### POST /business/logo

Send the Cloudinary URL after uploading via `GET /cloudinary/sign?type=logo`.

**Body**
```json
{ "url": "https://res.cloudinary.com/...", "publicId": "varanda/businesses/.../logo/..." }
```

**200** `{ "data": { "logoUrl": "https://res.cloudinary.com/..." } }`

---

### POST /business/favicon

Same as logo. Use `GET /cloudinary/sign?type=favicon`.

**Body:** `{ "url": "...", "publicId": "..." }`

---

### PUT /business/address

**Body**
```json
{ "type": "BUSINESS", "streetLine1": "12 Lagos St", "city": "Lagos", "state": "Lagos", "country": "Nigeria", "postalCode": "100001" }
```

---

### POST /business/documents

Upload the file via `GET /cloudinary/sign?type=document`, then send the URL here.

**Body**
```json
{ "url": "https://res.cloudinary.com/...", "publicId": "...", "type": "NATIONAL_ID", "fileName": "id.pdf" }
```

**Document types:** `NATIONAL_ID` · `PASSPORT` · `DRIVERS_LICENSE` · `UTILITY_BILL` · `BUSINESS_REGISTRATION` · `OTHER`

**201** `{ "data": { "document": { "id", "type", "status": "PENDING" } } }`

---

### GET /business/documents

**200** `{ "data": { "documents": [{ "id", "type", "status", "rejectionReason", "createdAt" }] } }`

---

### PUT /business/brand-settings

**Body** (all optional)
```json
{
  "primaryColor": "#4CAF7D",
  "secondaryColor": "#F97316",
  "accentColor": "#2e7d52",
  "backgroundColor": "#FFFFFF",
  "textColor": "#111111",
  "fontHeading": "Poppins",
  "fontBody": "Inter",
  "baseFontSize": 16,
  "headingScale": 1.25,
  "buttonBorderRadius": 8,
  "cardBorderRadius": 12,
  "inputBorderRadius": 4,
  "globalCss": ""
}
```

---

### GET /business/social-links

**200** `{ "data": { "socialLinks": [{ "id", "platform", "url", "label", "isVisible", "sortOrder" }] } }`

---

### POST /business/social-links

**Body**
```json
{ "platform": "instagram", "url": "https://instagram.com/mystore", "label": "Instagram", "isVisible": true, "sortOrder": 0 }
```

---

### PUT /business/social-links/:linkId

Partial update — same fields as POST, all optional.

---

### DELETE /business/social-links/:linkId

---

### PUT /business/social-links/reorder

**Body**
```json
{ "links": [{ "id": "uuid", "sortOrder": 0 }, { "id": "uuid", "sortOrder": 1 }] }
```

---

### PUT /business/chatbot

**Body**
```json
{ "provider": "WHATSAPP" | "TELEGRAM", "config": { "phoneNumber": "+234..." }, "isActive": true, "position": "BOTTOM_RIGHT" | "BOTTOM_LEFT" }
```

---

### POST /business/bank-account/verify-account

Calls Paystack account resolution API. Call this before registering the bank account.

**Body**
```json
{ "bankCode": "057", "accountNumber": "2012345678" }
```

**200**
```json
{ "data": { "accountName": "ADEBAYO OLUWAFEMI", "accountNumber": "2012345678", "bankName": "Zenith Bank" } }
```

**Errors:** `400 ACCOUNT_NOT_FOUND`

---

### POST /business/bank-account

Registers the bank account as a Paystack subaccount for auto-split payments. Call `verify-account` first.

**Body**
```json
{ "bankCode": "057", "accountNumber": "2012345678", "accountName": "ADEBAYO OLUWAFEMI", "settlementSchedule": "auto" }
```

**201**
```json
{
  "data": {
    "bankAccount": {
      "bankName": "Zenith Bank",
      "accountNumber": "****5678",
      "accountName": "ADEBAYO OLUWAFEMI",
      "paystackSubaccountCode": "ACCT_xxxxxxxxxx",
      "isActive": true
    }
  }
}
```

**Errors:** `409 CONFLICT` already exists (use PUT) · `400 PAYSTACK_ERROR`

---

### GET /business/bank-account

Returns masked account details and Varanda Pay status.

---

### PUT /business/bank-account

Same body as POST. Deactivates old subaccount and creates a new one.

---

### POST /business/domains/subdomain

**Body:** `{ "subdomain": "mystore" }` — lowercase alphanumeric + hyphens, 3–50 chars.

**201**
```json
{ "data": { "domain": { "id", "domain": "mystore", "fullDomain": "mystore.varanda.com", "status": "ACTIVE" } } }
```

**Errors:** `409 CONFLICT` taken · `422 VALIDATION_ERROR` invalid characters

---

### POST /business/domains/custom

**Body:** `{ "domain": "mystore.com" }`

**201**
```json
{
  "data": {
    "domain": {
      "id", "domain", "fullDomain", "status": "PENDING",
      "dnsTxtRecord": "varanda-verify=abc123...",
      "instructions": "Add a TXT record to your DNS: Name=\"_varanda-verify\", Value=\"varanda-verify=abc123...\""
    }
  }
}
```

---

### POST /business/domains/:domainId/verify

Triggers a DNS TXT lookup. Sets status to ACTIVE if the record is found.

**200** `{ "data": { "domain": { "status": "ACTIVE" | "PENDING", "checkedAt": "..." } } }`

**400 DNS_NOT_VERIFIED** `{ "details": { "expectedRecord": "...", "checkedAt": "..." } }`

---

### DELETE /business/domains/:domainId

---

### POST /business/integrations/payment/connect

Stores encrypted custom gateway credentials. Verifies them before saving.

**Body**
```json
{ "gateway": "FLUTTERWAVE_CUSTOM" | "STRIPE_CUSTOM", "apiKey": "...", "apiSecret": "...", "webhookSecret": "..." }
```

**201** `{ "data": { "gateway", "isActive": true, "connectedAt": "..." } }`

---

### DELETE /business/integrations/payment/:gateway/disconnect

Reverts to Varanda Pay. `:gateway` = `FLUTTERWAVE_CUSTOM` or `STRIPE_CUSTOM`.

---

## Supplier Profile Endpoints

All require `Authorization: Bearer` with a supplier profile (`has_supplier_profile = true`). Available to SUPPLIER and HYBRID users.

---

### GET /supplier/profile

**200**
```json
{
  "data": {
    "supplier": { "id", "displayName", "description", "country", "processingTimeDays", "shipsTo", "isVerified" },
    "metrics": { "fulfillmentRate", "avgShippingDays", "disputeRate", "avgRating", "totalOrders" },
    "bankAccount": { "bankName", "maskedAccount", "paystackRecipientCode" }
  }
}
```

---

### PUT /supplier/profile

**Body** (all optional)
```json
{ "displayName": "Lagos Wholesale", "description": "...", "processingTimeDays": 2, "shipsTo": ["NG", "GH"] }
```

---

### POST /supplier/profile/bank-account/verify-account

Same as business bank account verify. Returns `{ accountName, bankName }`.

**Body:** `{ "bankCode": "057", "accountNumber": "2012345678" }`

---

### POST /supplier/profile/bank-account

Creates a Paystack Transfer Recipient (for outbound disbursements — different from seller subaccounts).

**Body:** `{ "bankCode": "057", "accountNumber": "2012345678", "accountName": "SUPPLIER NAME" }`

**201**
```json
{ "data": { "recipientCode": "RCP_xxxxxxxxxx", "bankName": "Zenith Bank", "maskedAccount": "****5678", "accountName": "SUPPLIER NAME" } }
```

**Errors:** `409 CONFLICT` · `400 PAYSTACK_ERROR`

---

## Staff Endpoints

All require `Authorization: Bearer` + active subscription, except `accept-invite` which is public.

---

### GET /staff

**200** `{ "data": { "staff": [{ "id", "invitedEmail", "status", "permissions", "joinedAt" }] } }`

---

### POST /staff/invite

**Body**
```json
{
  "email": "staff@example.com",
  "permissions": {
    "orders": { "view": true, "update_status": true },
    "payments": { "view": false },
    "customers": { "view": true },
    "products": { "view": true, "create": true, "update": true, "delete": false },
    "settings": { "view": false, "update": false }
  }
}
```

**201** `{ "data": { "staff": { "id", "invitedEmail", "status": "INVITED", "permissions" }, "message": "Invite sent to staff@example.com." } }`

**Errors:** `409 CONFLICT` already invited · `403 PLAN_LIMIT` seat limit reached

---

### POST /staff/accept-invite

**No auth required.** The invitee uses the token from their invite email. They must have a Varanda account registered with the same email first.

**Body:** `{ "token": "the_raw_invite_token_from_email" }`

**200**
```json
{
  "data": {
    "staff": { "id", "businessId", "businessName", "status": "ACTIVE", "permissions", "joinedAt" },
    "message": "Invite accepted. You can now log in to access this store."
  }
}
```

**Errors:** `400 INVALID_TOKEN` expired or invalid · `400 ACCOUNT_REQUIRED` no Varanda account for this email

---

### PUT /staff/:staffId/permissions

**Body:** `{ "permissions": { "orders": { "view": true, "update_status": false }, ... } }`

---

### PUT /staff/:staffId/suspend

No body.

---

### DELETE /staff/:staffId

Marks staff as REMOVED. Cannot be undone — re-invite if needed.

---

## Quick-Start — Phase 1 & 2 Call Order

```
1.  POST /auth/register
2.  POST /auth/verify-email          → save accessToken
3.  POST /auth/role/select           { role: "SELLER" }
4.  POST /subscriptions/select-plan  { tier: "STARTER" }
5.  GET  /plans
6.  GET  /banks                      → find bankCode for your bank
7.  PUT  /business                   { name, sector }
8.  PUT  /business/seo
9.  PUT  /business/address
10. GET  /cloudinary/sign?type=logo  → use params to upload logo to Cloudinary
11. POST /business/logo              { url, publicId }  ← from Cloudinary response
12. GET  /cloudinary/sign?type=document&context=national_id
13. POST /business/documents         { url, publicId, type: "NATIONAL_ID" }
14. PUT  /business/brand-settings
15. POST /business/social-links
16. PUT  /business/chatbot
17. POST /business/bank-account/verify-account
18. POST /business/bank-account
19. POST /business/domains/subdomain { subdomain: "mystore" }
20. GET  /subscriptions/current
21. POST /staff/invite               { email: "staff@..." }
```

**Supplier onboarding (separate account):**
```
1. POST /auth/register
2. POST /auth/verify-email
3. POST /auth/role/select            { role: "SUPPLIER" }
4. POST /supplier/profile/bank-account/verify-account
5. POST /supplier/profile/bank-account
6. PUT  /supplier/profile            { displayName, processingTimeDays, shipsTo }
```

---

## Phase 3 — Product Catalog, Bundles, Discounts & Inventory

All endpoints require `Authorization: Bearer <accessToken>` with an active subscription.

---

### Categories

#### GET /catalog/categories

Returns all categories as a tree (children nested under parents). Max 2 levels deep.

Query: `?includeInactive=true` to include inactive categories.

**200**
```json
{
  "data": {
    "categories": [{
      "id": "uuid", "name": "Footwear", "slug": "footwear",
      "description": "...", "sortOrder": 0, "isActive": true,
      "children": [{ "id": "uuid", "name": "Sneakers", "children": [] }]
    }]
  }
}
```

---

#### POST /catalog/categories

**Body**
```json
{ "name": "Footwear", "description": "Shoes and sandals", "sortOrder": 0, "parentId": null }
```

- `parentId` — optional UUID of a root category. Max 1 level of nesting.

**201** `{ "data": { "category": { "id", "name", "slug", "parentId", "sortOrder" } } }`

**Errors:** `400 DEPTH_LIMIT` if parentId is already a subcategory · `409 CONFLICT` slug taken

---

#### PUT /catalog/categories/:categoryId

**Body** (all optional): `name`, `description`, `sortOrder`, `isActive`, `parentId`

---

#### POST /catalog/categories/:categoryId/image

Upload the image via `GET /cloudinary/sign?type=category` first, then send the URL here.

**Body:** `{ "url": "https://res.cloudinary.com/...", "publicId": "..." }`

---

#### DELETE /catalog/categories/:categoryId

If the category has products, you must provide `reassignTo` (another category UUID or `null` to unassign).

**Body:** `{ "reassignTo": "uuid" | null }`

**Errors:** `409 CONFLICT` has products and no `reassignTo` provided

---

### Product Tags

#### GET /catalog/product-tags
#### POST /catalog/product-tags

**Body:** `{ "name": "New Arrival" }`

**Errors:** `409 CONFLICT` tag name already exists

#### DELETE /catalog/product-tags/:tagId

---

### Variant Option Types

Used to define the options a variable product can have (e.g. Size, Color). Each type has values.

#### GET /catalog/variant-option-types

Returns all option types with their values nested.

**200**
```json
{
  "data": {
    "optionTypes": [{
      "id": "uuid", "name": "Size", "displayType": "TEXT",
      "values": [{ "id": "uuid", "value": "M", "displayValue": null, "sortOrder": 0 }]
    }]
  }
}
```

---

#### POST /catalog/variant-option-types

**Body:** `{ "name": "Color", "displayType": "TEXT" | "COLOR_SWATCH" | "IMAGE" | "BUTTON" }`

**Errors:** `409 CONFLICT` name already exists for this business

---

#### POST /catalog/variant-option-types/:optionTypeId/values

**Body:** `{ "value": "Red", "displayValue": "#FF0000", "sortOrder": 0 }`

- `displayValue` — optional. For COLOR_SWATCH: hex code. For IMAGE: URL.

---

#### DELETE /catalog/variant-option-types/:optionTypeId/values/:valueId

**Errors:** `409 CONFLICT` value is in use by one or more variants

---

### Products

#### GET /catalog/products

Query: `?page&perPage&status=DRAFT|ACTIVE|ARCHIVED&categoryId&tagId&search&productType=OWN|DROPSHIP|THIRD_PARTY`

**200** Paginated list with `mainImageUrl`, `displayPrice`, `totalStock`.

---

#### POST /catalog/products

**Prerequisites:** Have a category ID from `GET /catalog/categories` (optional but recommended).

**Body**
```json
{
  "name": "Lagos Agbada",
  "basePrice": 25000,
  "status": "DRAFT",
  "isVariable": false,
  "trackInventory": true,
  "categoryId": "uuid",
  "description": "Premium agbada set",
  "shortDescription": "Agbada set",
  "compareAtPrice": 30000,
  "costPrice": 15000,
  "currency": "NGN",
  "isFeatured": false,
  "weight": 1.2,
  "seoTitle": "Lagos Agbada",
  "seoDescription": "...",
  "tagIds": ["uuid"],
  "stockQuantity": 50
}
```

- `isVariable: true` — enables variants. Do not set `stockQuantity` for variable products; stock is tracked per variant.
- `stockQuantity` — only for non-variable products. Creates an initial stock movement record.

**201** `{ "data": { "product": { "id", "name", "slug", "status", "productType": "OWN" } } }`

**Errors:** `403 PLAN_LIMIT` product limit reached · `409 CONFLICT` slug taken

---

#### GET /catalog/products/:productId

Returns full product with images, variants (with option values), and tags.

---

#### PUT /catalog/products/:productId

Same fields as POST, all optional. Slug regenerates automatically if name changes.

---

#### DELETE /catalog/products/:productId

Soft delete — product is hidden but not removed from the database.

---

### Product Images

Upload images via `GET /cloudinary/sign?type=product&context=<productId>` first.

#### POST /catalog/products/:productId/images

**Body**
```json
{
  "images": [
    { "url": "https://res.cloudinary.com/...", "publicId": "...", "altText": "Front view", "isMain": true },
    { "url": "https://res.cloudinary.com/...", "publicId": "...", "altText": "Side view" }
  ]
}
```

The first image is automatically set as main if no images exist yet.

**201** `{ "data": { "images": [{ "id", "url", "isMain", "sortOrder" }] } }`

---

#### PUT /catalog/products/:productId/images/reorder

**Body:** `{ "images": [{ "id": "uuid", "sortOrder": 0 }, { "id": "uuid", "sortOrder": 1 }] }`

---

#### PUT /catalog/products/:productId/images/:imageId/set-main

No body. Sets this image as the main product image.

---

#### DELETE /catalog/products/:productId/images/:imageId

Also deletes the image from Cloudinary.

---

### Product Option Type Assignments

Before creating variants, you assign which option types a product uses and optionally restrict which values from each type are available. This is the layer between "business-level option types" (e.g. a Size type with S, M, L, XL) and the actual variants.

**Example:** Your business has a Size option type with values S, M, L, XL. For a specific product you only stock S and M. You assign the Size type to that product with `enabledValueIds: [uuid-S, uuid-M]`. Now only S and M can be used when creating variants for that product. Later you can add L by updating the assignment.

#### GET /catalog/products/:productId/option-types

Returns the option types assigned to this product with their enabled values.

**200**
```json
{
  "data": {
    "optionTypeAssignments": [
      {
        "id": "uuid",
        "optionTypeId": "uuid",
        "optionTypeName": "Size",
        "displayType": "TEXT",
        "enabledValueIds": ["uuid-S", "uuid-M"],
        "enabledValues": [
          { "id": "uuid-S", "value": "S", "displayValue": null, "sortOrder": 0 },
          { "id": "uuid-M", "value": "M", "displayValue": null, "sortOrder": 1 }
        ],
        "sortOrder": 0
      }
    ]
  }
}
```

If `enabledValueIds` is `null`, all values of that option type are available for this product.

---

#### POST /catalog/products/:productId/option-types

Assign an option type to a product. Requires `isVariable: true` on the product.

**Body**
```json
{
  "optionTypeId": "uuid",
  "enabledValueIds": ["uuid-S", "uuid-M"],
  "sortOrder": 0
}
```

- `enabledValueIds: null` — all values of this type are available (default).
- `enabledValueIds: [uuid, ...]` — only these values can be used when creating variants.

**Errors:** `404 NOT_FOUND` option type not found · `422` product is not variable

---

#### PUT /catalog/products/:productId/option-types/:optionTypeId

Update which values are enabled for an already-assigned option type.

**Body**
```json
{ "enabledValueIds": ["uuid-S", "uuid-M", "uuid-L"] }
```

Pass `null` to re-enable all values. This does not affect existing variants — it only controls which values are available when creating new ones.

---

#### DELETE /catalog/products/:productId/option-types/:optionTypeId

Remove an option type from a product.

**Errors:** `409 OPTION_TYPE_IN_USE` active variants use values from this type — delete or update those variants first.

---

### Variants

Only available on products where `isVariable: true`.

**Recommended flow:**
1. Create option types at the business level (`POST /catalog/variant-option-types`)
2. Add values to each type (`POST /catalog/variant-option-types/:id/values`)
3. Assign the option types to the product, specifying which values are enabled (`POST /catalog/products/:productId/option-types`)
4. Create variants using only the enabled value IDs (`POST /catalog/products/:productId/variants`)

#### POST /catalog/products/:productId/variants

**Body**
```json
{
  "sku": "AGD-M-BLK",
  "price": 25000,
  "compareAtPrice": 30000,
  "costPrice": 15000,
  "stockQuantity": 50,
  "optionValueIds": ["uuid-for-Medium", "uuid-for-Black"],
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "varanda/products/agd-m-blk",
  "weight": 1.2
}
```

- `optionValueIds` — must be values that are enabled for this product (via option type assignments). Each combination must be unique across variants.
- `imageUrl` / `imagePublicId` — optional variant-specific image. This is separate from the product gallery — upload to Cloudinary first using `GET /cloudinary/sign?type=product&context=<productId>`, then pass the URL here. The image appears when this variant is selected on the storefront.

**Errors:** `409 DUPLICATE_VARIANT` combination already exists · `422 OPTION_VALUE_NOT_ENABLED` value not enabled for this product · `422` product is not variable

---

#### PUT /catalog/products/:productId/variants/:variantId

All fields optional. You can update the option value assignments by passing `optionValueIds` — this replaces the current assignments and validates the new combination is unique.

**Body**
```json
{
  "price": 27000,
  "stockQuantity": 30,
  "isActive": false,
  "imageUrl": "https://res.cloudinary.com/...",
  "optionValueIds": ["uuid-for-Large", "uuid-for-Black"]
}
```

- `isActive: false` — hides this variant from the storefront without deleting it. Use this to temporarily take down a specific size/color.

---

#### POST /catalog/products/:productId/variants/bulk-stock

Update stock for multiple variants at once. Each change writes a stock movement record.

**Body:** `{ "updates": [{ "variantId": "uuid", "stockQuantity": 50 }] }`

---

#### DELETE /catalog/products/:productId/variants/:variantId

Soft delete. The variant is hidden from the storefront and excluded from inventory counts.

---

#### POST /catalog/products/:productId/duplicate

No body. Creates a copy of the product with status `DRAFT` and name `"<original> (Copy)"`.

---

### Inventory Tracking Logic

Inventory tracking is controlled by two fields on the product: `trackInventory` and `isVariable`.

**Non-variable products (`isVariable: false`)**

Stock is tracked at the product level. There are no variant rows. The `stockQuantity` field on `POST /catalog/products` creates an initial `stock_movements` record. Subsequent adjustments go through `POST /inventory/adjust` (which requires a `variantId` — for non-variable products, create a single "default" variant to hold the stock, or track it externally).

> Practical note: for non-variable products with `trackInventory: true`, the recommended pattern is to create one variant with no option values assigned. This keeps inventory tracking consistent — all stock lives in `product_variants.stock_quantity` regardless of whether the product has options.

**Variable products (`isVariable: true`)**

Stock is tracked per variant. Each variant has its own `stock_quantity`. The total stock shown in product listings is the sum of all active variant stock quantities. When an order is placed, the specific variant's `stock_quantity` is decremented and a `stock_movements` record is written with `movement_type = 'SALE'`.

**`trackInventory: false`**

The product is treated as always in stock. No stock checks are performed at checkout. No `stock_movements` records are written for sales. Use this for digital products, services, or made-to-order items.

**Stock movement types**

| Type | When written |
|------|-------------|
| `VARIANT_CREATION` | Initial stock when a variant is created |
| `IMPORT` | Initial stock when a non-variable product is created |
| `SALE` | Order placed — stock decremented |
| `RETURN` | Order refunded — stock restored |
| `MANUAL_INCREASE` | Manual adjustment via `/inventory/adjust` or bulk-stock |
| `MANUAL_DECREASE` | Manual adjustment via `/inventory/adjust` |
| `BUNDLE_SALE` | Bundle order — each component variant decremented |

---

### CSV Import

#### GET /catalog/products/import/template

Downloads a CSV template file. Use this to format your bulk import.

**Response:** `text/csv` file download.

---

### Bundles

A bundle groups multiple products at a single price.

#### GET /catalog/bundles
#### POST /catalog/bundles

**Prerequisites:** Have at least one product ID.

**Body**
```json
{
  "name": "Starter Pack",
  "price": 45000,
  "description": "Two products bundled",
  "isActive": true,
  "items": [
    { "productId": "uuid", "variantId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

**201** Returns full bundle with items, `individualTotal` (sum of item prices), and `savings`.

---

#### GET /catalog/bundles/:bundleId
#### PUT /catalog/bundles/:bundleId

Same fields as POST, all optional. Providing `items` replaces the entire item list.

---

#### DELETE /catalog/bundles/:bundleId

#### POST /catalog/bundles/:bundleId/image

Upload via `GET /cloudinary/sign?type=bundle` first.

**Body:** `{ "url": "...", "publicId": "..." }`

---

### Discounts

#### GET /discounts
#### POST /discounts

**Body**
```json
{
  "code": "SAVE20",
  "type": "PERCENTAGE",
  "value": 20,
  "minimumOrder": 10000,
  "usageLimit": 100,
  "perCustomerLimit": 1,
  "startsAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-12-31T23:59:59Z",
  "isActive": true
}
```

- `type` — `PERCENTAGE` (value = percent off) · `FIXED_AMOUNT` (value = naira off) · `FREE_SHIPPING`
- `code` — automatically uppercased. Alphanumeric, hyphens, underscores only.

**Errors:** `409 CONFLICT` code already exists

---

#### PUT /discounts/:discountId

Same fields as POST, all optional.

---

#### DELETE /discounts/:discountId

#### GET /discounts/:discountId/usages

Returns a paginated list of every time this code was used, with order numbers.

---

### Inventory

#### GET /inventory/movements

Query: `?variantId&productId&page&perPage`

Returns stock movement history with product name, variant SKU, movement type, before/after quantities.

---

#### POST /inventory/adjust

Manually adjust stock for a single variant. Always writes an audit record.

**Body**
```json
{
  "variantId": "uuid",
  "quantityChange": -5,
  "movementType": "MANUAL_DECREASE",
  "note": "Damaged stock removed"
}
```

- `movementType` — `MANUAL_INCREASE` · `MANUAL_DECREASE` · `RETURN`
- `quantityChange` — positive to add, negative to remove. Cannot go below zero.

**200**
```json
{ "data": { "movement": { "id", "movementType", "quantityChange" }, "stockBefore": 50, "stockAfter": 45 } }
```

**Errors:** `400 INVALID_STOCK` would go below zero · `404 NOT_FOUND` variant not found

---

#### GET /inventory/low-stock

Query: `?threshold=5` (default 5)

Returns all variants where `stock_quantity <= threshold`, ordered by stock ascending.

---

## Phase 4 — Supplier Marketplace (Partial — browse & import)

These endpoints are available to sellers with an active subscription. All prices returned are **display prices** (supplier price + 2% markup). The true supplier price is never exposed.

---

### GET /marketplace/categories

No additional auth beyond seller subscription.

**200**
```json
{ "data": { "categories": [{ "id", "name", "slug", "imageUrl", "children": [] }] } }
```

---

### GET /marketplace/products

Query: `?page&perPage&categoryId&supplierId&search&minPrice&maxPrice&sort=popular|newest|price_low&shipsTo=NG`

**200** Each product:
```json
{
  "id": "uuid",
  "name": "Ankara Print Fabric",
  "supplierName": "Lagos Wholesale",
  "supplierVerified": true,
  "displayPrice": 5100,
  "suggestedRetailPrice": 8000,
  "estimatedMargin": 2900,
  "estimatedMarginPercent": 36.9,
  "mainImageUrl": "...",
  "totalOrders": 342,
  "avgRating": 4.7,
  "processingTimeDays": 2,
  "shipsTo": ["NG", "GH"],
  "alreadyImported": false,
  "importId": null
}
```

---

### GET /marketplace/products/:productId

Full product detail for seller view. Includes all variants with display prices, supplier summary, and `alreadyImported` flag.

---

### GET /marketplace/suppliers

Query: `?page&perPage&search&verified=true`

---

### GET /marketplace/suppliers/:supplierId

Public supplier profile + their active products.

---

### POST /marketplace/import

Import a marketplace product into your store. Creates a `DROPSHIP` product in your catalog.

**Prerequisites:**
1. Browse marketplace and note a `supplierProductId`
2. Note the `displayPrice` — your `retailPrice` must be >= this

**Body**
```json
{
  "supplierProductId": "uuid",
  "retailPrice": 7000,
  "compareAtPrice": 9000,
  "customTitle": null,
  "customDescription": null,
  "variantPrices": [
    { "supplierVariantId": "uuid", "retailPrice": 7000 },
    { "supplierVariantId": "uuid", "retailPrice": 8500 }
  ]
}
```

**201**
```json
{
  "data": {
    "import": { "id", "supplierProductId", "storeProductId", "retailPrice", "sellerMargin": 1900 },
    "storeProduct": { "id", "name", "slug", "status": "DRAFT" }
  }
}
```

**Errors:** `409 ALREADY_IMPORTED` includes `{ "importId": "uuid" }` · `403 PLAN_LIMIT` import limit reached · `400 PRODUCT_UNAVAILABLE` not active · `400 PRICE_TOO_LOW` retailPrice < displayPrice

---

### GET /marketplace/imports

Query: `?page&perPage&status`

---

### PUT /marketplace/imports/:importId

Update retail price or custom title/description.

**Body** (all optional): `{ "retailPrice": 7500, "customTitle": "...", "customDescription": "..." }`

---

### DELETE /marketplace/imports/:importId

**Errors:** `409 CONFLICT` has pending or processing orders

---

## Postman Quick-Start — Phase 3

```
Prerequisites: Completed Phase 1 & 2 (logged in, have subscription)

1.  POST /catalog/categories          { name: "Clothing" }           → save CATEGORY_ID
2.  POST /catalog/product-tags        { name: "New Arrival" }        → save TAG_ID
3.  POST /catalog/variant-option-types { name: "Size", displayType: "TEXT" } → save OT_ID
4.  POST /catalog/variant-option-types/:OT_ID/values { value: "M" } → save OV_ID_M
5.  POST /catalog/variant-option-types/:OT_ID/values { value: "L" } → save OV_ID_L
6.  POST /catalog/products            { name, basePrice, isVariable: true, categoryId, tagIds } → save PRODUCT_ID
7.  POST /catalog/products/:PRODUCT_ID/option-types  { optionTypeId: OT_ID, enabledValueIds: [OV_ID_M, OV_ID_L] }
8.  GET  /cloudinary/sign?type=product&context=PRODUCT_ID            → use params to upload image
9.  POST /catalog/products/:PRODUCT_ID/images { images: [{ url, publicId, isMain: true }] }
10. POST /catalog/products/:PRODUCT_ID/variants { price, stockQuantity: 30, optionValueIds: [OV_ID_M] }
11. POST /catalog/products/:PRODUCT_ID/variants { price, stockQuantity: 20, optionValueIds: [OV_ID_L] }
    -- Take down L without deleting: PUT /catalog/products/:PRODUCT_ID/variants/:VAR_L_ID { isActive: false }
12. POST /discounts                   { code: "SAVE10", type: "PERCENTAGE", value: 10 }
13. GET  /inventory/low-stock?threshold=5
14. GET  /inventory/movements
```

**Marketplace import (Phase 4 partial):**
```
1. GET  /marketplace/categories       → save MKT_CAT_ID
2. GET  /marketplace/products         → find a product, note displayPrice and supplierProductId
3. POST /marketplace/import           { supplierProductId, retailPrice: displayPrice + margin }
```

---

## Phase 4 — Supplier Marketplace System (Full)

---

### Supplier Product Management

All require `Authorization: Bearer` with a supplier profile (`has_supplier_profile = true`).

---

#### GET /supplier/products

Query: `?page&perPage&status=DRAFT|PENDING_REVIEW|ACTIVE|PAUSED|REJECTED&search`

Returns the supplier's own listings. Prices shown are the **true supplier prices** (supplier view only).

**200**
```json
{
  "data": {
    "products": [{
      "id", "name", "slug", "supplier_price", "suggested_retail_price",
      "status", "total_imports", "total_orders", "main_image_url", "stock_total"
    }]
  },
  "meta": { "page", "perPage", "total", "totalPages" }
}
```

---

#### POST /supplier/products

**Prerequisites:** Get a `marketplaceCategoryId` from `GET /marketplace/categories` (use seller token — supplier-only users cannot browse marketplace).

**Body**
```json
{
  "name": "Ankara Print Fabric",
  "marketplaceCategoryId": "uuid",
  "supplierPrice": 5000,
  "suggestedRetailPrice": 8000,
  "currency": "NGN",
  "isVariable": false,
  "trackInventory": true,
  "processingTimeDays": 2,
  "description": "High quality 6-yard ankara...",
  "weight": 0.8,
  "tags": ["ankara", "fabric"],
  "seoTitle": "...",
  "seoDescription": "..."
}
```

- `supplierPrice` — the TRUE price. Never returned to sellers or developers. Only visible to the supplier.
- `suggestedRetailPrice` — optional hint to sellers for pricing.

**201** `{ "data": { "product": { "id", "name", "slug", "status": "DRAFT", "supplier_price": 5000 } } }`

---

#### GET /supplier/products/:productId

Returns full product with images, variants, and true `supplier_price`.

---

#### PUT /supplier/products/:productId

Same fields as POST, all optional. If `supplierPrice` changes and product is ACTIVE, all sellers who imported it receive a notification email.

**200** `{ "data": { "product": { ...updated... }, "importersNotified": 3 } }`

---

#### DELETE /supplier/products/:productId

Soft delete. Product must be PAUSED or REJECTED first — cannot delete an ACTIVE product.

**Errors:** `400 INVALID_STATUS` product is ACTIVE — pause it first

---

### Supplier Product Images

Upload images via `GET /cloudinary/sign?type=supplier_product` first.

#### POST /supplier/products/:productId/images

**Body**
```json
{
  "images": [
    { "url": "https://res.cloudinary.com/...", "publicId": "...", "altText": "Front view", "isMain": true },
    { "url": "https://res.cloudinary.com/...", "publicId": "..." }
  ]
}
```

**201** `{ "data": { "images": [{ "id", "url", "isMain", "sortOrder" }] } }`

---

#### PUT /supplier/products/:productId/images/reorder

**Body:** `{ "images": [{ "id": "uuid", "sortOrder": 0 }] }`

---

#### DELETE /supplier/products/:productId/images/:imageId

---

### Supplier Product Variants

Supplier variants use a **denormalized JSONB structure** — no relational option type system. The supplier defines variant labels and option values directly.

#### POST /supplier/products/:productId/variants

**Body**
```json
{
  "variantLabel": "Red / Large",
  "sku": "ANK-RED-L",
  "supplierPrice": 5000,
  "suggestedRetailPrice": 8000,
  "stockQuantity": 50,
  "optionValues": [
    { "typeName": "Color", "value": "Red", "displayValue": "#FF0000" },
    { "typeName": "Size", "value": "Large" }
  ],
  "weight": 0.8
}
```

**201** `{ "data": { "variant": { "id", "variantLabel", "supplier_price", "stock_quantity" } } }`

---

#### PUT /supplier/products/:productId/variants/:variantId

Same fields as POST, all optional.

---

#### DELETE /supplier/products/:productId/variants/:variantId

Soft delete. Blocked if there are pending orders for this variant.

---

### Supplier Product Status Transitions

```
DRAFT → PENDING_REVIEW  (via POST /supplier/products/:id/submit)
PENDING_REVIEW → ACTIVE  (via admin approval)
PENDING_REVIEW → REJECTED  (via admin rejection)
ACTIVE → PAUSED  (via POST /supplier/products/:id/pause)
PAUSED → ACTIVE  (via POST /supplier/products/:id/reactivate)
REJECTED → PENDING_REVIEW  (via POST /supplier/products/:id/reactivate — re-submits)
```

#### POST /supplier/products/:productId/submit

Moves product from DRAFT to PENDING_REVIEW. Triggers admin notification.

**Prerequisites before submitting:**
- At least one product image uploaded
- `marketplaceCategoryId` set
- `supplierPrice` > 0

**200** `{ "data": { "product": { "status": "PENDING_REVIEW" } } }`

**Errors:** `400 INCOMPLETE_PRODUCT` missing image, category, or price · `400 INVALID_STATUS` not in DRAFT

---

#### POST /supplier/products/:productId/pause

Moves ACTIVE → PAUSED. Notifies all sellers who imported this product.

**200** `{ "data": { "product": { "status": "PAUSED" }, "importersNotified": 3 } }`

---

#### POST /supplier/products/:productId/reactivate

- From PAUSED → ACTIVE (immediate)
- From REJECTED → PENDING_REVIEW (re-submits for admin review)

---

### Supplier Revenue & Orders

#### GET /supplier/revenue

Query: `?period=7d|30d|90d|ytd`

**200**
```json
{
  "data": {
    "totalEarned": 150000,
    "pendingEscrow": 25000,
    "awaitingConfirmation": 10000,
    "availableForWithdrawal": 150000,
    "periodRevenue": 45000,
    "periodOrders": 9
  }
}
```

---

#### POST /supplier/withdrawals

**Body:** `{ "amount": 50000 }`

**Errors:** `400 INSUFFICIENT_BALANCE`

---

#### GET /supplier/orders

Query: `?page&perPage&status`

Returns all dropship orders routed to this supplier.

---

#### PUT /supplier/orders/:dropshipOrderId/confirm

Supplier confirms they are processing. PENDING → CONFIRMED.

---

#### PUT /supplier/orders/:dropshipOrderId/ship

**THE CRITICAL FULFILLMENT ENDPOINT.** Sets status to SHIPPED. Triggers escrow → AWAITING_SELLER_CONFIRMATION. Seller receives a notification to confirm or dispute.

**Body**
```json
{ "trackingNumber": "GIG-2024-001", "carrierName": "GIG Logistics", "trackingUrl": "https://..." }
```

**200**
```json
{
  "data": {
    "dropshipOrder": {
      "status": "SHIPPED",
      "sellerConfirmationStatus": "PENDING",
      "shippedAt": "...",
      "message": "Order marked as shipped. Awaiting seller confirmation to release escrow."
    }
  }
}
```

**Errors:** `400 ALREADY_SHIPPED` · `400 INVALID_STATUS` must be CONFIRMED first

---

### Seller Dropship Order Management

Auth: Bearer + seller subscription.

#### GET /seller/dropship-orders

Query: `?page&perPage&status&sellerConfirmationStatus`

---

#### GET /seller/dropship-orders/:dropshipOrderId

---

#### PUT /seller/dropship-orders/:dropshipOrderId/confirm

**THE ESCROW RELEASE TRIGGER.** Seller confirms the supplier shipped. Triggers Paystack Transfer to supplier.

**200**
```json
{
  "data": {
    "dropshipOrder": { "status": "DELIVERED", "sellerConfirmationStatus": "CONFIRMED" },
    "revenueSplit": { "supplierReceived": 5000, ... },
    "message": "Escrow released. Supplier has been paid ₦5,000."
  }
}
```

**Errors:** `400 INVALID_STATUS` supplier hasn't shipped yet · `503 PAYSTACK_TRANSFER_FAILED`

---

#### PUT /seller/dropship-orders/:dropshipOrderId/dispute

Freezes escrow. Alerts admin.

**Body**
```json
{
  "reason": "NOT_DELIVERED" | "WRONG_ITEM" | "DAMAGED" | "NOT_AS_DESCRIBED" | "OTHER",
  "description": "Customer says item never arrived...",
  "evidenceUrls": ["https://..."]
}
```

**Errors:** `400 INVALID_STATUS` not in AWAITING_SELLER_CONFIRMATION state

---

### Admin — Marketplace & Disputes

Auth: Bearer + admin role.

#### GET /admin/marketplace/products

Query: `?status=PENDING_REVIEW&supplierId`

#### PUT /admin/marketplace/products/:productId/approve

No body. Sets status to ACTIVE.

#### PUT /admin/marketplace/products/:productId/reject

**Body:** `{ "reason": "Images are too low quality." }`

#### GET /admin/suppliers

#### PUT /admin/suppliers/:supplierId/verify

#### GET /admin/disputes

Query: `?status=OPEN`

#### PUT /admin/disputes/:disputeId/resolve

**Body**
```json
{
  "resolution": "Investigated — supplier never shipped.",
  "action": "RELEASE" | "REFUND" | "SPLIT",
  "banSupplierId": "uuid",
  "banSellerId": "uuid"
}
```

- `RELEASE` — transfer escrow to supplier (supplier was truthful)
- `REFUND` — keep escrow in Varanda account (seller was truthful — seller refunds their own customer)
- `SPLIT` — custom resolution

---

## UI/UX Flow → API Mapping

This maps every screen and action in the UI/UX spec to the exact API call(s) that power it.

---

### Registration & Onboarding

| UI Action | API Call |
|-----------|----------|
| Sign Up form submit | `POST /auth/register` |
| OTP entry (auto-submit on 6 digits) | `POST /auth/verify-email` |
| Resend code link | `POST /auth/register` (re-registers same email — invalidates old OTP) |
| Pricing page — "Start Free Trial" (Starter) | `POST /subscriptions/select-plan { tier: "STARTER" }` |
| Pricing page — "Skip for now" | `POST /subscriptions/select-plan { tier: "STARTER" }` |
| Pricing page — Pro/Growth card CTA | `POST /subscriptions/select-plan { tier: "PRO" }` → returns `checkoutUrl` |
| Flutterwave checkout completes | Flutterwave fires `POST /webhooks/flutterwave` automatically |
| Business Setup Step 1 — save name/sector | `PUT /business { name, sector, tagline, description, currency, timezone }` |
| Business Setup Step 2 — save address | `PUT /business/address` |
| Business Setup Step 2 — upload document | `GET /cloudinary/sign?type=document` → upload → `POST /business/documents` |
| Business Setup Step 3 — upload logo | `GET /cloudinary/sign?type=logo` → upload → `POST /business/logo` |
| Business Setup Step 3 — upload favicon | `GET /cloudinary/sign?type=favicon` → upload → `POST /business/favicon` |
| Business Setup Step 3 — save brand colors/fonts | `PUT /business/brand-settings` |
| Business Setup Step 4 — claim subdomain | `POST /business/domains/subdomain` |
| Business Setup Step 4 — connect custom domain | `POST /business/domains/custom` |
| Business Setup Step 4 — verify DNS | `POST /business/domains/:domainId/verify` |
| Login | `POST /auth/login` |
| Forgot password — send code | `POST /auth/forgot-password` |
| Forgot password — enter code + new password | `POST /auth/reset-password` |
| Logout | `POST /auth/logout` |

---

### Billing & Subscription

| UI Action | API Call |
|-----------|----------|
| Load billing page | `GET /subscriptions/current` |
| Load plan comparison | `GET /plans` |
| Upgrade plan (card on file) | `POST /subscriptions/upgrade` |
| Upgrade plan (no card) | `POST /subscriptions/initiate-paid` → returns `checkoutUrl` |
| Cancel subscription | `POST /subscriptions/cancel` |
| Load bank list for Varanda Pay setup | `GET /banks` |
| Verify bank account | `POST /business/bank-account/verify-account` |
| Activate Varanda Pay | `POST /business/bank-account` |
| Update bank account | `PUT /business/bank-account` |
| Connect Flutterwave/Stripe | `POST /business/integrations/payment/connect` |
| Disconnect custom gateway | `DELETE /business/integrations/payment/:gateway/disconnect` |

---

### Products

| UI Action | API Call |
|-----------|----------|
| Load products list | `GET /catalog/products` |
| Search/filter products | `GET /catalog/products?search=&status=&categoryId=&tagId=` |
| Open add product form | — (client-side) |
| Save product (draft or active) | `POST /catalog/products` |
| Edit product | `PUT /catalog/products/:productId` |
| Upload product image | `GET /cloudinary/sign?type=product&context=<productId>` → upload → `POST /catalog/products/:productId/images` |
| Reorder images | `PUT /catalog/products/:productId/images/reorder` |
| Set main image | `PUT /catalog/products/:productId/images/:imageId/set-main` |
| Delete image | `DELETE /catalog/products/:productId/images/:imageId` |
| Enable variants toggle | `PUT /catalog/products/:productId { isVariable: true }` |
| Assign option type to product | `POST /catalog/products/:productId/option-types { optionTypeId, enabledValueIds }` |
| Update enabled values for option type | `PUT /catalog/products/:productId/option-types/:optionTypeId { enabledValueIds }` |
| Remove option type from product | `DELETE /catalog/products/:productId/option-types/:optionTypeId` |
| Create option type (e.g. "Size") | `POST /catalog/variant-option-types` |
| Add option value (e.g. "M") | `POST /catalog/variant-option-types/:optionTypeId/values` |
| Create variant row | `POST /catalog/products/:productId/variants` |
| Edit variant (price, stock, image, options) | `PUT /catalog/products/:productId/variants/:variantId` |
| Take down a specific variant | `PUT /catalog/products/:productId/variants/:variantId { isActive: false }` |
| Bulk stock update | `POST /catalog/products/:productId/variants/bulk-stock` |
| Duplicate product | `POST /catalog/products/:productId/duplicate` |
| Archive/delete product | `DELETE /catalog/products/:productId` |
| Download CSV template | `GET /catalog/products/import/template` |

---

### Categories

| UI Action | API Call |
|-----------|----------|
| Load category tree | `GET /catalog/categories` |
| Add category | `POST /catalog/categories` |
| Edit category | `PUT /catalog/categories/:categoryId` |
| Upload category image | `GET /cloudinary/sign?type=category` → upload → `POST /catalog/categories/:categoryId/image` |
| Delete category (with reassign) | `DELETE /catalog/categories/:categoryId` with body `{ reassignTo: "uuid" }` |

---

### Bundles

| UI Action | API Call |
|-----------|----------|
| Load bundles list | `GET /catalog/bundles` |
| Create bundle | `POST /catalog/bundles` |
| Edit bundle | `PUT /catalog/bundles/:bundleId` |
| Upload bundle image | `GET /cloudinary/sign?type=bundle` → upload → `POST /catalog/bundles/:bundleId/image` |
| Delete bundle | `DELETE /catalog/bundles/:bundleId` |

---

### Discounts

| UI Action | API Call |
|-----------|----------|
| Load discount codes list | `GET /discounts` |
| Create discount code | `POST /discounts` |
| Edit discount code | `PUT /discounts/:discountId` |
| Delete discount code | `DELETE /discounts/:discountId` |
| View usage history | `GET /discounts/:discountId/usages` |

---

### Inventory

| UI Action | API Call |
|-----------|----------|
| Load inventory table | `GET /inventory/movements` |
| Adjust stock (inline form) | `POST /inventory/adjust` |
| View low stock items | `GET /inventory/low-stock?threshold=5` |
| Dashboard low-stock badge count | `GET /inventory/low-stock` (count from response) |

---

### Staff

| UI Action | API Call |
|-----------|----------|
| Load staff list | `GET /staff` |
| Invite team member | `POST /staff/invite` |
| Accept invite (invitee clicks email link) | `POST /staff/accept-invite` (public — no auth) |
| Edit permissions | `PUT /staff/:staffId/permissions` |
| Suspend staff | `PUT /staff/:staffId/suspend` |
| Remove staff | `DELETE /staff/:staffId` |

---

### Supplier Dashboard

| UI Action | API Call |
|-----------|----------|
| Load supplier profile | `GET /supplier/profile` |
| Update display name / shipping regions | `PUT /supplier/profile` |
| Verify bank account | `POST /supplier/profile/bank-account/verify-account` |
| Register bank account | `POST /supplier/profile/bank-account` |
| Load products list | `GET /supplier/products` |
| Create product | `POST /supplier/products` |
| Upload product image | `GET /cloudinary/sign?type=supplier_product` → upload → `POST /supplier/products/:productId/images` |
| Add variant | `POST /supplier/products/:productId/variants` |
| Submit for review | `POST /supplier/products/:productId/submit` |
| Pause product | `POST /supplier/products/:productId/pause` |
| Reactivate product | `POST /supplier/products/:productId/reactivate` |
| Load orders | `GET /supplier/orders` |
| Confirm order (start processing) | `PUT /supplier/orders/:dropshipOrderId/confirm` |
| Mark as shipped | `PUT /supplier/orders/:dropshipOrderId/ship` |
| View revenue dashboard | `GET /supplier/revenue?period=30d` |
| Request withdrawal | `POST /supplier/withdrawals` |

---

### Marketplace (Seller browsing supplier products)

| UI Action | API Call |
|-----------|----------|
| Browse marketplace | `GET /marketplace/products` |
| Filter by category | `GET /marketplace/products?categoryId=uuid` |
| Search marketplace | `GET /marketplace/products?search=ankara` |
| View product detail | `GET /marketplace/products/:productId` |
| View supplier profile | `GET /marketplace/suppliers/:supplierId` |
| Import product to store | `POST /marketplace/import` |
| View my imports | `GET /marketplace/imports` |
| Update import retail price | `PUT /marketplace/imports/:importId` |
| Remove import | `DELETE /marketplace/imports/:importId` |
| Confirm dropship delivery | `PUT /seller/dropship-orders/:dropshipOrderId/confirm` |
| Raise dispute | `PUT /seller/dropship-orders/:dropshipOrderId/dispute` |

---

### Website Builder

| UI Action | API Call |
|-----------|----------|
| Load template gallery | `GET /builder/templates` |
| Preview then apply template (first time) | `POST /builder/apply-template { templateId }` |
| Apply template (replacing existing design) | `POST /builder/apply-template { templateId, confirm: true }` |
| Load page list (sidebar tree) | `GET /builder/pages` |
| Load full page schema (open a page) | `GET /builder/pages/:pageType` |
| Replace entire page schema | `PUT /builder/pages/:pageType/schema` |
| Update page SEO fields | `PUT /builder/pages/:pageType/seo` |
| Create custom page | `POST /builder/pages/custom` |
| Add section between existing sections | `POST /builder/pages/:pageType/sections` |
| Edit section config (right panel) | `PUT /builder/pages/:pageType/sections/:sectionId` |
| Delete section | `DELETE /builder/pages/:pageType/sections/:sectionId` |
| Drag to reorder sections | `PUT /builder/pages/:pageType/sections/reorder` |
| Add component inside a section | `POST /builder/pages/:pageType/sections/:sectionId/components` |
| Edit component config (right panel) | `PUT /builder/pages/:pageType/sections/:sectionId/components/:componentId` |
| Delete component | `DELETE /builder/pages/:pageType/sections/:sectionId/components/:componentId` |
| Publish store button | `POST /builder/publish` |
| Unpublish store | `POST /builder/unpublish` |

### Storefront (Public — customer-facing)

| UI Action | API Call |
|-----------|----------|
| Storefront initial load (brand, home schema, nav) | `GET /storefront` (with `X-Tenant-Domain` header) |
| Load a custom page by slug | `GET /storefront/pages/:slug` |
| Load category list (filter sidebar) | `GET /storefront/categories` |
| Load product grid | `GET /storefront/products` |
| Load product detail page | `GET /storefront/products/:slug` |
| Load policy page | `GET /storefront/policies/:slug` |

---

### Shipping (Phase 6 — stubs live)

| UI Action | API Call |
|-----------|----------|
| Load shipping zones | `GET /shipping/zones` |
| Create zone | `POST /shipping/zones` |
| Add region to zone | `POST /shipping/zones/:zoneId/regions` |
| Add rate to zone | `POST /shipping/zones/:zoneId/rates` |
| Connect Shipbubble | `POST /integrations/shipbubble/connect` |
| Set pickup address | `PUT /integrations/shipbubble/origin-address` |

---

### Analytics (Phase 9 — stubs live)

| UI Action | API Call |
|-----------|----------|
| Load analytics dashboard | `GET /analytics/summary?period=30d` |
| Load chart data | `GET /analytics/chart?period=30d&metric=revenue` |
| Load top products | `GET /analytics/products` |
| Load traffic sources | `GET /analytics/referrers` |

---

### CRM & Campaigns (Phase 9 — stubs live)

| UI Action | API Call |
|-----------|----------|
| Load customer list | `GET /crm/customers` |
| View customer detail | `GET /crm/customers/:id` |
| Add customer note | `POST /crm/customers/:id/notes` |
| Assign tag to customer | `POST /crm/customers/:id/tags` |
| Export customers CSV | `GET /crm/customers/export` |
| Create campaign | `POST /campaigns` |
| Send campaign | `POST /campaigns/:id/send` |
| Schedule campaign | `POST /campaigns` with `scheduledAt` field |

---

### Invoices (Phase 9 — stubs live)

| UI Action | API Call |
|-----------|----------|
| Generate invoice from order | `POST /invoices/from-order/:orderId` |
| Download invoice PDF | `GET /invoices/:id/pdf` |
| Send invoice to customer | `POST /invoices/:id/send` |
| Create manual invoice | `POST /invoices` |

---

## Postman Quick-Start — Phase 4

```
Prerequisites: Phase 1–3 complete. Have a supplier account and a seller account.

Supplier flow:
1. POST /auth/login (supplier)
2. GET  /supplier/profile
3. POST /supplier/profile/bank-account/verify-account  { bankCode, accountNumber }
4. POST /supplier/profile/bank-account
5. GET  /marketplace/categories (use seller token)     → save MKT_CAT_ID
6. POST /supplier/products                             → save SP_ID
7. GET  /cloudinary/sign?type=supplier_product         → upload image
8. POST /supplier/products/:SP_ID/images               { images: [{ url, publicId, isMain: true }] }
9. POST /supplier/products/:SP_ID/submit               → status: PENDING_REVIEW
   (Admin approves via PUT /admin/marketplace/products/:SP_ID/approve)

Seller import flow (after supplier product is ACTIVE):
1. POST /auth/login (seller)
2. GET  /marketplace/products                          → find SP_ID, note display_price
3. POST /marketplace/import                            { supplierProductId: SP_ID, retailPrice: display_price * 1.4 }
   → save IMPORT_ID, STORE_PRODUCT_ID

Dropship order flow (after customer places order — Phase 6):
1. Supplier: PUT /supplier/orders/:DROPSHIP_ORDER_ID/confirm
2. Supplier: PUT /supplier/orders/:DROPSHIP_ORDER_ID/ship  { trackingNumber, carrierName }
3. Seller:   PUT /seller/dropship-orders/:DROPSHIP_ORDER_ID/confirm  → escrow released to supplier
   OR
3. Seller:   PUT /seller/dropship-orders/:DROPSHIP_ORDER_ID/dispute  → escrow frozen, admin alerted
```


---

## Phase 5 — Website Builder & Public Storefront

---

### How the builder works

The builder stores each page as a **JSONB schema** in the database. The schema looks like this:

```json
{
  "sections": [
    {
      "id": "uuid",
      "type": "HERO",
      "config": { "heading": "Welcome", "ctaText": "Shop Now", "ctaUrl": "/products" },
      "components": [
        { "id": "uuid", "type": "TEXT", "config": { "content": "Extra text", "tag": "p" } }
      ]
    }
  ]
}
```

Every section and component has a UUID. All section/component endpoints return the **full updated page schema** — the frontend replaces its local copy with the response. There is no partial patch — the server always returns the complete current state.

---

### How the storefront works

The storefront is a **separate public-facing surface** that reads the published page schemas and renders them. It is tenant-scoped — every request must identify which store it belongs to.

**In development**, pass the store's domain in a header:
```
X-Tenant-Domain: mystore.varanda.com
```

**In production**, the `Host` header is used automatically (e.g. `mystore.varanda.com`).

The store must be published (`POST /builder/publish`) before the storefront endpoints return data. An unpublished store returns `404 STORE_NOT_PUBLISHED`.

---

### Page types

| `pageType` | Description |
|------------|-------------|
| `HOME` | The store's home page |
| `PRODUCTS` | Product listing page |
| `PRODUCT_DETAIL` | Individual product page |
| `CATEGORY` | Category page |
| `CART` | Cart page |
| `CHECKOUT` | Checkout page |
| `ABOUT` | About us page |
| `CONTACT` | Contact page |
| `POLICY` | Policy page (privacy, returns, etc.) |
| `CUSTOM` | Any custom page you create |

---

## Builder Endpoints

All require `Authorization: Bearer` + active seller subscription. Business ID is inferred from the JWT.

---

### GET /builder/templates

Returns all available templates.

**200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Classic",
      "slug": "classic",
      "description": "A clean, minimal storefront layout suitable for any product type.",
      "previewUrl": null,
      "sortOrder": 0
    },
    { "id": "uuid", "name": "Bold", "slug": "bold", "description": "..." },
    { "id": "uuid", "name": "Minimal", "slug": "minimal", "description": "..." }
  ]
}
```

---

### POST /builder/apply-template

Applies a template to the store. Creates `store_pages` rows for each page type the template defines, with fresh UUIDs on every section and component so each store's schema is independent.

**If a theme already exists** (the seller has previously applied a template), the API returns `409 EXISTING_THEME` with `requiresConfirm: true`. Resend with `confirm: true` to overwrite. Products and orders are never affected.

**Body**
```json
{ "templateId": "uuid", "confirm": false }
```

**First time (no existing theme) → 200**
```json
{
  "data": {
    "template": { "id", "name", "slug" },
    "pages": [
      { "id", "pageType": "HOME", "schema": { "sections": [...] }, "isPublished": false }
    ]
  }
}
```

**Existing theme, confirm not sent → 409**
```json
{
  "success": false,
  "error": {
    "code": "EXISTING_THEME",
    "message": "Applying this template will replace your current design.",
    "requiresConfirm": true
  }
}
```

**Resend with `confirm: true` → 200** (same shape as first-time response)

---

### GET /builder/pages

Returns all pages for the store (schema excluded — use `GET /builder/pages/:pageType` for the full schema).

**200**
```json
{
  "data": [
    { "id", "pageType": "HOME", "slug": null, "title": null, "seoTitle": null, "seoDescription": null, "isPublished": false, "publishedAt": null },
    { "id", "pageType": "CUSTOM", "slug": "about-us", "title": "About Us", "isPublished": true }
  ]
}
```

---

### GET /builder/pages/:pageType

Returns the full page including its `schema` (all sections and components).

`:pageType` is case-insensitive — `home`, `HOME`, `Home` all work.

**200**
```json
{
  "data": {
    "id": "uuid",
    "businessId": "uuid",
    "pageType": "HOME",
    "slug": null,
    "title": null,
    "seoTitle": null,
    "seoDescription": null,
    "schema": {
      "sections": [
        {
          "id": "uuid",
          "type": "HERO",
          "config": {
            "heading": "Welcome to Our Store",
            "subheading": "Discover amazing products",
            "ctaText": "Shop Now",
            "ctaUrl": "/products",
            "backgroundImage": null,
            "overlay": true
          },
          "components": []
        },
        {
          "id": "uuid",
          "type": "FEATURED_PRODUCTS",
          "config": { "heading": "Featured Products", "productCount": 4, "layout": "grid" },
          "components": []
        }
      ]
    },
    "isPublished": false,
    "publishedAt": null
  }
}
```

**Errors:** `404 NOT_FOUND` page doesn't exist yet (apply a template first, or create it)

---

### PUT /builder/pages/:pageType/schema

Replaces the entire page schema. Use this when you want to push a full schema update (e.g. after the user makes many changes locally and you batch-save).

**Body**
```json
{
  "schema": {
    "sections": [
      {
        "id": "existing-uuid",
        "type": "HERO",
        "config": { "heading": "New Heading", "ctaText": "Buy Now", "ctaUrl": "/products" },
        "components": []
      }
    ]
  }
}
```

**200** — returns the full updated page object (same shape as `GET /builder/pages/:pageType`).

**Errors:** `404 NOT_FOUND`

---

### PUT /builder/pages/:pageType/seo

Updates SEO fields only. Does not touch the schema.

**Body** (all optional)
```json
{
  "title": "Home",
  "seoTitle": "My Store — Best Fashion in Lagos",
  "seoDescription": "Shop the latest fashion trends..."
}
```

**200** — returns the updated page object.

---

### POST /builder/pages/custom

Creates a new custom page with an empty schema.

**Body**
```json
{
  "title": "About Us",
  "slug": "about-us",
  "seoTitle": "About My Store",
  "seoDescription": "Learn about our story..."
}
```

- `slug` — lowercase letters, numbers, and hyphens only. Must be unique within the store.

**201**
```json
{
  "data": {
    "id": "uuid",
    "pageType": "CUSTOM",
    "slug": "about-us",
    "title": "About Us",
    "schema": { "sections": [] },
    "isPublished": false
  }
}
```

**Errors:** `409 SLUG_TAKEN`

---

### POST /builder/pages/:pageType/sections

Adds a new section to the page. Returns the full updated page schema.

**Body**
```json
{
  "sectionType": "PRODUCT_GRID",
  "afterSectionId": "uuid-of-section-to-insert-after",
  "config": {
    "heading": "Our Products",
    "productCount": 8,
    "layout": "grid"
  }
}
```

- `afterSectionId` — UUID of the section to insert after. Pass `null` to append at the end.
- `config` — any key/value pairs. The frontend defines what config keys each section type uses.

**200** — returns the full updated page object with the new section included.

---

### PUT /builder/pages/:pageType/sections/:sectionId

Updates a section's config. Deep-merges the provided config into the existing config — keys you don't include are preserved.

**Body**
```json
{
  "config": {
    "heading": "Updated Heading",
    "productCount": 12
  }
}
```

**200** — returns the full updated page object.

**Errors:** `404 NOT_FOUND` page or section not found

---

### DELETE /builder/pages/:pageType/sections/:sectionId

Removes the section and all its components.

**200** — returns the full updated page object (without the deleted section).

---

### PUT /builder/pages/:pageType/sections/reorder

Reorders sections to match the provided array of IDs. Any section ID not in the array is dropped.

**Body**
```json
{
  "sectionIds": ["uuid-section-3", "uuid-section-1", "uuid-section-2"]
}
```

**200** — returns the full updated page object with sections in the new order.

---

### POST /builder/pages/:pageType/sections/:sectionId/components

Adds a component inside a section.

**Body**
```json
{
  "componentType": "TEXT",
  "afterComponentId": null,
  "config": {
    "content": "Free shipping on orders over ₦10,000",
    "tag": "p",
    "fontSize": 14,
    "color": "#555555"
  }
}
```

- `afterComponentId` — UUID of the component to insert after. `null` appends to the end.

**200** — returns the full updated page object.

---

### PUT /builder/pages/:pageType/sections/:sectionId/components/:componentId

Updates a component's config. Deep-merges — unspecified keys are preserved.

**Body**
```json
{ "config": { "content": "Updated text", "color": "#000000" } }
```

**200** — returns the full updated page object.

---

### DELETE /builder/pages/:pageType/sections/:sectionId/components/:componentId

**200** — returns the full updated page object.

---

### POST /builder/publish

Publishes the store. After this, the storefront endpoints go live.

**Validation before publishing:**
1. The store must have an active domain (`POST /business/domains/subdomain` or a verified custom domain)
2. The HOME page must have at least one section

**200**
```json
{
  "data": {
    "message": "Your store is now live.",
    "storeUrl": "mystore.varanda.com"
  }
}
```

**Errors:**
- `400 NO_DOMAIN` — no active domain connected. Go to `POST /business/domains/subdomain` first.
- `400 EMPTY_HOME_PAGE` — home page has no sections. Add at least one section first.

---

### POST /builder/unpublish

Takes the store offline. The storefront returns `404 STORE_NOT_PUBLISHED` until republished.

**200**
```json
{ "data": { "message": "Store unpublished." } }
```

---

## Public Storefront Endpoints

No seller auth. These are called by the customer-facing storefront frontend.

**Required header (development):**
```
X-Tenant-Domain: mystore.varanda.com
```

In production, the `Host` header is used automatically.

**All storefront endpoints return `404 STORE_NOT_FOUND`** if the domain is not recognized, and **`404 STORE_NOT_PUBLISHED`** if the store exists but hasn't been published yet.

---

### GET /storefront

The bootstrap call. Load this first when the storefront app initialises. Returns everything needed to render the shell: business info, brand settings, home page schema, social links, and domain.

**200**
```json
{
  "data": {
    "business": {
      "id": "uuid",
      "name": "My Fashion Store",
      "slug": "my-fashion-store",
      "tagline": "Style for every occasion",
      "description": "...",
      "currency": "NGN",
      "timezone": "Africa/Lagos"
    },
    "brandSettings": {
      "primaryColor": "#4CAF7D",
      "secondaryColor": "#F97316",
      "accentColor": "#2e7d52",
      "backgroundColor": "#FFFFFF",
      "textColor": "#111111",
      "fontHeading": "Poppins",
      "fontBody": "Inter",
      "baseFontSize": 16,
      "headingScale": 1.25,
      "buttonBorderRadius": 8,
      "cardBorderRadius": 12,
      "inputBorderRadius": 4,
      "globalCss": null
    },
    "homePage": {
      "id": "uuid",
      "pageType": "HOME",
      "schema": {
        "sections": [
          {
            "id": "uuid",
            "type": "HERO",
            "config": { "heading": "Welcome", "ctaText": "Shop Now", "ctaUrl": "/products" },
            "components": []
          }
        ]
      },
      "seoTitle": null,
      "seoDescription": null,
      "isPublished": true
    },
    "socialLinks": [
      { "id": "uuid", "platform": "instagram", "url": "https://instagram.com/mystore", "isVisible": true, "sortOrder": 0 }
    ],
    "domain": { "fullDomain": "mystore.varanda.com", "type": "SUBDOMAIN" }
  }
}
```

---

### GET /storefront/pages/:slug

Returns a published custom page by its slug. Use this to render custom pages like "About Us."

`:slug` — the page slug set when the page was created (e.g. `about-us`).

**200**
```json
{
  "data": {
    "id": "uuid",
    "pageType": "CUSTOM",
    "slug": "about-us",
    "title": "About Us",
    "seoTitle": "About My Store",
    "seoDescription": "...",
    "schema": { "sections": [...] },
    "isPublished": true
  }
}
```

**Errors:** `404 NOT_FOUND` page doesn't exist or is not published

---

### GET /storefront/categories

Returns all active categories for the store. Use this to build the navigation and filter sidebar.

**200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Footwear",
      "slug": "footwear",
      "description": null,
      "imageUrl": null,
      "sortOrder": 0,
      "isActive": true,
      "parentId": null
    },
    {
      "id": "uuid",
      "name": "Sneakers",
      "slug": "sneakers",
      "parentId": "uuid-of-footwear"
    }
  ]
}
```

---

### GET /storefront/products

Returns active products for the store. Supports filtering and pagination.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `perPage` | number | Items per page (default: 20, max: 100) |
| `categoryId` | uuid | Filter by category |
| `tagId` | uuid | Filter by tag |
| `search` | string | Search by product name |

**200**
```json
{
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Lagos Agbada",
        "slug": "lagos-agbada",
        "shortDescription": "Premium agbada set",
        "basePrice": 25000,
        "compareAtPrice": 30000,
        "currency": "NGN",
        "isVariable": true,
        "isFeatured": false,
        "status": "ACTIVE",
        "mainImageUrl": "https://res.cloudinary.com/...",
        "displayPrice": 25000,
        "totalStock": 70,
        "categoryName": "Traditional Wear"
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### GET /storefront/products/:slug

Full product detail. Use this for the product detail page.

Returns the product with all images, all variants (with their option values), and up to 4 related products from the same category.

**200**
```json
{
  "data": {
    "id": "uuid",
    "name": "Lagos Agbada",
    "slug": "lagos-agbada",
    "description": "Premium agbada set...",
    "shortDescription": "Premium agbada set",
    "basePrice": 25000,
    "compareAtPrice": 30000,
    "currency": "NGN",
    "isVariable": true,
    "isFeatured": false,
    "weight": 1.2,
    "seoTitle": "Lagos Agbada",
    "seoDescription": "...",
    "categoryName": "Traditional Wear",
    "images": [
      { "id": "uuid", "url": "https://res.cloudinary.com/...", "altText": "Front view", "isMain": true, "sortOrder": 0 }
    ],
    "variants": [
      {
        "id": "uuid",
        "sku": "AGD-M-BLK",
        "price": 25000,
        "compareAtPrice": 30000,
        "stockQuantity": 30,
        "isActive": true,
        "optionValues": [
          { "id": "uuid", "value": "Medium", "optionTypeName": "Size", "displayType": "TEXT" },
          { "id": "uuid", "value": "Black", "displayValue": "#000000", "optionTypeName": "Color", "displayType": "COLOR_SWATCH" }
        ]
      }
    ],
    "tags": [{ "id": "uuid", "name": "New Arrival", "slug": "new-arrival" }],
    "related": [
      { "id": "uuid", "name": "Ankara Suit", "slug": "ankara-suit", "displayPrice": 18000, "mainImageUrl": "..." }
    ]
  }
}
```

**Errors:** `404 NOT_FOUND` product doesn't exist or is not ACTIVE

---

### GET /storefront/policies/:slug

Returns a published policy page. Policy pages have `pageType: "POLICY"`.

`:slug` — the slug set when the policy page was created (e.g. `privacy-policy`, `return-policy`).

**200** — same shape as `GET /storefront/pages/:slug`.

**Errors:** `404 NOT_FOUND`

---

## Phase 5 Quick-Start — Builder Call Order

```
Prerequisites: Completed Phase 1 & 2 (logged in, have subscription, have a domain)

1.  GET  /builder/templates                          → save TEMPLATE_ID from the list
2.  POST /builder/apply-template                     { templateId: TEMPLATE_ID }
    → If 409 EXISTING_THEME: resend with { templateId, confirm: true }
3.  GET  /builder/pages                              → see all pages created by the template
4.  GET  /builder/pages/HOME                         → see the full home page schema
5.  PUT  /builder/pages/HOME/seo                     { seoTitle: "My Store", seoDescription: "..." }
6.  POST /builder/pages/HOME/sections                { sectionType: "PRODUCT_GRID", afterSectionId: null, config: { heading: "Shop All" } }
    → note the new section's id from the response
7.  PUT  /builder/pages/HOME/sections/:sectionId     { config: { productCount: 8 } }
8.  PUT  /builder/pages/HOME/sections/reorder        { sectionIds: ["id1", "id2", "id3"] }
9.  POST /builder/pages/HOME/sections/:sectionId/components  { componentType: "TEXT", config: { content: "Free shipping over ₦10,000" } }
10. POST /builder/pages/custom                       { title: "About Us", slug: "about-us" }
11. POST /builder/publish                            → store goes live
```

**Testing the storefront after publishing:**
```
Set header: X-Tenant-Domain: mystore.varanda.com  (use your actual subdomain)

1.  GET  /storefront                                 → bootstrap: brand, home schema, social links
2.  GET  /storefront/categories                      → category list for nav/filters
3.  GET  /storefront/products                        → product grid
4.  GET  /storefront/products/:slug                  → product detail with variants
5.  GET  /storefront/pages/about-us                  → custom page
```


---

## Phase 6 — Storefront Shopping: Customer Auth, Cart, Checkout & Orders

---

### How the storefront shopping flow works

Every storefront request must identify which store it belongs to via the `X-Tenant-Domain` header (dev) or `Host` header (production). The `resolveTenant` middleware runs first on all `/api/v1/storefront/*` routes and attaches the store context.

**Customer auth** uses a separate token system from seller auth — `X-Customer-Token: Bearer <token>`. Customers are scoped per store: an OTP from Store A is invalid on Store B, and a session from Store A cannot access Store B's customer data.

**Guest carts** use `X-Guest-Session: <uuid>` — a UUID the frontend generates and stores in `localStorage`. When the customer logs in, call `POST /storefront/cart/merge` to merge the guest cart into their account.

---

### Customer Auth

#### POST /storefront/auth/request-otp

No auth. Sends a 6-digit OTP to the customer's email. Creates a customer record on first use.

**Headers:** `X-Tenant-Domain: mystore.varanda.com`

**Body:** `{ "email": "customer@example.com" }`

**200**
```json
{ "data": { "message": "Verification code sent to customer@example.com", "isNewCustomer": true } }
```

> Dev: `OTP_FIXED_VALUE=654321` in `.env` always returns `654321`.

---

#### POST /storefront/auth/verify-otp

No auth. Verifies the OTP and returns a session token.

**Body:** `{ "email": "customer@example.com", "code": "654321" }`

**200**
```json
{
  "data": {
    "token": "abc123...",
    "expiresAt": "2024-12-01T00:00:00Z",
    "isNewCustomer": false,
    "customer": { "id", "email", "firstName", "lastName", "phone" }
  }
}
```

Store the `token` and send it on all subsequent requests as `X-Customer-Token: Bearer <token>`.

**Errors:** `400 INVALID_CODE` · `410 GONE` expired · `422 MAX_ATTEMPTS`

---

#### POST /storefront/auth/logout

**Auth: X-Customer-Token required.** Revokes the session.

**200** `{ "data": { "message": "Logged out." } }`

---

### Customer Profile

All require `X-Customer-Token`.

#### GET /storefront/customer/profile

**200** `{ "data": { "id", "email", "firstName", "lastName", "phone" } }`

---

#### PUT /storefront/customer/profile

**Body** (all optional): `{ "firstName": "Ade", "lastName": "Balogun", "phone": "+2348012345678" }`

---

#### GET /storefront/customer/addresses

**200** `{ "data": [{ "id", "label", "recipientName", "phone", "streetLine1", "city", "state", "country", "isDefault" }] }`

---

#### POST /storefront/customer/addresses

**Body**
```json
{
  "label": "Home",
  "recipientName": "Ade Balogun",
  "phone": "+2348012345678",
  "streetLine1": "12 Lagos Street",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "isDefault": true
}
```

---

#### PUT /storefront/customer/addresses/:addressId

Same fields as POST, all optional.

---

#### DELETE /storefront/customer/addresses/:addressId

---

#### GET /storefront/customer/orders

Query: `?page&perPage`

---

#### GET /storefront/customer/orders/:orderId

---

### Cart

Cart endpoints support both guest and authenticated customers.

**Guest cart:** Send `X-Guest-Session: <uuid>` header. Generate a UUID on the frontend and persist it in `localStorage`. No auth token needed.

**Authenticated cart:** Send `X-Customer-Token: Bearer <token>`. The cart is linked to the customer account.

---

#### GET /storefront/cart

Returns the current cart. Auth: optional.

**200**
```json
{
  "data": {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "variantId": "uuid",
        "productName": "Lagos Agbada",
        "productSlug": "lagos-agbada",
        "productImage": "https://res.cloudinary.com/...",
        "variantSku": "AGD-M-BLK",
        "quantity": 2,
        "unitPrice": 25000,
        "totalPrice": 50000,
        "currentPrice": 25000,
        "priceChanged": false,
        "inStock": true
      }
    ],
    "subtotal": 50000,
    "itemCount": 2
  }
}
```

`priceChanged: true` means the price changed since the item was added — show a warning to the customer.

---

#### POST /storefront/cart/items

**Body**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

For dropship products: `{ "productId": "uuid", "dropshipImportId": "uuid", "quantity": 1 }`

If the item is already in the cart, quantity is incremented.

**201** — returns the full updated cart.

**Errors:** `400 OUT_OF_STOCK` · `400 PRODUCT_UNAVAILABLE` · `400 VARIANT_UNAVAILABLE`

---

#### PUT /storefront/cart/items/:itemId

**Body:** `{ "quantity": 3 }`

**200** — returns the full updated cart.

---

#### DELETE /storefront/cart/items/:itemId

**200** — returns the full updated cart.

---

#### DELETE /storefront/cart

Clears all items.

---

#### POST /storefront/cart/merge

**Auth: X-Customer-Token required.** Merges a guest cart into the authenticated customer's cart. Call this immediately after the customer logs in.

**Body:** `{ "guestSessionId": "the-uuid-from-localStorage" }`

**200** — returns the merged cart.

---

### Shipping Rates

#### GET /storefront/shipping/rates

No auth. Returns available shipping rates for the customer's address.

**Query params:** `state=Lagos&country=Nigeria&orderWeight=1.5`

**200**
```json
{
  "data": {
    "source": "MANUAL",
    "zoneId": "uuid",
    "rates": [
      {
        "id": "uuid",
        "name": "Standard Delivery",
        "description": "2–3 business days",
        "estimatedDays": "2–3 business days",
        "rate": 1500,
        "isFree": false
      },
      {
        "id": "uuid",
        "name": "Free Shipping",
        "description": "Orders over ₦20,000",
        "rate": 0,
        "isFree": true
      }
    ]
  }
}
```

If no zone matches the address and no default zone is configured, `rates` will be empty.

---

### Discount Validation

#### POST /storefront/discounts/validate

No auth. Validates a discount code before checkout.

**Body:** `{ "code": "SAVE20", "orderTotal": 25000, "customerEmail": "customer@example.com" }`

**200 (valid)**
```json
{
  "data": {
    "valid": true,
    "discountCode": { "id", "code": "SAVE20", "type": "PERCENTAGE", "value": 20, "discountAmount": 5000 }
  }
}
```

**400 (invalid)** — error codes: `INVALID_CODE` · `NOT_ACTIVE_YET` · `EXPIRED` · `LIMIT_REACHED` · `MINIMUM_NOT_MET`

---

### Checkout

#### POST /storefront/checkout/initiate

Auth: optional customer token. Supports both guest and authenticated checkout.

**Body**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "Ade Balogun",
  "shippingAddress": {
    "streetLine1": "12 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria"
  },
  "shippingRateId": "uuid",
  "discountCode": "SAVE20",
  "customerNote": "Please leave at the gate",
  "guestSessionId": "uuid-from-localStorage"
}
```

- `shippingRateId` — from `GET /storefront/shipping/rates`
- `discountCode` — optional
- `guestSessionId` — required for guest checkout; omit if using `X-Customer-Token`

**201**
```json
{
  "data": {
    "orderNumber": "VRD-20241015-0001",
    "paymentUrl": "https://checkout.paystack.com/...",
    "reference": "VRD-ABC123DEF456",
    "total": 28500,
    "currency": "NGN"
  }
}
```

Redirect the customer to `paymentUrl`. After payment, Paystack redirects back to your callback URL. Then call `GET /storefront/checkout/verify/:orderNumber` to confirm.

**Errors:** `400 EMPTY_CART` · `400 CART_NOT_FOUND` · `400 INVALID_SHIPPING_RATE` · `400 INVALID_DISCOUNT_CODE`

---

#### GET /storefront/checkout/verify/:orderNumber

No auth. Polling endpoint — call after Paystack redirect to confirm payment status.

**200**
```json
{
  "data": {
    "paymentStatus": "PAID",
    "orderStatus": "CONFIRMED",
    "orderNumber": "VRD-20241015-0001"
  }
}
```

Poll every 2 seconds for up to 30 seconds. If `paymentStatus` is still `PENDING` after 30 seconds, show a "payment processing" message and tell the customer to check their email.

---

### Seller Order Management

All require `Authorization: Bearer` + active subscription.

#### GET /orders/stats

**200**
```json
{
  "data": {
    "totalOrders": 142,
    "pending": 5,
    "confirmed": 12,
    "processing": 8,
    "shipped": 3,
    "delivered": 110,
    "cancelled": 4,
    "totalRevenue": 2850000,
    "revenueThisMonth": 450000
  }
}
```

---

#### GET /orders

Query: `?page&perPage&status=PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED&search`

`search` matches order number, customer email, or customer name.

---

#### GET /orders/:orderId

Returns full order with items array.

---

#### PUT /orders/:orderId/status

**Body:** `{ "status": "CONFIRMED", "trackingNumber"?: "...", "trackingUrl"?: "...", "sellerNote"?: "..." }`

**Valid transitions:**
- `PENDING` → `CONFIRMED` or `CANCELLED`
- `CONFIRMED` → `PROCESSING` or `CANCELLED`
- `PROCESSING` → `SHIPPED`
- `SHIPPED` → `DELIVERED`

**Errors:** `400 INVALID_TRANSITION`

---

#### POST /orders/:orderId/cancel

**Body:** `{ "reason": "Customer requested cancellation" }`

Only `PENDING` or `CONFIRMED` orders can be cancelled.

---

#### POST /orders/:orderId/ship

**Body:** `{ "trackingNumber": "GIG-2024-001", "trackingUrl": "https://..." }`

Shortcut for `PUT /orders/:orderId/status { status: "SHIPPED" }` with tracking info.

---

#### GET /orders/:orderId/shipment

Returns tracking info and Shipbubble shipment details if booked.

---

### Seller Dropship Order Management

All require `Authorization: Bearer` + active subscription.

#### GET /seller/dropship-orders

Query: `?page&perPage&status&sellerConfirmationStatus=PENDING|CONFIRMED|DISPUTED`

---

#### GET /seller/dropship-orders/:dropshipOrderId

---

#### PUT /seller/dropship-orders/:dropshipOrderId/confirm

**THE ESCROW RELEASE TRIGGER.** Seller confirms the supplier shipped. Triggers Paystack Transfer to supplier.

No body required.

**200**
```json
{
  "data": {
    "dropshipOrder": { "status": "DELIVERED", "sellerConfirmationStatus": "CONFIRMED" },
    "revenueSplit": { "supplierReceived": 5000, "transferCode": "TRF_xxx" },
    "message": "Escrow released. Supplier has been paid ₦5,000."
  }
}
```

**Errors:** `400 INVALID_STATUS` supplier hasn't shipped yet · `503 PAYSTACK_TRANSFER_FAILED`

---

#### PUT /seller/dropship-orders/:dropshipOrderId/dispute

Freezes escrow. Creates a dispute record. Alerts admin.

**Body**
```json
{
  "reason": "NOT_DELIVERED",
  "description": "Customer says item never arrived after 3 weeks.",
  "evidenceUrls": ["https://..."]
}
```

**Reason values:** `NOT_DELIVERED` · `WRONG_ITEM` · `DAMAGED` · `NOT_AS_DESCRIBED` · `OTHER`

**200**
```json
{
  "data": {
    "dispute": { "id", "status": "OPEN", "reason", "description" },
    "dropshipOrder": { "sellerConfirmationStatus": "DISPUTED" },
    "message": "Dispute raised. Escrow is frozen. Admin has been notified."
  }
}
```

---

### Shipping Setup (Seller)

All require `Authorization: Bearer` + active subscription.

#### GET /shipping/zones

Returns all zones with their regions and rates nested.

---

#### POST /shipping/zones

**Body:** `{ "name": "Lagos", "isDefault": false }`

---

#### PUT /shipping/zones/:zoneId

**Body** (all optional): `{ "name": "...", "isDefault": true, "isActive": true }`

Setting `isDefault: true` unsets the previous default zone.

---

#### DELETE /shipping/zones/:zoneId

---

#### POST /shipping/zones/:zoneId/regions

**Body:** `{ "regionType": "STATE", "regionValue": "Lagos" }`

`regionType`: `STATE` · `COUNTRY` · `CITY`

---

#### DELETE /shipping/zones/:zoneId/regions/:regionId

---

#### POST /shipping/zones/:zoneId/rates

**Body**
```json
{
  "name": "Standard Delivery",
  "description": "2–3 business days",
  "rateType": "FLAT",
  "flatRate": 1500,
  "estimatedDays": "2–3 business days",
  "isActive": true
}
```

`rateType`: `FLAT` · `WEIGHT_BASED` · `FREE`

For `WEIGHT_BASED`: include `weightRate` (₦ per kg), `minWeight`, `maxWeight`.

---

#### PUT /rates/:rateId

Same fields as POST, all optional.

---

#### DELETE /rates/:rateId

---

#### GET /shipping/policies

---

#### POST /shipping/policies

**Body:** `{ "title": "Return Policy", "content": "We accept returns within 7 days...", "isActive": true }`

Slug is auto-generated from title.

---

#### PUT /shipping/policies/:policyId

---

#### DELETE /shipping/policies/:policyId

---

## Phase 6 Quick-Start — Checkout Call Order

```
Prerequisites: Store published (Phase 5), shipping zone + rate configured

Track A — Seller setup (one-time):
1. POST /shipping/zones          { name: "Lagos", isDefault: true }  → save ZONE_ID
2. POST /shipping/zones/:ZONE_ID/regions  { regionType: "STATE", regionValue: "Lagos" }
3. POST /shipping/zones/:ZONE_ID/rates    { name: "Standard", rateType: "FLAT", flatRate: 1500 }

Track B — Customer checkout (set X-Tenant-Domain header):
1. POST /storefront/auth/request-otp     { email: "customer@test.com" }
2. POST /storefront/auth/verify-otp      { email, code }  → save token as X-Customer-Token
3. POST /storefront/cart/items           { productId, variantId, quantity: 1 }
4. GET  /storefront/shipping/rates?state=Lagos&country=Nigeria  → save rates[0].id as RATE_ID
5. POST /storefront/discounts/validate   { code: "SAVE10", orderTotal: 25000 }  (optional)
6. POST /storefront/checkout/initiate    { customerEmail, customerName, shippingAddress, shippingRateId: RATE_ID }
   → save paymentUrl and orderNumber
7. Open paymentUrl in browser → complete Paystack test payment
8. GET  /storefront/checkout/verify/:orderNumber  → confirm paymentStatus: "PAID"

Track C — Seller order management:
1. GET  /orders                          → see the new order
2. PUT  /orders/:orderId/status          { status: "CONFIRMED" }
3. PUT  /orders/:orderId/status          { status: "PROCESSING" }
4. POST /orders/:orderId/ship            { trackingNumber: "GIG-001", trackingUrl: "..." }

Track D — Dropship order flow (after marketplace import):
1. Customer checks out (Track B) — order created with orderType: "DROPSHIP_INAPP"
2. Supplier: PUT /supplier/orders/:dropshipOrderId/ship  { trackingNumber, carrierName }
3. Seller: GET /seller/dropship-orders  → see order with sellerConfirmationStatus: "PENDING"
4. Seller: PUT /seller/dropship-orders/:dropshipOrderId/confirm  → escrow released to supplier
```

---

## UI/UX Flow → API Mapping (Phase 6 additions)

### Customer Storefront

| UI Action | API Call |
|-----------|----------|
| Customer clicks "Sign In" / reaches checkout | `POST /storefront/auth/request-otp` |
| OTP entry (auto-submit on 6 digits) | `POST /storefront/auth/verify-otp` → store token |
| Customer logs out | `POST /storefront/auth/logout` |
| Load customer profile page | `GET /storefront/customer/profile` |
| Update profile | `PUT /storefront/customer/profile` |
| Load saved addresses | `GET /storefront/customer/addresses` |
| Add address | `POST /storefront/customer/addresses` |
| Edit address | `PUT /storefront/customer/addresses/:addressId` |
| Delete address | `DELETE /storefront/customer/addresses/:addressId` |
| Load cart (page load) | `GET /storefront/cart` |
| Add to cart button | `POST /storefront/cart/items` |
| Change quantity in cart | `PUT /storefront/cart/items/:itemId` |
| Remove item from cart | `DELETE /storefront/cart/items/:itemId` |
| Clear cart | `DELETE /storefront/cart` |
| Customer logs in with items in guest cart | `POST /storefront/cart/merge { guestSessionId }` |
| Checkout — address entered, unlock shipping | `GET /storefront/shipping/rates?state=&country=` |
| Apply promo code | `POST /storefront/discounts/validate` |
| Click "Pay ₦X" | `POST /storefront/checkout/initiate` → redirect to `paymentUrl` |
| After Paystack redirect | `GET /storefront/checkout/verify/:orderNumber` (poll) |
| Customer order history | `GET /storefront/customer/orders` |
| Customer order detail / track | `GET /storefront/customer/orders/:orderId` |

### Seller Dashboard

| UI Action | API Call |
|-----------|----------|
| Load orders list | `GET /orders` |
| Filter orders by status | `GET /orders?status=PENDING` |
| Search orders | `GET /orders?search=VRD-2024` |
| Load order detail | `GET /orders/:orderId` |
| Confirm order | `PUT /orders/:orderId/status { status: "CONFIRMED" }` |
| Mark processing | `PUT /orders/:orderId/status { status: "PROCESSING" }` |
| Mark shipped (manual) | `POST /orders/:orderId/ship { trackingNumber, trackingUrl }` |
| Cancel order | `POST /orders/:orderId/cancel` |
| Dashboard order stats | `GET /orders/stats` |
| Load dropship orders | `GET /seller/dropship-orders` |
| Confirm dropship delivery | `PUT /seller/dropship-orders/:id/confirm` |
| Raise dispute | `PUT /seller/dropship-orders/:id/dispute` |
| Shipping setup — load zones | `GET /shipping/zones` |
| Create shipping zone | `POST /shipping/zones` |
| Add region to zone | `POST /shipping/zones/:zoneId/regions` |
| Add rate to zone | `POST /shipping/zones/:zoneId/rates` |
| Edit rate | `PUT /rates/:rateId` |
| Create policy | `POST /shipping/policies` |


---

## Shipping — Full Reference

### How shipping zones work

A seller creates **zones**. Each zone covers specific geographic regions and has one or more **rates** (the prices for that zone). One zone can be the **default** — it catches any address that doesn't match a more specific zone.

**Zone matching priority (most specific wins):**
1. CITY match — e.g. zone covers "Ikeja"
2. STATE match — e.g. zone covers "Lagos"
3. COUNTRY match — e.g. zone covers "Nigeria"
4. Default zone — catches everything else

**Rate types:**

| Type | How it works |
|------|-------------|
| `FLAT` | Fixed price regardless of weight. Optional `minOrder` threshold: if set, the rate becomes ₦0 when the order total meets or exceeds it (free shipping above ₦X). |
| `WEIGHT_BASED` | Price = `weightRate × orderWeight`. Filter by `minWeight`/`maxWeight` to create weight tiers. |
| `FREE` | Always ₦0. Optional `minOrder`: only shown when order total meets the threshold. |

**Example setup for a Lagos seller:**
```
Zone: "Ikeja" (CITY: Ikeja)
  Rate: "Same-day delivery" FLAT ₦800 estimatedDays: "Same day"

Zone: "Lagos" (STATE: Lagos)
  Rate: "Standard" FLAT ₦1,500 estimatedDays: "1-2 days"
  Rate: "Express" FLAT ₦3,000 estimatedDays: "Same day"
  Rate: "Free above ₦20k" FLAT ₦0 minOrder: 20000

Zone: "South West" (STATE: Ogun, STATE: Oyo, STATE: Osun)
  Rate: "Standard" FLAT ₦2,500 estimatedDays: "2-3 days"

Zone: "Everywhere Else" (is_default: true)
  Rate: "Nationwide" FLAT ₦3,500 estimatedDays: "3-5 days"
```

A customer in Ikeja sees the "Ikeja" zone rates (most specific). A customer in Lagos (not Ikeja) sees the "Lagos" zone rates. A customer in Ibadan sees "South West" rates. A customer in Kano sees "Everywhere Else" rates.

**Standard vs Express** are just rate names — the seller defines them. "Standard" and "Express" are labels the seller gives to different rates within the same zone. There's no system-level distinction; the seller sets the price and estimated days for each.

---

### Supplier shipping

Suppliers set a price for their product (`supplierPrice`). That price covers the product only — it does not include shipping to the end customer. Shipping is always the **seller's responsibility** to configure via their shipping zones. When a customer buys a dropship product from a seller's store, the shipping fee shown at checkout comes from the seller's zone configuration, not from the supplier.

The supplier's `processingTimeDays` is informational — it tells the seller how long the supplier takes to prepare the order before handing it to a carrier. It's shown on the marketplace product listing so sellers can factor it into their delivery estimates.

---

### Shipbubble integration

Sellers can connect Shipbubble to get **live carrier rates** at checkout (GIG, DHL, Kwik, Sendbox, etc.) instead of or alongside manual rates.

**Connect flow:**
```
POST /api/v1/integrations/shipbubble/connect
{
  "apiKey": "your-shipbubble-api-key",
  "originAddress": {
    "contactName": "Ade Balogun",
    "phone": "+2348012345678",
    "email": "store@example.com",
    "streetAddress": "12 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

The API tests the key against Shipbubble before saving. If the key is invalid, it returns `400 INVALID_API_KEY`.

**How live rates work at checkout:**

When Shipbubble is connected and active, `GET /storefront/shipping/rates` calls Shipbubble's rate API in addition to resolving manual zones. The response includes both:

```json
{
  "data": {
    "source": "MIXED",
    "rates": [
      { "id": "uuid", "name": "Standard", "rate": 1500, "source": "MANUAL", "estimatedDays": "2-3 days" },
      { "serviceCode": "GIG_STANDARD", "name": "GIG Logistics", "rate": 1800, "source": "SHIPBUBBLE", "estimatedDays": "2024-12-20" },
      { "serviceCode": "DHL_EXPRESS", "name": "DHL Express", "rate": 4500, "source": "SHIPBUBBLE" }
    ]
  }
}
```

`source: "MANUAL"` rates have a UUID `id`. `source: "SHIPBUBBLE"` rates have a `serviceCode` instead.

**Checkout with a Shipbubble rate:**

When the customer picks a Shipbubble rate, pass the `serviceCode` as `shippingRateId` and the rate amount as `shippingRateAmount`:

```json
{
  "shippingRateId": "GIG_STANDARD",
  "shippingRateAmount": 1800,
  ...
}
```

For manual rates, just pass the UUID `id` as `shippingRateId` — no `shippingRateAmount` needed.

**Mixed mode:** A seller can have manual zones AND Shipbubble connected simultaneously. Manual rates appear first in the list, Shipbubble live rates follow. The customer picks any one.

---

### POST /integrations/shipbubble/connect

**Auth: Bearer + subscription.**

**Body**
```json
{
  "apiKey": "sb_live_...",
  "originAddress": {
    "contactName": "Store Name",
    "phone": "+2348012345678",
    "email": "store@example.com",
    "streetAddress": "12 Lagos Street",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria"
  }
}
```

**201** `{ "data": { "connected": true, "accountEmail": "store@shipbubble.com", "isActive": true } }`

**Errors:** `400 INVALID_API_KEY`

---

### GET /integrations/shipbubble/status

Returns connection status and re-tests the key.

**200**
```json
{
  "data": {
    "connected": true,
    "isActive": true,
    "accountEmail": "store@shipbubble.com",
    "keyValid": true,
    "originAddress": { ... },
    "connectedAt": "2024-10-01T00:00:00Z",
    "lastTestedAt": "2024-10-15T12:00:00Z"
  }
}
```

---

### DELETE /integrations/shipbubble/disconnect

Deactivates Shipbubble. Manual zones take over.

---

### PUT /integrations/shipbubble/origin-address

Update the pickup address without reconnecting.

**Body:** same `originAddress` object as connect.

---

### GET /storefront/shipping/rates (updated)

Now accepts `city` in addition to `state` and `country`. Also accepts `orderTotal` for free-shipping threshold evaluation.

**Query params**

| Param | Description |
|-------|-------------|
| `city` | Customer's city (optional, highest priority for zone matching) |
| `state` | Customer's state |
| `country` | Customer's country (default: Nigeria) |
| `orderWeight` | Total order weight in kg (for weight-based rates) |
| `orderTotal` | Order subtotal in ₦ (for free-shipping threshold evaluation) |

**Response `source` values:**
- `MANUAL` — only manual zone rates returned
- `SHIPBUBBLE` — only Shipbubble live rates (no manual zone matched)
- `MIXED` — both manual and Shipbubble rates returned
- `NONE` — no rates available for this address

---

## Subdomain Availability Check

### GET /api/v1/business/domains/check-subdomain

**No auth required.** Use this to check availability in real-time as the seller types their subdomain during onboarding (debounce 500ms on the frontend).

**Query:** `?subdomain=mystore`

Rules: letters only (a–z, A–Z), max 15 characters. No numbers, no hyphens.

**200 — available**
```json
{ "data": { "available": true } }
```

**200 — taken**
```json
{ "data": { "available": false } }
```

**422** — invalid format (not letters-only or over 15 chars)
