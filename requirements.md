# Product requirements

## Workflow
Junior CM records every cleaning, damage or non-working issue from the current inspection, groups it by room and fixture, attaches current and previous evidence, and writes a comparison note. CM reviews every item and chooses tenant responsibility, pre-existing issue, fair wear and tear, maintenance follow-up, insufficient evidence, or pending review. Keep non-chargeable items internally.

## Evidence
Each issue stores area, fixture, category, description, multiple current/previous photos, source page references in notes, preliminary finding, internal note, CM decision, tenant-facing explanation and optional AUD amount. Missing historical evidence must not automatically imply tenant responsibility.

## Output
Export only CM-confirmed tenant responsibility items. Require both sets of photos and a tenant-facing explanation. Exclude internal notes. Provide portable backup and printable tenant report.

## Production roadmap
Authenticated Junior/CM roles enforced by the server, shared database, object storage separating originals and thumbnails, audit log, recoverable versions, accessible photo comparison, and human-reviewed Console/PDF ingestion.

## Acceptance
Verify multiple-image upload and persistence after reload, filtering and search, photo comparison, backup restore, exclusion of internal notes and non-chargeable items, and blocking exports with missing evidence. Test browser compatibility and PDF print layout before operational rollout.
