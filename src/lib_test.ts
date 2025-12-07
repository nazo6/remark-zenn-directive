import { assertEquals } from "@std/assert";

import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { remarkZennDirective } from "./lib.ts";

async function common(name: string) {
  const input = await Deno.readTextFile(
    `${import.meta.dirname}/testdata/${name}/input.md`,
  );
  const output = await Deno.readTextFile(
    `${import.meta.dirname}/testdata/${name}/output.md`,
  );

  const file = await unified()
    .use(remarkParse)
    .use(remarkZennDirective)
    .use(remarkStringify)
    .process(input.trim());

  assertEquals(String(file).trim(), output.trim());
}

Deno.test("message (warning)", async () => {
  await common("message-warning");
});

Deno.test("message (alert)", async () => {
  await common("message-alert");
});

Deno.test("details", async () => {
  await common("details");
});

Deno.test("nested", async () => {
  await common("nested");
});
