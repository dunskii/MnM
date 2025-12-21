# Planning Directory

This directory contains all project planning, specifications, and reference materials for Music 'n Me.

## Directory Structure

```
Planning/
├── README.md                 # This file
├── specifications/           # Active technical specifications (current MVP)
├── roadmaps/                 # Timeline plans and task lists
├── reference/                # Brand guidelines, architecture docs, client materials
│   └── screenshots/          # UI reference screenshots
└── archive/                  # Outdated or superseded documents
    ├── early-drafts/         # Initial planning documents (pre-client meeting)
    └── meeting-notes/        # Raw meeting notes (incorporated into specs)
```

---

## Active Documents

### Specifications (`specifications/`)
**Current technical specifications for MVP features:**

| Document | Description | Status |
|----------|-------------|--------|
| `Meet_and_Greet_Specification.md` | Public booking system for prospective parents | Active |
| `Google_Drive_Sync_Specification.md` | Two-way file sync with Google Drive | Active |
| `Account_Deletion_Specification.md` | GDPR/Privacy Act/COPPA compliance | Active |
| `PASSWORD_SECURITY_IMPLEMENTATION.md` | Authentication & password security implementation plan | Active |

### Roadmaps (`roadmaps/`)
**Project timeline and task tracking:**

| Document | Description | Status |
|----------|-------------|--------|
| `12_Week_MVP_Plan.md` | Current sprint breakdown by week | **Primary Plan** |
| `Development_Task_List.md` | Comprehensive task checklist (300+ items) | **Active Checklist** |
| `Phase_2_Roadmap.md` | Post-MVP features and timeline | Reference |

### Reference (`reference/`)
**Background materials and architectural docs:**

| Document | Description |
|----------|-------------|
| `Brand_Guidelines_Reference.md` | Colors, fonts, logo usage |
| `00_MNM_Brand Guideline (2).pdf` | Official brand guidelines PDF |
| `Technical_Architecture_Overview.md` | System architecture details |
| `Music_n_Me_System_Overview.md` | Original client requirements |
| `Body_Chi_Me_Review_And_Recommendations.md` | Patterns from similar project |
| `MNM Teachers - Simply Portal SOP.pdf` | Current system user guide |
| `QUICK_START_IMPLEMENTATION.md` | Claude Code setup guide (slash commands, agents) |
| `IMPLEMENTATION_COMPLETE.md` | Development workflow reference guide |
| `screenshots/` | UI reference images from current system |

---

## Archived Documents

### Archive (`archive/`)
**Superseded or outdated documents - kept for reference:**

| Document | Reason Archived |
|----------|-----------------|
| `8_Week_MVP_Plan.md` | Superseded by 12-week plan |
| `Phase_3_Internationalization.md` | Future planning, not MVP |
| `Phase_3_Multi_School_SaaS_Expansion.md` | Future planning, not MVP |
| `Development_Guidelines.md` | Merged into `docs/` directory |
| `Subagent_Deployment_Plan.md` | Claude Code internal tooling |

### Early Drafts (`archive/early-drafts/`)
**Initial planning before client meeting - may contain outdated information:**

- Feature prioritization drafts
- Early schema designs
- Sprint breakdowns (14-16 week versions)
- Git workflow guides (moved to `docs/`)

### Meeting Notes (`archive/meeting-notes/`)
**Raw notes from client meetings - incorporated into specifications:**

- `post meeting additions.md` - Notes from initial client meeting

---

## Quick Reference

### Where to Find What

| Looking for... | Go to... |
|----------------|----------|
| Current sprint tasks | `roadmaps/Development_Task_List.md` |
| Week-by-week plan | `roadmaps/12_Week_MVP_Plan.md` |
| Meet & Greet technical spec | `specifications/Meet_and_Greet_Specification.md` |
| Google Drive sync spec | `specifications/Google_Drive_Sync_Specification.md` |
| Account deletion/privacy spec | `specifications/Account_Deletion_Specification.md` |
| Brand colors and fonts | `reference/Brand_Guidelines_Reference.md` |
| System architecture | `reference/Technical_Architecture_Overview.md` |
| Post-MVP features | `roadmaps/Phase_2_Roadmap.md` |

### Document Naming Convention

- `*_Specification.md` - Detailed technical specifications
- `*_Plan.md` - Timeline/sprint planning documents
- `*_Roadmap.md` - Future feature planning
- `*_Overview.md` - High-level summaries
- `*_Reference.md` - Reference materials and guidelines

---

## Maintenance

### Adding New Documents

1. **Specifications**: Add to `specifications/` with `*_Specification.md` suffix
2. **Plans/Timelines**: Add to `roadmaps/`
3. **Reference Materials**: Add to `reference/`
4. **Meeting Notes**: Add to `archive/meeting-notes/` (then incorporate into specs)

### Archiving Documents

When a document becomes outdated:
1. Move to `archive/` or appropriate subfolder
2. Update this README
3. Update `CLAUDE.md` if referenced there

---

**Last Updated:** 2025-12-21
