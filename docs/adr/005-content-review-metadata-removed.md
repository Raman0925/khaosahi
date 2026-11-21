# 005. Content review by the owner's dietitian; no per-item review metadata

- Status: Accepted (owner decision)
- Date: 2026-11-21

## Context

The original brief tracked a dietitian review per content item (`reviewedBy` / `reviewedOn`, drafts
marked `"PENDING"`) and failed release builds until every item was reviewed. The owner reports
that the content was reviewed by a registered dietitian (a friend of the owner) and asked to
remove the per-item review fields.

## Decision

`reviewedBy` and `reviewedOn` are removed from the content schemas, all content JSON and the
validator. Release validation still enforces schemas, full plan/tip counts, swap ids, duplicate ids
and forbidden medical-claim wording ("cure", "guarantee", …).

## Consequences

- There is no per-item audit trail of the review in the repo; the owner holds that record.
- Any future content change should be checked by a dietitian before release.
- Safety still relies on conservative wording ("may help"), the disclaimer on every article and
  food detail, and free (never ad-gated) red-flag "see a doctor" content.
