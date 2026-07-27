# Art Appraisers Directory consolidation

Decision date: 2026-07-27
Release state source of truth:
`/srv/manager/projects/art-directory-consolidation-20260727/implementation-task-list.md`

The property is being consolidated into
`https://antique-appraiser-directory.appraisily.com/`.

Canonical implementation record:

- `/srv/manager/projects/art-directory-consolidation-20260727/decision-and-implementation.md`
- `/srv/manager/projects/art-directory-consolidation-20260727/route-map.json`
- `/srv/manager/projects/art-directory-consolidation-20260727/implementation-task-list.md`
- `/srv/manager/projects/art-directory-consolidation-20260727/deployment-approval-packet.md`

## Maintenance boundary

- Do not start new SEO recovery, dependency-refresh, or UI remediation work for
  this property unless it blocks the approved consolidation or a live security
  issue.
- Preserve the current static release as rollback evidence.
- Do not delete suppressed profiles or historical retirement records.
- Do not submit more old-host URLs for indexing.
- The prior ARTQA and corrective GSC tasks become superseded by the
  consolidation Day-14 and Day-28 reads.
- Do not mark the property retired until all public source routes return one
  permanent hop to validated destination routes.
