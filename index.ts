#!/usr/bin/env bun
import { generateText, isLoopFinished, type ModelMessage } from "ai";
import readline from "readline";
import { PARENT_TOOLS, WITH_SKILLS_SYSTEM_PROMPT } from "./tools";
import { model } from "./model";
import { startSpin, stopSpin } from "./spinner";

// CLI interface definitions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const history: ModelMessage[] = [];
const prompt = (): void => {
  rl.question("Your type: ", async (query) => {
    // Typing exit/quit quits right away, without a model call.
    if (["exit", "quit"].includes(query.trim().toLowerCase())) {
      rl.close();

      return;
    }

    history.push({ role: "user", content: query });

    const reply = await agentLoop(history);

    history.push({ role: "assistant", content: reply });

    if (reply) {
      console.log(reply);
    }

    console.log("-----------------");

    prompt();
  });
};

// Agent loop (example)
const agentLoop = async (messages: ModelMessage[]): Promise<string> => {
  let stepsSinceTodo = 0;

  startSpin();

  try {
    const { text } = await generateText({
      model,
      system: WITH_SKILLS_SYSTEM_PROMPT,
      messages,
      tools: PARENT_TOOLS,
      stopWhen: isLoopFinished(),
      onStepFinish: ({ toolCalls }) => {
        const usedTodo = toolCalls.some((tc) => tc.toolName === "todo") ?? false;

        stepsSinceTodo = usedTodo ? 0 : stepsSinceTodo + 1;

        if (stepsSinceTodo >= 3) {
          messages.push({ role: "user", content: "<reminder>Update the todos.</reminder>" });
        }
      },
    });
    // const { text } = await generateText({ model, system: DEFAULT_SYSTEM_PROMPT, messages, tools: PARENT_TOOLS, stopWhen: isLoopFinished() });
    return text;
  } catch (error) {
    console.error(error);
    throw new Error("Agent loop failed.");
  } finally {
    stopSpin();
  }
};

// Start the agent loop
prompt();
