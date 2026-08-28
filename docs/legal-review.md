# Legal pages: maintenance notes

The public routes `/privacy` and `/terms` contain customer-facing policies for GCC Talents. The footer links `Cookie Policy` to `/privacy#cookies`. Both pages use the shared legal layout and contact link, are accessible without an account, and are dated 27 August 2026.

## Confirmed business details

- Product name: GCC Talents.
- Country and governing jurisdiction: Kingdom of Bahrain, as supplied by the owner.
- Support, privacy requests, and legal questions: `help@gcctalent.com`, as supplied by the owner. Keep the address in `src/components/legal/LegalContactLink.jsx` consistent with any future contact surfaces.

No registered company name, registration number, or street address was supplied, and none was invented. The product name is not a claim that a particular legal entity or commercial registration was verified. A Bahrain-qualified legal reviewer should confirm the operator-identification requirements and add accurate registration/address details where required before public launch. Finalizing the page content does not certify compliance or legal enforceability.

## Operational responsibilities

- Monitor the supplied mailbox and establish identity checks, request handling, complaint review, and legally required response deadlines. Mail delivery and staffing were not verified by this frontend change.
- Maintain an accurate inventory of hosting, backups, processors, regions, agreements, and transfer arrangements. The pages do not claim Bahrain-only storage or a verified cross-border safeguard.
- Apply appropriate retention criteria and handle deletion requests across linked records, audit logs, and backups. The pages do not promise automatic or complete erasure.
- Confirm lawful processing grounds, public profile/review disclosures, and any required notices or consents against the deployed service.
- Review eligibility and legal-capacity requirements; this change does not implement age verification.
- Disclose actual payment services, charges, funding/withdrawal conditions, cancellations, and refunds before enabling them. Internal ledger entries are not proof of payment settlement or regulated escrow.
- Registration displays linked assent wording for the Terms and a separate Privacy Policy reference. It does not add a consent checkbox, a terms-version field, or backend acceptance evidence. Add versioned acceptance records if required by the agreed legal process; do not treat this UI as evidence that acceptance was stored.
- Keep the revision date and notices current when processing practices or service terms change. Do not assume a policy edit changes existing client/freelancer agreements.

These are operational follow-ups for the service owner, not additional features implemented by the legal pages.

## Implementation facts used

Checked against the sibling backend and this frontend on 27 August 2026:

- Accounts and profiles use the User, FreelancerProfile, and ClientProfile models; public profiles expose profile/activity fields, including earnings/spending counters, but not email addresses.
- Public review responses expose reviewer name/avatar/role and associated contract title/status, as well as the review itself.
- Mounted job, proposal, contract, review, and wallet controllers handle marketplace records. README target routes alone were not treated as live features.
- Frontend authentication stores an access token in local storage and removes it on logout or a 401 response.
- The backend can issue a seven-day HTTP-only refresh cookie, but this frontend does not currently use credentialed cross-origin refresh requests or call backend logout.
- The shared sidebar writes a seven-day state cookie.
- Email verification and password-recovery flows integrate Resend. Deployed provider configuration was not checked and no secret values were read.
- Audit records include actor/resource identifiers, selected action metadata, IP addresses, and timestamps. No general retention or automatic audit expiry was found.
- Administrative user deletion is restricted by marketplace history and is not a complete cascading erasure. No self-service export or account-erasure route was found.
- Wallet controllers maintain internal ledger balances; no integrated bank/card processor was found. Milestone approval calculates ledger fees using runtime configuration; an agreed fee snapshot or advance disclosure flow was not verified. Do not label ledger records as regulated escrow, guarantee settlement, or imply that payment-provider disclosure is already implemented.

## Official Bahrain references

- [Law No. 30 of 2018: Personal Data Protection Law](https://www.pdp.gov.bh/en/assets/pdf/regulations.pdf).
- [Bahrain National Portal: Secure Data Transfer](https://www.bahrain.bh/wps/portal/en/BNP/ExploreBahrain/SecureDataTransfer) — the national framework, conditional access/correction/erasure rights, direct-marketing objections, and the Personal Data Protection Authority.
- [Ministry of Justice: Data Subjects' Rights](https://www.pdp.gov.bh/assets/pdf/executive-decisions/eng/Data-Subjects-Rights-REVIEWED.pdf) — consent requirements and withdrawal of consent.
- [Personal Data Protection Authority: complaints procedures](https://www.pdp.gov.bh/en/assets/pdf/executive-decisions/eng/trans-order-complaints-en.pdf).

Official indexed source text was available during the 27 August 2026 review; some direct government page/PDF requests returned HTTP 403. This was a focused content check, not an exhaustive review of legislation or the deployed business. No payment provider, refund schedule, liability cap, or compliance certification was invented.
