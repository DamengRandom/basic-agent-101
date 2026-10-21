type TODO_STATUS = "pending" | "in_progress" | "completed";
export type TODO_ITEM = {
  id: string;
  text: string;
  status: TODO_STATUS;
};

const MARKS: Record<TODO_STATUS, string> = {
  pending: "[]",
  in_progress: "[>]",
  completed: "[x]",
};

export class TodoManager {
  private items: TODO_ITEM[] = [];

  update(items: TODO_ITEM[]) {
    if (items.length > 20) {
      throw new Error("Too many items, only max 20 items.");
    }

    if (items.filter((item) => item.status === "in_progress").length > 1) {
      throw new Error("Only one item can be in progress.");
    }

    this.items = items;

    return this.render();
  }

  render() {
    if (!this.items.length) {
      return "No items to render.";
    }

    const list = this.items.map((item) => `${MARKS[item.status]} ${item.id} ${item.text}`).join("\n");
    const done = this.items.filter((item) => item.status === "completed").length;

    return `${list}\n\n(${done}/${this.items.length}) completed`;
  }
}
