# Content Format

Markdown files in this directory are the authoring source of truth for the MVP.

## Required Frontmatter

```yaml
slug: example-slug
title: Example Title
type: concept
summary: A short summary.
area: calculus
subarea: differential calculus
historical_start_year: 1665
historical_end_year:
period_label: Scientific Revolution
mathematicians:
  - isaac-newton
references:
  - title: Example Reference
    url: https://example.com
relations:
  - target_slug: another-entry
    relation_type: related_to
    evidence: Optional note
```

## Supported Types

- `concept`
- `theorem`
- `mathematician`

## Supported Relation Types

- `defines_with`
- `used_in_proof`
- `related_to`
- `worked_on`
- `belongs_to_area`
- `influenced_by`

