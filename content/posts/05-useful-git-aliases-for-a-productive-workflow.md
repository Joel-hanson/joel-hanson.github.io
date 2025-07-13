---
title: "Git Aliases to Supercharge Your Workflow"
date: 2024-03-21
draft: false
ShowToc: true
TocOpen: false
math: true
summary: "Git aliases are a powerful workflow tool that create shortcuts to frequently used Git commands."
tags: [    "git", "version-control", "workflow", "development", "productivity", 
    "command-line", "aliases", "git-commands", "git-aliases", "coding", 
    "programming", "software-development", "github"]
categories: ["git"]
cover:
  image: "https://images.unsplash.com/photo-1605531321045-59731b348442?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  alt: "Beauty of nature"
  caption: "Photo by [Avin CP](https://unsplash.com/@avincp) on [Unsplash](https://unsplash.com/photos/green-trees-near-body-of-water-under-cloudy-sky-during-daytime-zaaXmaX9Sq4)"
  relative: true
  responsiveImages: true
---

Using git as a code versioning tool is a day-to-day activity for developers, and some of you may be practicing your git workflow through the command line. Preferably with a dark theme too, right?

Although a GUI for git might come in handy for an integrated development environment (IDE) such as IntelliJ, or VS Code, you may at times need to resort to the command line interface (CLI).

In this article, we’re have gathered git aliases that can help with a faster and more productive git workflow as an individual, or within a team.

## How to set a git alias?

Your git aliases are often stored per your user’s configuration at `~/.gitconfig`. You can also manually set aliases using, for example, the command `git config alias.s 'status -s'`.

Next, we’ll cover the git aliases, which you should add to your `~/.gitconfig` file in a specific `[alias]` section, where all aliases and their commands are stored. Check out below some examples of git aliases configuration in that file.

## How to list git aliases?

The git executable has a command line option to list all of git configuration and where they originate from (system, user, or local). The following git command will list all git configuration verbosely with their origins: `git config --list --show-origin`.

## Git Aliases

### Git status

Do you often run a `git status` command? I do! Use the following git alias to have a shortcut for it:

```markdown
[alias]
    s = status -s
    ss = status -s
```

Here it is in action:

```shell
$ git s

On branch main
Your branch is up to date with 'origin/main.

nothing to commit, working tree clean
```

### Git checkout

Moving back and forth between git branches is also something we often do. Let’s shorten that!

Add the alias:

```markdown
[alias]
    co = checkout
```

And then give it a try:

```shell
git co feat/add-popup
```

In fact, a git branch checkout can be done using a shortcut, such as `git checkout -` which checks out the previous branch you were on. It is actually a shorthand of `git checkout @{-1}` so this alias can use it as well using `git co -`.

### Create a new branch and switch to it

If you find yourself often creating new git branches from the CLI, here’s one to save you some keystrokes:

```markdown
[alias]
    cob = checkout -b
```

Use it as follows:

```shell
$ git cob feat/add-popup

Switched to a new branch 'feat/add-popup'
```

### Delete a branch

Removing a branch perhaps isn’t something you often do, but when you have to, it might be time-consuming to Google through git commands to find the command argument and flag it. Instead, we can create a shorter and more memorable git branch checkout-related alias:

```markdown
[alias]
    del = branch -D
```

Use it as follows:

```shell
$ git del feat/add-popup

Deleted branch featureB (was b5cbv113).
```

### List all branches

When we work on multiple features, our git workflow usually ends up with multiple git branches as well. Finding where we last left-off and which branch we used could be challenging.

The following git alias will list all branches and sort them by commit date, showing the most recent git branch first, based on commits made to it.

```markdown
[alias]
    br = branch --format='%(HEAD) %(color:yellow)%(refname:short)%(color:reset) - %(contents:subject) %(color:green)(%(committerdate:relative)) [%(authorname)]' --sort=-committerdate
```

Here is how to use it and what the output might look like:

```shell
$ git br
wordpress-sync/blog-git-branch-code
```

As you can see, it provides more context, such as the name of the git commit author on each of the last commits, with colorful highlights.

### Git commit

Committing always and early is one of git’s strengths. It is fast and adds no overhead due to the way git internals work. So, why not do it often?

It really depends on your specific git workflow—however, if you work on git workflows often and want to save your commits just as often (so you don’t lose track of work being done), the commit message text may be less of a priority, especially if you’re working within a pull request workflow.

To allow for a faster and more productive git workflow of saving commit status points, the following git alias is a quick one to add all git unstaged files into the staging area with a generic commit message.

```markdown
[alias]
    save = !git add -A && git commit -m 'chore: commit save point'
```

Here is how it looks like in action:

```shell
$ git save

[feat/add-popup 98cba110acb] chore: commit save point
1 file changed, 1 insertion(+)
```

### Rollback changes

If you find yourself, at times, needing to commit changes but then do a rollback, the following alias will roll all of your commit changes back into the local unstaged area, so you can make modifications and add them to the staging area (often referred to as the index).

```markdown
[alias]
    undo = reset HEAD~1 --mixed
```

Once you invoke this git alias, use `git undo` to reset the previous commit on this branch, and check out all the previous committed changes as uncommitted, so you can resume work on them.

Use it as follows:

```shell
git undo
```

### Clean all changes

We all wish for a fresh start, don’t we? When in need of a quick clean up of all of your local changes which you wish to avoid committing to the repository at this stage, even locally, use the following alias:

```markdown
[alias]
    res = !git reset --hard
```

It resets all staged changes (those that you added with the git add command). Here is how it looks like in action:

```shell
$ git res
HEAD is now at 6e7879bc81a chore: commit save point 
```

### Push changes to upstream

By the time you finish working on the code, you send commits upstream to the git repository like all of us, right? We often do that using a lengthy command: `git push origin` or `git push origin main`.

However, if you’re working on the same branch name as the one you wish to push changes to, then we can alias the remote branch name as HEAD. Push your commits from the local git repository to the origin or upstream remotes with a shortcut as simple as `git done` using this alias:

```markdown
[alias]
    done = !git push origin HEAD
```

Using this alias and the shortcut of HEAD is often useful when the branch names are long. Here is how it is easily used:

```shell
git done
```

### Git log

To wrap up, we’re going to feature one of the most useful git commands: git log. There are many different ways of using git aliases to construct log output but my suggestion is to use the following customized git alias:

```markdown
[alias]
    lg = !git log --pretty=format:\"%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(dim green)(%cr) [%an]\" --abbrev-commit -30
```

This git alias will make git log print an output that is considerably more readable. Try it out:

```shell
$ git log
wordpress-sync/blog-git-log
```

Certainly! Here's the updated Markdown document with explanations for each Git alias:

#### One-line Log

```markdown
[alias]
    l = log --pretty=format:"%C(yellow)%h\\ %ad%Cred%d\\ %Creset%s%Cblue\\ [%cn]" --decorate --date=short
```

This alias provides a concise one-line log output showing commit hash, date, branch, commit message, and author name.

### Add

```markdown
[alias]
    a = add
```

This alias is a shorthand for the `git add` command, allowing you to stage changes for commit more quickly.

#### Add Patch

```markdown
[alias]
    ap = add -p
```

This alias is for adding changes interactively, allowing you to selectively stage portions of changed files.

### Commit

```markdown
[alias]
    c = commit --verbose
```

This alias is a shorthand for committing changes with verbose output, providing more details about the commit.

#### Commit All

```markdown
[alias]
    ca = commit -a --verbose
```

This alias is for committing all changes, including untracked files, with verbose output.

#### Commit Message

```markdown
[alias]
    cm = commit -m
```

This alias allows you to commit changes with a specified message without opening an editor.

#### Commit All with Message

```markdown
[alias]
    cam = commit -a -m
```

This alias combines committing all changes with a specified message, useful for quick commits.

### Amend

```markdown
[alias]
    m = commit --amend --verbose
```

This alias allows you to amend the previous commit with new changes while maintaining the same commit message.

### Diff

```markdown
[alias]
    d = diff
```

This alias is a shorthand for the `git diff` command, showing changes between commits, commit and working tree, etc.

#### Diff Stat

```markdown
[alias]
    ds = diff --stat
```

This alias provides a summarized view of changes, showing which files were modified and how many lines were added or removed.

#### Diff Cached

```markdown
[alias]
    dc = diff --cached
```

This alias shows changes in the staging area compared to the last commit, useful for reviewing staged changes before committing.

### Status Short

```markdown
[alias]
    s = status -s
```

This alias provides a concise, short summary of the current repository status, showing which files are modified, staged, or untracked.

### Checkout

```markdown
[alias]
    co = checkout
    cob = checkout -b
```

This alias is a shorthand for switching branches or restoring files from the repository.

#### Checkout and Create Branch

```markdown
[alias]
    cob = checkout -b
```

This alias combines creating a new branch and checking it out in one command.

### Branches Sorted by Last Modified

```markdown
[alias]
    b = "!git for-each-ref --sort='-authordate' --format='%(authordate)%09%(objectname:short)%09%(refname)' refs/heads | sed -e 's-refs/heads/--'"
```

This alias lists all branches sorted by the last commit date, providing insight into the most recently modified branches.

### List Aliases

```markdown
[alias]
    la = "!git config -l | grep alias | cut -c 7-"
```

### Branch Management

For working with branches, these aliases can save you a lot of time:

```shell
[alias]
    br = branch --format='%(HEAD) %(color:yellow)%(refname:short)%(color:reset) - %(contents:subject) %(color:green)(%(committerdate:relative)) [%(authorname)]' --sort=-committerdate
```

The alias `br` in the given command is used to list branches in a Git repository with a customized format for displaying each branch's information.

### Committing frequently

Committing frequently? These will help:

```shell
[alias]
    save = !git add -A && git commit -m 'chore: savepoint'
```

```shell
[alias]
    m = commit --amend --verbose
```

- `m`: allows you to modify the most recent commit with verbose output, letting you change the commit message and include any staged changes.

### Log

A prettier and more readable log output:

```shell
[alias]
    lg = !git log --pretty=format:\"%C(magenta)%h%Creset -%C(red)%d%Creset %s %C(dim green)(%cr) [%an]\" --abbrev-commit -30
    l = log --pretty=format:"%C(yellow)%h\\ %ad%Cred%d\\ %Creset%s%Cblue\\ [%cn]" --decorate --date=short
```

- `lg`: displays the last 30 commits in a compact, colorful format, showing the commit hash, commit message, relative commit time, and author.
- `l`: displays a one-line log with the commit hash, short date, ref names, commit message, and committer name, all highlighted with colors for better readability.

### Push

Push your changes with ease:

```shell
[alias]
    done = !git push origin HEAD
    pushitgood = push -u origin --all
    po = !echo 'Ah push it' && git push origin && echo 'PUSH IT REAL GOOD'
```

- `done`: Pushes the current branch to the remote repository named origin.
- `pushitgood`: Pushes all local branches to the remote repository named origin and sets the upstream tracking for the branches.
- `po`: Pushes the current branch to the remote repository named origin, with playful messages displayed before and after the push.

### Reset

Need a fresh start? Clean up with these:

```shell
[alias]
    undo = reset HEAD~1 --mixed
    res = !git reset --hard
    undo-commit = reset --soft HEAD~1
```

- `undo`: Reverts the last commit, keeping changes in the working directory unstaged.
- `res`: Resets the working directory and index to the last commit, discarding all changes.
- `undo-commit`: Reverts the last commit, keeping changes staged in the index.

### Remote and Submodules

Manage remotes and submodules efficiently:

```shell
[alias]
    rao = remote add origin
    sup = submodule update --init --recursive
    sobmodules = submodule update --init --recursive
```

- `rao`: Adds a remote repository named "origin."
- `sup`: Initializes and updates all submodules recursively.
- `sobmodules`: Initializes and updates all submodules recursively (same as `sup`).

### Rebasing and Merging

Streamline your rebasing and merging tasks:

```shell
[alias]
    rb = "!f() { \
            echo fetching...; \
            git fetch; \
            if [ $? -eq 0 ]; then \
                last_status=$(git status --untracked-files=no --porcelain); \
                if [ \"$last_status\" != \"\" ]; then \
                    echo stashing local changes...; \
                    git stash; \
                else \
                    echo nothing to stash...; \
                fi;\
                if [ $? -eq 0 ]; then \
                    echo rebasing...;\
                    git rebase;\
                    if [ $? -eq 0 ]; then \
                        if [ \"$last_status\" != \"\" ]; then\
                            echo applying stashed changes...;\
                            git stash pop;\
                            if [ $? -ne 0 ]; then \
                                echo STASH POP FAIL - you will need to resolve merge conflicts with git mergetool; \
                            fi; \
                        fi; \
                    else \
                        echo REBASE FAILED - you will need to manually run stash pop; \
                    fi;\
                fi;\
            fi; \
            if [ $? -ne 0 ]; then \
                echo ERROR: Operation failed; \
            fi; \
        }; f"
    ria = '!git rebase -i `git merge-base HEAD master`'
    clean-merged = !git branch --merged | grep -v \"\\*\" | xargs -n 1 git branch -d
```

- `rb`: Fetches updates, stashes local changes if needed, rebases, then applies stashed changes.
- `ria`: Interactively rebases the current branch onto the master branch from their common ancestor.
- `clean-merged`: Deletes all branches that have been merged into the current branch.

### Extra Goodies

A few more handy aliases for special tasks:

```shell
[alias]
    git-current-branch = "!git rev-parse --abbrev-ref HEAD"
    ga = add -A
    gap = add -p
    gch = cherry-pick
    gpthis = !git push origin $(git_current_branch)
    gpthis! = !git push --set-upstream origin $(git_current_branch)
    fb = !sh -c \"git branch -a | grep -v remotes | grep $1\"
    cb = !sh -c \"git branch -a | grep -v remotes | grep $1 | head -n 1 | xargs git checkout\"
    sco = !sh -c "git branch -a | grep -v remotes | grep $1 | xargs git checkout"
    fc = "!f() { git branch -a | grep -m1 -e ${1}.*${2} | sed \"s/remotes\\/origin\\///\" | xargs git checkout; }; f"
```

- `git-current-branch`: Retrieves the name of the current branch.
- `ga`: Stages all changes in the working directory for commit.
- `gap`: Interactively stages changes in the working directory for commit.
- `gch`: Applies changes from a specific commit to the current branch.
- `gpthis`: Pushes the current branch to the remote repository named "origin".
- `gpthis!`: Pushes the current branch to the remote repository named "origin" and sets it as the
- `fb`: Searches for branches matching a specific pattern.
- `cb`: Checks out the first branch matching a specific pattern.
- `sco`: Checks out branches matching a specific pattern.
- `fc`: Checks out the first branch matching two specific patterns.

### Wrapping Up

Git aliases can save you a ton of time and keystrokes, making your workflow smoother and more enjoyable. Try adding these to your `~/.gitconfig` and watch your productivity soar! 🌟

Happy coding, and may your commits be clean and your merges conflict-free! 💻✨

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
