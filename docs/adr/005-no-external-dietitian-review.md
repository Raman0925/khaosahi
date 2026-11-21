# 005. Content ships without an external dietitian review

- Status: Accepted (owner decision)
- Date: 2026-11-21

## Context

The original brief required every food, plan item, tip and article to be reviewed by a registered
dietitian, and the release build failed while any item was `reviewedBy: "PENDING"`. The owner
decided not to use an external dietitian review.

## Decision

`reviewedBy` / `reviewedOn` stay in the schema as honest metadata: items remain `"PENDING"`
(never relabelled as reviewed). The validator reports the count as a warning only; release builds
no longer fail on it. Release validation still enforces schemas, full plan/tip counts, swap ids,
duplicate ids and forbidden medical-claim wording ("cure", "guarantee", …).

## Consequences

- Safety relies on conservative wording ("may help"), the in-app disclaimer on every article and
  food detail, red-flag "see a doctor" content in free (never ad-gated) articles, and the claim
  check in the validator.
- Do not state in the Play listing or the app that content is dietitian-reviewed.
- If a review happens later, set `reviewedBy`/`reviewedOn` on the reviewed items.
