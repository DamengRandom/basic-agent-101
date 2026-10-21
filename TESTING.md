# Testing

Manual test cases for each feature. Expected results come from reading the code.

Use these scenarios to check each feature by hand. Run `dameng` in a scratch folder that has a `skills/` directory (see [Skills](#skills)).

## CLI loop (`index.ts`)

| #   | Input                                             | Expected                                                               |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `exit`                                            | CLI closes right away, no model call                                   |
| 2   | `  QUIT  `                                        | Same as 1 (input is trimmed and lowercased)                            |
| 3   | `my name is Bob`, then `what is my name?`         | Second reply says "Bob" (history is kept)                              |
| 4   | Any message                                       | "Thinking .." spinner shows, then disappears before the reply prints   |
| 5   | Break `DEFAULT_API_KEY` in `.env`, send a message | Error is logged, then `Agent loop failed.` is thrown                   |
| 6   | Ask for a long task without using todos           | After 3 steps with no `todo` call, a reminder is added to the messages |

## `bash` tool

| #   | Input                                    | Expected                                                                                                  |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | `run ls`                                 | Prints `Running command - (From agent Dameng): ls` and lists files                                        |
| 2   | Command that prints nothing, e.g. `true` | Tool returns `-`                                                                                          |
| 3   | Failing command, e.g. `ls nope`          | stderr is returned (stdout + stderr are combined)                                                         |
| 4   | Command printing more than 50,000 chars  | Output is cut to 50,000 chars                                                                             |
| 5   | Command running longer than 120s         | Killed by the timeout                                                                                     |
| 6   | `sudo ls`                                | Should return `Blocked command, not allowed for agent Dameng to run` ⚠️ see [Known issues](#known-issues) |
| 7   | `rm -rf /`                               | Blocked, same message as 6                                                                                |

## `read` tool

| #   | Input                                    | Expected                                                  |
| --- | ---------------------------------------- | --------------------------------------------------------- |
| 1   | `read package.json`                      | Full file content                                         |
| 2   | `read the first 3 lines of package.json` | Only 3 lines (`limit: 3`)                                 |
| 3   | Empty file                               | Returns `..`                                              |
| 4   | `../outside.txt` or `/etc/passwd`        | Error: `Path ... is not within the working directory ...` |
| 5   | File that does not exist                 | Tool throws an error (ENOENT)                             |

## `write` tool

| #   | Input                              | Expected                                                                                             |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | `write hello to a.txt`             | `a.txt` created, returns `Wrote 5 words to .../a.txt` (the number is actually characters, not words) |
| 2   | `write to deep/nested/b.txt`       | Missing folders are created                                                                          |
| 3   | Existing file                      | File is overwritten                                                                                  |
| 4   | Path outside the working directory | Error, nothing written                                                                               |

## `edit` tool

| #   | Input                                | Expected                                                |
| --- | ------------------------------------ | ------------------------------------------------------- |
| 1   | Replace `hello` with `hi` in `a.txt` | Returns `Replaced hello with hi in ...`                 |
| 2   | Text appears twice                   | Only the **first** match is replaced                    |
| 3   | Text not in the file                 | Returns `Old text ... not found in ...`, file unchanged |
| 4   | Path outside the working directory   | Error, file unchanged                                   |

## `exit` tool

| #   | Input          | Expected                                                                   |
| --- | -------------- | -------------------------------------------------------------------------- |
| 1   | `bye, thanks!` | Model calls `exit`, prints `Bye from Dameng 👋`, process exits with code 0 |

## `todo` tool (`TodoManager`)

| #   | Input to `update(items)`                          | Expected                                              |
| --- | ------------------------------------------------- | ----------------------------------------------------- |
| 1   | `[]`                                              | `No items to render.`                                 |
| 2   | One `pending`, one `in_progress`, one `completed` | Lines with `[]`, `[>]`, `[x]`, then `(1/3) completed` |
| 3   | 21 items                                          | Throws `Too many items, only max 20 items.`           |
| 4   | Two items `in_progress`                           | Throws `Only one item can be in progress.`            |
| 5   | Each call                                         | Replaces the whole list, it doesn't append            |

Example output for case 2:

```
[] 1 write tests
[>] 2 run tests
[x] 3 read code

(1/3) completed
```

Prompt to try it end to end: `create hello.ts, run it with bun, then add a comment to it. Track it with todos.`

## Skills

Skills live in `skills/<name>/SKILL.md` in the working directory:

```markdown
---
name: bun-testing
description: Write and run tests with bun:test
---

# Body loaded on demand
```

| #   | Setup / input                                           | Expected                                                                           |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | One valid skill                                         | System prompt ends with `Skills: - bun-testing: Write and run tests with bun:test` |
| 2   | No `skills/` folder                                     | Folder is created, then startup fails with `No Skills Found ..`                    |
| 3   | Frontmatter without `name`                              | Folder name is used as the skill name                                              |
| 4   | Frontmatter without `description`                       | Listed as `- <name>: -`                                                            |
| 5   | `SKILL.md` without `---` frontmatter                    | Whole file becomes the body, meta is empty                                         |
| 6   | Value containing `:` (e.g. `description: a: b`)         | Kept in full: `a: b`                                                               |
| 7   | Folder without `SKILL.md`, or a loose file in `skills/` | Skipped                                                                            |
| 8   | `load the bun-testing skill`                            | `skill_get` returns `<skill name=bun-testing>\n...body...\n</skill>`               |
| 9   | `skill_get` with an unknown name                        | Returns `Skill <name> not found ..`                                                |

## `task` tool (sub-agent Ellie)

| #   | Input                                      | Expected                                                                             |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1   | `use a subagent to summarize package.json` | Prints `Spawning subagent Ellie with task: ...`, Ellie's summary comes back to Cetra |
| 2   | Ellie's context                            | Fresh: she shares the file system but not the chat history                           |
| 3   | Ellie's tools                              | All `TOOLS` but **no** `task`, so she can't create more sub-agents                   |

## Known issues

- **`bash` block list is reversed.** `runBash` checks `cmd.includes(command)` (does the blocked string contain the command?) instead of `command.includes(cmd)`. So `sudo ls` is **not** blocked, but a short command like `s` or `rm` is. Bash test case 6 fails until this is fixed.
- **`safePath` uses a prefix check.** If the working dir is `/a/proj`, a path like `/a/proj-other/x` still passes `startsWith`.
- **Todo status isn't checked.** The `todo` schema accepts any string, so an unknown status renders as `undefined`.
