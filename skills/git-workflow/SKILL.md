---
name: git-workflow
description: Manage day-to-day Git operations safely in local repositories. Use when the user asks to inspect status/history, create or split commits, stage changes intentionally, move work across branches, merge/rebase/cherry-pick commits, resolve conflicts, prepare PR-ready branches, or recover from mistakes without destructive history rewrites.
---

# Git Workflow

## Overview

Use explicit, non-interactive Git commands to keep history clean, avoid accidental data loss, and deliver predictable outcomes.

## Quick Triage

Run these first to build context:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
git diff --name-status
git diff --stat
git log --oneline --decorate --graph -n 20
```

## Commit Workflow

Use this sequence for safe commits:

```bash
git add <path1> <path2>
git diff --cached
git commit -m "<type>: <summary>"
git status --short
```

When amending the most recent local commit:

```bash
git add <path>
git commit --amend --no-edit
```

## Branch Workflow

Use these patterns:

```bash
git switch -c <new-branch>
git switch <existing-branch>
git branch -m <new-name>
git fetch origin --prune
```

Check divergence before pushing:

```bash
git log --oneline --decorate origin/<branch>..HEAD
git log --oneline --decorate HEAD..origin/<branch>
```

## Rebase and Merge Workflow

Rebase feature branch onto main:

```bash
git fetch origin
git rebase origin/main
```

Merge a branch without editing the merge message interactively:

```bash
git merge --no-ff --no-edit <branch>
```

Cherry-pick specific commits:

```bash
git cherry-pick <commit-sha>
```

## Conflict Resolution Workflow

Use this sequence:

```bash
git status
# resolve files manually
git add <resolved-files>
git rebase --continue   # or: git merge --continue / git cherry-pick --continue
```

Abort safely when needed:

```bash
git rebase --abort
git merge --abort
git cherry-pick --abort
```

## PR Readiness Checks

Run before opening or updating a PR:

```bash
git status --short
git diff --stat origin/main...HEAD
git log --oneline --decorate origin/main..HEAD
```

## Safe Recovery Commands

Prefer non-destructive recovery:

```bash
git restore <path>            # discard unstaged file changes
git restore --staged <path>   # unstage file
git revert <commit-sha>       # undo commit with new commit
git reflog                    # recover prior HEAD positions
```

## Safety Rules

- Use non-interactive commands by default.
- Refuse destructive history rewrites unless the user explicitly requests them.
- Never run `git reset --hard` or `git checkout -- <path>` without explicit approval.
- Avoid `git push --force` unless the user explicitly confirms.
