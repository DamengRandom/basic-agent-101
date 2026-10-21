# dameng

A small AI coding assistant for your terminal. You type what you want in plain English, and it reads, creates, edits and deletes files and runs commands in the current folder to get it done.

Built with [Bun](https://bun.com) and the [AI SDK](https://ai-sdk.dev). Works with any OpenAI-compatible model.

## Quick start

```bash
bun install
cp .env.example .env   # add your model name, API key and base URL
bun link               # lets you run `dameng` from any folder
```

Then go to any project folder and start it:

```bash
cd ~/my-project
dameng
```

Type a request after `Your type:`. Type `exit` to quit.

## Examples

**Create a file**

```
Create hello.ts that prints "Hello world", then run it with bun.
```

**Read a file**

```
Read package.json and list the dependencies.
```

**Update a file**

```
In hello.ts, change "Hello world" to "Hi there".
```

**Delete a file**

```
Delete hello.ts.
```

**Bigger task, step by step**

```
Make a todo list, then: create math.ts with an add function, write a test for it, and run the test.
```

It shows a checklist and ticks items off as it goes:

```
[x] 1 Create math.ts
[>] 2 Write the test
[] 3 Run the test
```

## Skills

A skill is a markdown file of instructions the assistant reads only when needed, like a how-to guide for one topic.

Put one in `skills/<name>/SKILL.md` inside the folder where you run `dameng`:

```markdown
---
name: bun-testing
description: How to write and run tests with Bun
---

Use `bun test`. Import test and expect from "bun:test". ...
```

Then ask:

```
Load the bun-testing skill and write tests for math.ts.
```

> You need at least one skill in `skills/`, or it won't start.

## Good to know

- It can only touch files inside the folder you started it in.
- It remembers the conversation until you exit.
- It can hand side tasks to a helper agent: `Use a subagent to summarize every .ts file.`
- It runs real commands, so use it in a git repo where you can review and undo changes.

## For contributors

| File | What it does |
| --- | --- |
| `index.ts` | Chat loop in the terminal |
| `model.ts` | Model setup and system prompts |
| `tools.ts` | What the assistant can do: run commands, read/write/edit files, todos, skills, subagent |
| `todo.ts` | Todo checklist |
| `skills.ts` | Loads skills from `skills/` |

Test cases and known issues: [TESTING.md](TESTING.md).
