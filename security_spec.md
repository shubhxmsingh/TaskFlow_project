# TaskFlow Pro Security Specification

## Data Invariants
1. A Task must belong to a valid Project.
2. Only Project members can read or write Tasks.
3. Only the Project Owner (Admin) can delete a Project or change its core settings.
4. User profiles can only be modified by the owner of the profile.
5. All IDs must be strictly validated.

## The Dirty Dozen (Test Payloads)
1. **Identity Theft**: Attempt to create a user profile with someone else's UID.
2. **Project Hijack**: Attempt to update project `ownerId` to yourself.
3. **Ghost Task**: Create a task in a project you are not a member of.
4. **Shadow Field**: Add `isVerified: true` to a user profile update.
5. **State Skip**: Update a task status to `completed` when you are not the assignee or creator.
6. **Relational Break**: Delete a task from a project you don't belong to.
7. **Resource Poisoning**: Use a 1MB string as a project ID.
8. **Immutability Breach**: Change `createdAt` on an existing task.
9. **Type Mismatch**: Send a boolean to the task `title` field.
10. **Orphaned Write**: Create a task with a non-existent `projectId`.
11. **PII Leak**: Attempt to list all users as a non-authenticated user.
12. **Admin Escalation**: Attempt to set your own `role` to `admin` in the user profile.

## Red Team Verdict
The rules in `firestore.rules` protect against all the above by:
- Using `isValidUser` and `isValidProject` helpers.
- Enforcing `affectedKeys().hasOnly()` on all updates.
- Verifying `request.auth.uid` against document fields.
- Using `exists()` to check project membership for tasks.
