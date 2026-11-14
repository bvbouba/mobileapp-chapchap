# ChapChap Tickets — App Store & Play Store release

App IDs: `com.vaflaly.exposhop` · Version `1.0.0`

Privacy: https://www.chapchapticket.com/ci/privacy-policy  
Terms: https://www.chapchapticket.com/ci/conditions  
Account deletion: https://www.chapchapticket.com/ci/accountDeletion  
In-app path: **Profil → Paramètres → Sécurité & Confidentialité → Supprimer mon compte**

## 1. Before first build

### Apple (App Store Connect)
1. Create the app with bundle ID `com.vaflaly.exposhop`.
2. Set privacy policy URL (above).
3. App Privacy nutrition labels — disclose at least:
   - Name, Phone Number, Email (account), Payment Info, Other User Content (bookings)
   - Linked to user · Not used for tracking · App Functionality
4. Age rating / content (travel tickets, no UGC social).
5. Export compliance: uses only standard HTTPS encryption (`ITSAppUsesNonExemptEncryption = false`).
6. Put the numeric **Apple ID** of the app into `eas.json` → `submit.production.ios.ascAppId`.
7. Put your **Team ID** into `eas.json` → `submit.production.ios.appleTeamId`.

### Google Play Console
1. Create the app with package `com.vaflaly.exposhop`.
2. Store listing privacy policy URL (above).
3. **Data safety** form — collect / share for app functionality:
   - Name, Phone, Email, Purchase history / payment
   - Biometrics (device auth; not sent to ChapChap servers)
   - Account deletion offered in-app (link to website flow)
4. Create a Play service account with **Release** access, download JSON key as  
   `customer/mobile/google-service-account.json` (gitignored).
5. Complete content rating (IARC), target audience, news/COVID declarations as prompted.

### Saleor
Redeploy API with `accountRequestDeletion(noNotification)` so website account deletion works for phone users.

## 2. Build (EAS)

Use **Node 20+** locally (`nvm use 20`). Logged in as Expo user `vaflaly`. From `customer/mobile`:

```bash
# Android AAB (local keystore via credentials.json) — non-interactive OK
pnpm eas:build:android

# iOS IPA — must be interactive the first time (Apple login / cert setup)
eas build --platform ios --profile production
```

Or both: `eas build --platform all --profile production` (interactive for iOS credentials).

**Note:** `eas build --non-interactive` fails for iOS until Distribution Certificate / provisioning are validated once on Expo.

## 3. Submit

```bash
pnpm eas:submit:android   # → Play internal track by default
pnpm eas:submit:ios       # → App Store Connect TestFlight / review
```

Then in each console: promote internal → production and submit for review.

## 4. Reviewer notes (paste into ASC / Play)

- Test account: provide a Côte d’Ivoire phone + password to Apple/Google review.
- Account deletion: Profil → Paramètres → Sécurité & Confidentialité → Supprimer mon compte  
  (opens website; sign in with the same phone account, confirm first name, delete).
- Payments: Mobile Money via Paystack (CI). Stripe may be inactive depending on channel config.
- Language: French (fr).

## 5. Screenshots checklist

Capture on a real device or simulator for phone + tablet (iPad supported):
- Home / trip search
- Trip results
- Checkout / payment
- Mes voyages (ticket)
- Profil / Sécurité & Confidentialité (showing delete account)
