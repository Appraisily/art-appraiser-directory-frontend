# Art Appraisers Directory consolidation (superseded)

Decision date: 2026-07-27
Superseded: 2026-08-16

The July 27 consolidation into
`https://antique-appraiser-directory.appraisily.com/` is no longer the live
policy. The operator restored the standalone Art host on 2026-08-16.

Canonical restore record:

- `/srv/manager/projects/art-directory-restore-20260816/decision.md`

Historical consolidation records remain for rollback evidence only:

- `/srv/manager/projects/art-directory-consolidation-20260727/decision-and-implementation.md`
- `/srv/manager/projects/art-directory-consolidation-20260727/route-map.json`
- `/srv/manager/projects/art-directory-consolidation-20260727/implementation-task-list.md`
- `/srv/manager/projects/art-directory-consolidation-20260727/deployment-approval-packet.md`

## Current maintenance boundary

- Keep both hosts live. Art pages must stay art-only.
- Do not reintroduce Art-host 301s to antique.
- Do not delete suppressed profiles or historical retirement records.
- Do not submit Art URLs for indexing until they return 200 with self-canonicals.
- Unknown Art city and provider routes stay terminal.
- Antique copies of the five reviewed Art specialists should 301 back to Art
  after the Art host is serving content.
