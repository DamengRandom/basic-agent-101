import { zodSchema, tool, generateText, isLoopFinished } from "ai";
import z from "zod";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { model, SUBAGENT_SYSTEM_PROMPT } from "./model";
import { TodoManager, type TODO_ITEM } from "./todo";
import { clearLine } from "./spinner";
import { SkillLoader } from "./skills";

// Types
type Command = {
  command: string;
};

type ReadFileProps = {
  filePath: string;
  limit?: number;
};

type WriteFileProps = {
  filePath: string;
  content: string;
};

type EditFileProps = {
  filePath: string;
  oldText: string;
  newText: string;
};

const WORKING_DIR = process.cwd();
const BLOCKED_COMMANDS = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"];

const safePath = (filePath: string) => {
  const resolvedPath = path.resolve(WORKING_DIR, filePath);

  if (!resolvedPath.startsWith(WORKING_DIR)) {
    throw new Error(`Path ${filePath} is not within the working directory ${WORKING_DIR}`);
  }

  return resolvedPath;
};

const todoManager = new TodoManager();
const skillLoader = new SkillLoader();

export const skillDescriptions = skillLoader.getDescriptions();

export const WITH_SKILLS_SYSTEM_PROMPT = `You are a helpful coding agent Cetra at ${WORKING_DIR}.
Use the todo tool to plan multi-step tasks. Mark in_progress before starting, completed when done.
Use the task tool to delegate exploration or subtasks.
Use the skill_get tool to load specialized knowledge by name.
Skills: ${skillDescriptions}`;

// Tools definitions
const runBash = (command: string): string => {
  if (BLOCKED_COMMANDS.some((cmd) => cmd.includes(command))) {
    return "Blocked command, not allowed for agent Dameng to run";
  }

  try {
    const result = spawnSync("sh", ["-c", command], {
      cwd: WORKING_DIR,
      encoding: "utf-8",
      timeout: 120000,
    });

    // return result.stdout.toString().trim();
    return (result.stdout + result.stderr).trim().slice(0, 50000) || "-";
  } catch (error) {
    console.log(`Error running command: ${error}`);

    return "Error occurred while running command ..";
  }
};

const runRead = (filePath: string, limit?: number): string => {
  try {
    const fp = safePath(filePath);
    const lines = fs.readFileSync(fp, "utf-8").split("\n");

    return (limit ? lines.slice(0, limit) : lines).join("\n").slice(0, 50000) || "..";
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }
};

const runWrite = (filePath: string, content: string): string => {
  try {
    const fp = safePath(filePath);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content || "");

    return `Wrote ${content.length} words to ${fp}`;
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }
};

const runEdit = (filePath: string, oldText: string, newText: string): string => {
  try {
    const fp = safePath(filePath);
    const content = fs.readFileSync(fp, "utf-8");

    if (!content.includes(oldText)) {
      return `Old text ${oldText} not found in ${fp}`;
    }

    fs.writeFileSync(fp, content.replace(oldText, newText));

    return `Replaced ${oldText} with ${newText} in ${fp}`;
  } catch (error) {
    throw new Error(JSON.stringify(error, null, 2));
  }
};

export const TOOLS = {
  bash: tool({
    description: "Run a shell command",
    inputSchema: zodSchema(z.object({ command: z.string() })),
    execute: async ({ command }: Command) => {
      clearLine();
      console.log(`Running command - (From agent Dameng): ${command}`);
      const OUTPUT = runBash(command);

      return OUTPUT;
    },
  }),
  read: tool({
    description: "Read a file",
    inputSchema: zodSchema(z.object({ filePath: z.string(), limit: z.number().optional() })),
    execute: async ({ filePath, limit }: ReadFileProps) => {
      clearLine();
      console.log(`Reading file - (From agent Dameng): ${filePath}`);
      const OUTPUT = runRead(filePath, limit);

      return OUTPUT;
    },
  }),
  write: tool({
    description: "Write a file",
    inputSchema: zodSchema(z.object({ filePath: z.string(), content: z.string() })),
    execute: async ({ filePath, content }: WriteFileProps) => {
      clearLine();
      console.log(`Writing file - (From agent Dameng): ${filePath}`);
      const OUTPUT = runWrite(filePath, content);

      return OUTPUT;
    },
  }),
  edit: tool({
    description: "Edit a file",
    inputSchema: zodSchema(z.object({ filePath: z.string(), oldText: z.string(), newText: z.string() })),
    execute: async ({ filePath, oldText, newText }: EditFileProps) => {
      clearLine();
      console.log(`Editing file - (From agent Dameng): ${filePath}`);
      const OUTPUT = runEdit(filePath, oldText, newText);

      return OUTPUT;
    },
  }),
  exit: tool({
    description: "Exit the agent when the user wants to quit or says goodbye",
    inputSchema: zodSchema(z.object({})),
    execute: async (): Promise<string> => {
      clearLine();
      console.log("Bye from Dameng 👋");
      process.exit(0);
    },
  }),
  todo: tool({
    description: "Update the todo list. Track progress on multi-step tasks.",
    inputSchema: zodSchema(z.object({ items: z.array(z.object({ id: z.string(), text: z.string(), status: z.string() })) })),
    execute: async ({ items }) => {
      clearLine();
      const output = todoManager.update(items as TODO_ITEM[]);

      console.log(`> Todo:\n${output}`);

      return output;
    },
  }),
  skill_get: tool({
    description: "Load specialized knowledge by name",
    inputSchema: zodSchema(z.object({ name: z.string() })),
    execute: async ({ name }) => skillLoader.getContent(name),
  }),
};

export const runSubagent = async (prompt: string): Promise<string> => {
  const { text } = await generateText({
    model,
    system: SUBAGENT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    tools: TOOLS,
    stopWhen: isLoopFinished(),
  });

  return text;
};

export const PARENT_TOOLS = {
  ...TOOLS,
  task: tool({
    description: "Span a subagent with a fresh context, it shares the file system, but not the conversation history.",
    inputSchema: zodSchema(z.object({ task: z.string() })),
    execute: async ({ task }) => {
      clearLine();
      console.log(`Spawning subagent Ellie with task: ${task}`);

      return await runSubagent(task);
    },
  }),
};
