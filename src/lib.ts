import type { Html, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

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

/**
 * Options for the remarkZennDirective plugin.
 */
export type Options = {
  messageClassPrefix?: string;
};

/**
 * Remark plugin to transform Zenn directives to HTML.
 *
 * @param option - Plugin options.
 */
export const remarkZennDirective: Plugin<[Options?], Root> = (option) => {
  const messageClassPrefix = option?.messageClassPrefix ?? "message";

  return (tree) => {
    const stack: { level: number; type: string }[] = [];

    visit(tree, "text", (node) => {
      const lines = node.value.split("\n");

      let rewriteHtml = "";
      let text = "";
      for (const line of lines) {
        const start = matchDirectiveStart(line);
        const end = matchDirectiveEnd(line);
        if (end) {
          const stackItem = last(stack);
          if (stackItem && stackItem.level === end.directive.length) {
            if (
              !(stackItem.type === "message" ||
                stackItem.type === "details")
            ) {
              throw new Error(
                `Mismatched directive end for type: ${stackItem.type}`,
              );
            }

            rewriteHtml += text;

            if (stackItem.type === "message") {
              rewriteHtml += `\n</div>\n`;
            } else if (stackItem.type === "details") {
              rewriteHtml += `\n</details>\n`;
            }
            stack.pop();
          }
        } else if (start) {
          if ((last(stack)?.level ?? Infinity) < start.directive.length) {
            continue;
          }
          stack.push({ level: start.directive.length, type: start.type });

          if (start.type === "message") {
            const messageLevel = start.option === "alert" ? "alert" : "warning";
            rewriteHtml +=
              `<div class="${messageClassPrefix}-${messageLevel}">\n\n`;
          } else if (start.type === "details") {
            rewriteHtml += `<details><summary>${
              start.option || ""
            }</summary>\n\n`;
          } else {
            console.warn(`Unknown directive type: ${start.type}`);
          }
        } else if (rewriteHtml) {
          rewriteHtml += `${line}\n`;
        } else {
          text += line + "\n";
        }
      }

      if (rewriteHtml) {
        const htmlNode = node as unknown as Html;
        htmlNode.type = "html";
        htmlNode.value = rewriteHtml.trim();
      }
    });
  };
};
