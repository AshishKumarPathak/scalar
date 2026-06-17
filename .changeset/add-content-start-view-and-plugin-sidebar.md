---
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': minor
---

Add plugin page views, `content.start` slot, and sidebar visibility for plugin view components.

- **`page` option on `ViewComponent`**: Plugins can now register standalone page views that replace the API endpoint content entirely when navigated to. Set `page: true` on a view component to enable this behavior.
- **`slug` option on `ViewComponent`**: Custom URL slug for page-level plugin views, used for routing and identification. Defaults to a slugified version of the sidebar label.
- **`content.start`**: A new view slot that renders custom plugin components **before** the Introduction/Info section (at the top of the content area).
- **`sidebar` option on `ViewComponent`**: Plugins can opt-in to display a sidebar entry for their custom views by providing `sidebar: { show: true, label: 'My Page' }`.
- **`RenderPluginPage` component**: New dedicated component for rendering plugin page views, separated from inline rendering for testability and single responsibility.
