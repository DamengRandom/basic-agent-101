import { createOpenAI } from "@ai-sdk/openai";
import { parseEnv } from "node:util";

// Bun only auto-loads .env from the cwd, so load the one next to this file when run as `dameng` elsewhere. Real env vars still win.
// Lives here, not in index.ts: imports run first, so the provider below must see the env when this module loads.
Object.assign(process.env, { ...parseEnv(await Bun.file(`${import.meta.dir}/.env`).text()), ...process.env });

const provider = createOpenAI({
  baseURL: process.env.DEFAULT_BASE_URL,
  apiKey: process.env.DEFAULT_API_KEY,
});

export const model = provider.chat(process.env.DEFAULT_MODEL!);

export const WORKING_DIR = process.cwd();
// const DEFAULT_SYSTEM_PROMPT = `You are Dameng, a helpful coding agent at ${WORKING_DIR}.`;
export const DEFAULT_SYSTEM_PROMPT = `You are Dameng, a helpful coding agent at ${WORKING_DIR}. Use tools to resolve tasks. Act, don't explain.`;

export const SUBAGENT_SYSTEM_PROMPT = `You are a helpful coding sub-agent Ellie at ${WORKING_DIR}, complete your given tasks, and summarize the findings.`;

export const TODO_SYSTEM_PROMPT = `You are a helpful coding agent Cetra at ${WORKING_DIR}.
Use the todo tool to plan multi-step tasks. Mark in_progress before starting, completed when done.
Use the task tool to delegate exploration or subtasks.`;
