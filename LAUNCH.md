# Trano iOS launch

## Deploy the API

1. In Render, check for an existing Trano Blueprint. Sync it, or create a Blueprint from this repository’s `main` using [`render.yaml`](render.yaml). Verify the deploy logs for `trano-api` show migrations and the seed completed against `trano-db`.
2. In Cloudflare R2, verify the `trano-images` bucket and its HTTPS public URL. Create an R2 S3 credential with **Object Read & Write** scoped to that bucket. Enter `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_URL` in Render. Use the bucket’s public URL for `R2_PUBLIC_URL`. [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)
3. Add `api.trano.app` as a Render custom domain. In Cloudflare DNS, replace the old `api` origin record with a DNS-only CNAME to the actual `onrender.com` hostname shown in Render. Verify the domain and TLS certificate in Render. [Render’s Cloudflare DNS guide](https://render.com/docs/configure-cloudflare-dns)
4. From a separate network, open `https://api.trano.app/health`, `/listings`, `/`, `/privacy`, and `/support`. Expect `{"status":"ok"}` from `/health`, listing data from `/listings`, and the three HTML pages. Upload a test photo, confirm its public URL loads, then delete the test listing and confirm the object is removed after the cleanup worker runs.

The fresh production seed creates nine listings across five cities. They are marked as samples and have stock photos. The seed skips nonempty databases, so check for older unlabeled samples and use verified listings for launch. [Seed data](apps/api/prisma/seed.ts)

## Set up support and moderation

Send a test message to `hello@trano.app` and confirm the assigned support owner can receive and reply. Assign a moderator to check the queue daily and handle listing reports and related support messages.

Register a separate account for the moderator. Get its `user.id` from `POST /auth/login`, then have the database owner grant `ADMIN` to that exact ID in production PostgreSQL:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "id" = '<operator-user-id>';
```

Sign in to `POST /auth/login` with the moderator’s phone and password. Use the response `token` in the `Authorization: Bearer <token>` header. Send JSON for the `PATCH` calls. [Moderation routes](apps/api/src/routes/listings.ts)

| Request | Operator action |
| --- | --- |
| `GET /listings/moderation/queue?page=1&pageSize=20` | Review `data` for submitted listings, edits, and active listings with unresolved reports. Check text, photos, owner details, and any report reasons. Use `totalPages` to continue. |
| `PATCH /listings/moderation/<listingId>` | Send `{"action":"approve","updatedAt":"<queue-item-updatedAt>"}` to publish or keep a listing public, or use `"remove"` to hide it. Both decisions resolve its open reports. Copy the exact ISO `updatedAt` from the queue item. On HTTP 409, refresh the queue and review the latest version before acting. |
| `PATCH /listings/moderation/users/<userId>` | Send `{"isSuspended":true}` to suspend an abusive account and hide its listings. Send `{"isSuspended":false}` to lift the suspension. |

Submitted listings and edits stay hidden from public listing views until approval. A report enters the queue immediately, and the fifth unresolved report hides the listing pending review.

## Verify and submit the iPhone build

1. Create a dedicated seller account for App Review on the deployed API. Use test content you control. Enter the account’s phone and password in **App Review Information** with steps to post a listing, report a listing, block an owner, and find account deletion. Use a separate disposable account to test deletion yourself.
2. From `apps/mobile`, run `eas build --platform ios --profile production --auto-submit` and verify the new build appears in TestFlight in App Store Connect. Install it on an iPhone. Check browse, search, save, sign-in, photo upload, location pinning, WhatsApp, posting and editing through review, report, block and unblock, and account deletion. Verify posted or edited listings appear after approval and that removal, suspension, and deletion hide the affected content.
3. Capture real app screens. Upload at least one screenshot in the iPhone with Dynamic Island (medium display) category, such as a portrait screenshot at 1179 × 2556 or 1206 × 2622. [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
4. In App Store Connect, create or open version `1.0.0` and enter the English and French metadata from [`store.config.json`](apps/mobile/store.config.json). Verify the support and privacy links. Complete App Privacy using what the production build collects, including account details, user IDs, listing photos and text, reports, and location submitted with a listing. Complete the current age rating questionnaire and declare user-generated listings. [App Privacy details](https://developer.apple.com/app-store/app-privacy-details/) · [Age rating questionnaire](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)
5. Select the tested build, add the screenshots and review information, and submit version `1.0.0` for App Review. Keep the production API and reviewer account available during review. [Apple’s App Review checklist](https://developer.apple.com/app-store/review/guidelines/#before-you-submit)

Use a build that includes the moderation workflow for posting tests. Earlier TestFlight builds can create a draft but lack the step that sends it to the review queue. To test against a different backend, set `EXPO_PUBLIC_API_BASE_URL` before starting Expo or building the app.
