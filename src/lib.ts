import type { Html } from "mdast";
import type { Literal, Node } from "unist";
import { visit } from "unist-util-visit";

const isTextNode = (node: Node): node is Literal & { value: string } => {
  return node.type === "text" && "value" in node;
};

const directiveStartRegex = /(?<directive>:+)(?<type>\S+)(\s+(?<option>.+))?/;
const directiveEndRegex = /(?<directive>:+)\s*$/;

const matchDirectiveStart = (line: string) => {
  const start = line.trim().match(directiveStartRegex);
  if (start?.groups) {
    if (!start.groups.directive || !start.groups.type) {
      return null;
    }
    if (start.groups.directive.length < 3) {
      return null;
    }
    return {
      directive: start.groups.directive,
      type: start.groups.type,
      option: start.groups.option || null,
    };
  }
};

const matchDirectiveEnd = (line: string) => {
  const end = line.trim().match(directiveEndRegex);
  if (end?.groups) {
    if (!end.groups.directive) {
      return null;
    }
    if (end.groups.directive.length < 3) {
      return null;
    }
    return { directive: end.groups.directive };
  }
};

const last = <T>(arr: T[]): T | null => {
  return arr[arr.length - 1] ?? null;
};

export function remarkZennDirective() {
  return (tree: Node) => {
    const stack: { level: number; type: string }[] = [];

    visit(tree, ["text"], (node) => {
      if (isTextNode(node)) {
        const lines = node.value.split("\n");

        let rewriteHtml = "";
        for (const line of lines) {
          const start = matchDirectiveStart(line);
          const end = matchDirectiveEnd(line);
          if (end) {
            const stackItem = last(stack);
            if (stackItem && stackItem.level === end.directive.length) {
              if (stackItem.type === "message") {
                rewriteHtml += `</div>\n`;
              } else if (stackItem.type === "details") {
                rewriteHtml += `</details>\n`;
              } else {
                throw new Error(
                  `Mismatched directive end for type: ${stackItem.type}`,
                );
              }
              stack.pop();
            }
          } else if (start) {
            if ((last(stack)?.level ?? Infinity) < start.directive.length) {
              continue;
            }
            stack.push({ level: start.directive.length, type: start.type });

            if (start.type === "message") {
              const messageLevel = start.option === "alert"
                ? "alert"
                : "warning";
              rewriteHtml += `<div class="message-${messageLevel}">\n`;
            } else if (start.type === "details") {
              rewriteHtml += `<details><summary>${
                start.option || ""
              }</summary>\n`;
            } else {
              console.warn(`Unknown directive type: ${start.type}`);
            }
          } else if (rewriteHtml) {
            rewriteHtml += `${line}\n`;
          }
        }

        if (rewriteHtml) {
          const htmlNode = node as unknown as Html;
          htmlNode.type = "html";
          htmlNode.value = rewriteHtml.trim();
          delete (htmlNode as any).children;
        }
      }
    });
  };
}
