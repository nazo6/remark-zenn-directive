import type { Parent, Root, RootContent, Text } from "mdast";
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
  type DirectiveStart = {
    node: Text;
    line: number;
    type: string;
    option: string | null;
    parent: Parent;
  };
  type DirectiveEnd = { node: Text; line: number; parent: Parent };
  type Directive = { start: DirectiveStart; end: DirectiveEnd };

  const messageClassPrefix = option?.messageClassPrefix ?? "message";

  return (tree) => {
    const stack: {
      level: number;
      start: DirectiveStart;
    }[] = [];

    const directives: Directive[] = [];

    visit(tree, "text", (node, index, parent) => {
      if (!parent || typeof index !== "number") {
        return;
      }

      const lines = node.value.split("\n");

      let i = -1;
      for (const line of lines) {
        i++;
        const start = matchDirectiveStart(line);
        const end = matchDirectiveEnd(line);
        if (end) {
          const stackItem = last(stack);
          if (stackItem && stackItem.level === end.directive.length) {
            const item = stack.pop();
            directives.push({
              start: item!.start,
              end: { node, line: i, parent },
            });
          }
        } else if (start) {
          if ((last(stack)?.level ?? Infinity) < start.directive.length) {
            continue;
          }
          stack.push({
            level: start.directive.length,
            start: { node, line: i, ...start, parent },
          });
        }
      }
    });

    const getHtmlForDirective = (d: Directive): [string, string] | null => {
      if (d.start.type === "message") {
        let messageLevel: string;
        if (d.start.option === null) {
          messageLevel = "warning";
        } else if (d.start.option === "alert") {
          messageLevel = "alert";
        } else {
          throw new Error("Invalid message directive option");
        }

        return [
          `<div class="${messageClassPrefix}-${messageLevel}">\n\n`,
          `\n\n</div>\n\n`,
        ];
      } else if (d.start.type === "details") {
        return [
          `<details><summary>${d.start.option ?? ""}</summary>\n\n`,
          `\n\n</details>\n\n`,
        ];
      } else {
        return null;
      }
    };

    for (const directive of directives) {
      const html = getHtmlForDirective(directive);
      if (!html) continue;
      const [startHtml, endHtml] = html;

      if (directive.start.node === directive.end.node) {
        const text = directive.start.node.value.split("\n").slice(
          directive.start.line + 1,
          directive.end.line,
        ).join("\n");
        const index = directive.start.parent.children.indexOf(
          directive.start.node,
        );
        directive.start.parent.children.splice(
          index,
          1,
          { type: "html", value: startHtml },
          { type: "text", value: text },
          { type: "html", value: endHtml },
        );
      } else {
        {
          const { node, parent, line } = directive.start;
          const remained = node.value.split("\n").slice(line + 1).join("\n");
          const newNodes: RootContent[] = [
            { type: "html", value: startHtml },
            ...(remained ? [{ type: "text", value: remained }] as const : []),
          ];
          parent.children.splice(
            parent.children.indexOf(node),
            1,
            ...newNodes,
          );
        }

        {
          const { node, parent, line } = directive.end;
          const remained = node.value.split("\n").slice(0, line).join("\n");
          const newNodes: RootContent[] = [
            ...(remained ? [{ type: "text", value: remained }] as const : []),
            { type: "html", value: endHtml },
          ];
          parent.children.splice(
            parent.children.indexOf(node),
            1,
            ...newNodes,
          );
        }
      }
    }
  };
};
