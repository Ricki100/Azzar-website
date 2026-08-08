# Azzar privacy and data-protection audit

**Assessment date:** 8 August 2026

**Overall risk:** HIGH until the organisational evidence below is supplied

**Scope:** Public website source and rendered homepage; quote forms; Azzar Club signup; Brevo integration; WhatsApp handoff; Facebook embed; browser storage; email template; Apache configuration. No Brevo, hosting, Meta, staff, contract, backup or POTRAZ account access was available. No penetration test was performed.

## Executive summary

The website-level transparency and consent defects identified in this review have been remediated in code. The privacy notice now describes the observed processing; marketing requires an unticked affirmative choice; quote forms have contextual notice; campaign storage expires after 90 days; website fonts are self-hosted; Facebook remains click-to-load; the Brevo unsubscribe variable is corrected; and baseline security headers were added.

Azzar cannot yet be described as fully compliant. The code establishes that Azzar determines the purpose and means of commercial personal-data processing, so Azzar is a data controller. Current evidence does not establish its POTRAZ licence, licensed tier, appointed/certified DPO, DP2 notification, overseas-transfer notification, Brevo/hosting processing agreements, retention execution, rights register or breach procedure. These are launch gates for the affected processing, not items a website policy can cure.

## Applicable jurisdiction

- **Confirmed:** Zimbabwe Cyber and Data Protection Act [Chapter 12:07]. The company is presented as operating from Harare and processes Zimbabwean enquiries electronically.
- **Confirmed:** Cyber and Data Protection (Licensing of Data Controllers and Appointment of Data Protection Officers) Regulations, 2024, S.I. 155 of 2024.
- **Likely:** Zimbabwe Consumer Protection Act direct-marketing provisions for consumer campaigns.
- **Potential:** Foreign privacy rules where Azzar deliberately targets or monitors people in another country. No evidence of such targeting was found.

Authoritative sources: [Cyber and Data Protection Act](https://zimlii.org/akn/zw/act/2021/5/eng%402022-03-11) and [S.I. 155 of 2024](https://www.potraz.gov.zw/wp-content/uploads/2025/02/sI-155-of-2024-Cyber-and-Data-Protection-Normal_240913_1250178.pdf).

## Controller, licence and DPO determination

- **Controller:** YES. Azzar selects the form fields, purposes, Brevo lists, email content and recipients.
- **Estimated data subjects:** **[INFORMATION REQUIRED]** Count unique living individuals across Brevo, WhatsApp, email, customers, prospects, suppliers, staff and archived/backed-up records; do not count only website leads.
- **Licence tier:** **[INFORMATION REQUIRED]** S.I. 155 specifies Tier 1 for 50–1,000 people, Tier 2 for 1,001–100,000, Tier 3 for 100,001–500,000, and Tier 4 above 500,000.
- **Licence status/number/expiry:** **[INFORMATION REQUIRED]**.
- **DPO appointment, POTRAZ DP2 notification and approved certification:** **[INFORMATION REQUIRED]**. S.I. 155 sections 12–14 require a controller to appoint a DPO, notify POTRAZ and use a suitably skilled, certified person.

## Findings

### AZ-01 — HIGH — POTRAZ licensing status not evidenced

- **Observed:** Azzar commercially processes identifiable lead and customer information; no licence evidence was available.
- **Requirement/risk:** S.I. 155 sections 3–6 require licensing and classify tiers by data-subject count.
- **Action:** Inventory and deduplicate all data subjects, apply/renew using DP1, record licence number and expiry.
- **Owner/timing:** Managing director and DPO; immediately.
- **Close evidence:** DP1 submission, licence, tier calculation and renewal diary.
- **Retest:** Verify the licence against POTRAZ’s register and reconcile the tier to the inventory.

### AZ-02 — HIGH — DPO appointment and notification not evidenced

- **Observed:** No appointment, certification or DP2 evidence was available.
- **Requirement/risk:** S.I. 155 sections 12–14 require appointment, written notification and approved certification.
- **Action:** Appoint a competent, sufficiently independent DPO; submit DP2; publish a monitored privacy contact; schedule training and audits.
- **Owner/timing:** Board/managing director; immediately.
- **Close evidence:** Appointment letter, certification, DP2 acknowledgement, role description and conflict assessment.
- **Retest:** Contact the channel and verify the DPO can operate the rights, DPIA and incident processes.

### AZ-03 — HIGH — Overseas transfers and processor contracts not evidenced

- **Observed:** Website leads are sent to Brevo; WhatsApp enquiries go to Meta/WhatsApp; hosting location is unknown.
- **Requirement/risk:** S.I. 155 section 10 requires POTRAZ notification of intended transfers outside Zimbabwe and written processor instruments with security obligations.
- **Action:** Confirm recipient entities, countries and subprocessors; execute DPAs; assess safeguards; notify POTRAZ before continuing transfers where required; document the decision.
- **Owner/timing:** DPO and procurement; before continued production transfer.
- **Close evidence:** Brevo/host DPAs, Meta terms assessment, subprocessor list, transfer assessment and POTRAZ acknowledgement.
- **Retest:** Trace a test record end-to-end and compare actual recipients to the register and notice.

### AZ-04 — MEDIUM — Marketing consent proof is incomplete operationally

- **Observed:** Code now requires an unticked, specific Azzar Club checkbox and the server rejects requests without it. Brevo list membership and creation time provide partial evidence, but the exact displayed notice version is not written to a dedicated consent ledger.
- **Requirement/risk:** Consent must be specific, unequivocal, freely given and informed; direct-marketing objections must be honoured free of charge.
- **Action:** Create a versioned consent record containing contact, timestamp, source, notice version and status; enable double opt-in where practical; retain suppression records; test unsubscribe propagation.
- **Owner/timing:** Marketing and DPO; within 14 days.
- **Close evidence:** Sample consent record, Brevo automation configuration, unsubscribe and suppression test.
- **Retest:** Subscribe a test contact, inspect the evidence, unsubscribe, and confirm no further campaigns are sent.

### AZ-05 — HIGH — Retention, rights and breach operations not evidenced

- **Observed:** The notice now commits to a 24-month enquiry limit and 90-day browser attribution limit. No CRM deletion job, rights register, backup deletion rule, incident plan or breach register was available.
- **Requirement/risk:** The Act requires fair, proportionate and secure processing and practical rights; S.I. 155 section 17 requires notice to POTRAZ within 24 hours of awareness, high-risk data-subject communication within 72 hours, and a breach record.
- **Action:** Approve and run a retention schedule; create monthly Brevo/WhatsApp/email deletion checks; establish rights and breach registers; document detect–contain–assess–notify–remediate steps.
- **Owner/timing:** DPO and IT; before relying on the published commitment.
- **Close evidence:** Approved procedures, completed test request, deletion log, incident tabletop and DP3 template.
- **Retest:** Run a mock access/deletion request and breach exercise against all systems and backups.

### AZ-06 — MEDIUM — Abuse controls and production security need confirmation

- **Observed:** API keys remain server-side, input is validated and security headers were added. Public endpoints do not show a durable rate limiter; host access control, MFA, encryption, patching and backups were not assessable.
- **Requirement/risk:** S.I. 155 section 16 requires appropriate technical and organisational security, restoration and effectiveness testing.
- **Action:** Add host/WAF rate limiting, restrict Brevo key scope, rotate secrets, enforce MFA and least privilege, verify encrypted backups, patching, logging and restore tests.
- **Owner/timing:** Hosting administrator; 30 days, with rate limiting before promotion.
- **Close evidence:** Configuration exports, access review, secret-rotation record and restore-test report.
- **Retest:** Review headers and configuration, then conduct an authorised security assessment.

## Data-flow inventory

| Activity/system | People/data | Purpose | Controller/recipient | Country | Ground/consent | Retention | Evidence | Risk |
|---|---|---|---|---|---|---|---|---|
| Quick quote → Brevo | Prospect name, email, fence type, perimeter | Quote and follow-up | Azzar; Brevo | Zimbabwe; overseas location to confirm | User-requested quote; contextual notice | 24 months after last interaction unless justified longer | `index.html`, `hero-quote.js`, `api/quote-request.php` | HIGH pending transfer evidence |
| Azzar Club → Brevo | First name, email, source | Offers, news and advice | Azzar; Brevo | Zimbabwe; overseas location to confirm | Required unticked consent | Until opt-out/inactivity; suppression record retained | `index.html`, `popup.js`, `api/subscribe.php` | MEDIUM pending consent ledger |
| Contact/solution finder → WhatsApp | Name, phone, location, project and message | Enquiry response | Azzar; Meta/WhatsApp | Zimbabwe; overseas processing likely | User initiates WhatsApp transmission | 24 months unless justified longer | `contact.html`, `js/main.js` | HIGH pending transfer/retention evidence |
| Campaign attribution | UTM/click IDs, referrer, landing page | Attribute enquiries | Azzar; browser storage | On device until submitted/shared | Disclosed, limited purpose | 90 days | `js/main.js` | LOW after remediation |
| Facebook timeline | IP/device/cookies after click | Show social posts | Meta/Facebook | Overseas | Explicit click before iframe loads | Meta-controlled | `js/main.js`, rendered test | MEDIUM |
| Server/hosting logs | IP, request metadata, errors | Security and operations | Azzar; host | **[INFORMATION REQUIRED]** | Operational necessity, notice | **[INFORMATION REQUIRED]** | Host access unavailable | MEDIUM |

## Zimbabwe launch gate

| Control | Status |
|---|---|
| Controller status | PASS — Azzar is controller |
| POTRAZ licence/tier | UNKNOWN — evidence required |
| DPO appointment/certification/DP2 | UNKNOWN — evidence required |
| Data inventory | PARTIAL |
| Privacy notice | PASS in code; operational confirmation required |
| Cookies/trackers | PASS for reviewed build; no analytics/pixels loaded |
| Marketing consent | PASS technically; consent ledger pending |
| Forms/minimisation | PASS for reviewed fields |
| Processors/contracts | UNKNOWN |
| Cross-border transfers/POTRAZ action | UNKNOWN |
| Rights handling | UNKNOWN |
| Retention execution | UNKNOWN |
| Breach response/DP3 readiness | UNKNOWN |
| Security basics | PARTIAL |
| Children | PASS for notice; operational handling untested |
| Policy/technology consistency | PASS for reviewed build |

## Decision

**EXTERNAL LEGAL/DPO REVIEW REQUIRED.** Do not represent Azzar as fully compliant, and do not expand marketing, analytics, advertising pixels or overseas CRM transfers until AZ-01, AZ-02 and AZ-03 are closed. The reviewed website can remain informational, but the unresolved licence, DPO and transfer duties affect continued collection through Brevo and WhatsApp.

The identified privacy and data-protection risks have been addressed to the level supported by the available evidence. This does not eliminate legal risk, and jurisdiction-specific legal advice may still be required.
