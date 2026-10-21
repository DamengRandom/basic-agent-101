import * as fs from "fs";
import * as path from "path";
import { WORKING_DIR } from "./model";

interface ISKILL {
  meta: Record<string, string>;
  body: string;
}

const SKILLS_DIR = path.join(WORKING_DIR, "skills");

export class SkillLoader {
  private skills: Record<string, ISKILL> = {};

  constructor() {
    fs.mkdirSync(SKILLS_DIR, { recursive: true }); // create directory if doesn't exist

    for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillFile = path.join(SKILLS_DIR, entry.name, "SKILL.md");

      if (!fs.existsSync(skillFile)) {
        continue;
      }

      const skillContents = fs.readFileSync(skillFile, "utf-8");

      const { meta, body } = this.parseFormatter(skillContents);

      const skillName = meta["name"] || entry.name;

      this.skills[skillName] = { meta, body };
    }
  }

  parseFormatter(skillContent: string): ISKILL {
    const skillMatchRegex = skillContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!skillMatchRegex) {
      return { meta: {}, body: skillContent };
    }

    const [, rawMeta = "", rawBody = ""] = skillMatchRegex;

    const meta: Record<string, string> = {};

    for (const line of rawMeta?.split("\n")) {
      const [key, ...value] = line?.split(":");

      if (key && value.length) {
        meta[key.trim()] = value.join(":").trim();
      }
    }

    return { meta, body: rawBody.trim() };
  }

  getDescriptions() {
    const entries = Object.entries(this.skills);

    if (!entries.length) {
      return "No Skills Found ..";
    }

    return entries.map(([name, skill]) => `- ${name}: ${skill.meta["description"] || "-"}`).join("\n");
  }

  getContent(name: string): string {
    const skill = this.skills[name];

    if (!skill) {
      return `Skill ${name} not found ..`;
    }

    return `<skill name=${name}>\n${skill.body}\n</skill>`;
  }
}
