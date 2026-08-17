---
'@scalar/workspace-store': minor
---

feat(workspace-store): support OpenAPI 3.2 `parent` field for nested sidebar tags

OpenAPI 3.2 introduced a `parent` field on `TagObject` that declares a
tag as a child of another tag. The sidebar now respects this field when
building the navigation tree.

Given a spec like:

```yaml
tags:
  - name: Catalog
  - name: Payer Catalog
    parent: Catalog
  - name: Provider Catalog
    parent: Catalog
```

The sidebar renders:

```
Catalog
  └── Payer Catalog
        └── (operations)
  └── Provider Catalog
        └── (operations)
```

Tags without a `parent` field are unaffected — fully backward compatible.
Unknown parent references are silently ignored (the child stays top-level).
