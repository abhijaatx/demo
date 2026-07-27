# Folder lifecycle rules

Folders are private to one workspace and may be nested to a maximum of ten levels. The server, not the browser, verifies the workspace, permissions, parent relationship, and hierarchy depth for every operation.

## Moving

- A folder cannot be moved into itself or any descendant.
- A move supplies the folder's current version. A stale version returns a conflict and changes nothing.
- The server serializes structural changes within a workspace, preventing concurrent moves from creating a cycle.
- Moving a folder keeps its descendants and all demo assignments unchanged.
- Moving a demo assigns it to one folder in the same workspace, or to **Unfiled**.

## Deleting

Deleting a folder does not delete demos or nested folders. In one transaction, its direct child folders and direct demos move to its parent. If it had no parent, they become top-level folders or Unfiled demos. The deletion is audit logged. Folder deletion is currently immediate; the associated demos remain governed by the demo trash and retention policy.
