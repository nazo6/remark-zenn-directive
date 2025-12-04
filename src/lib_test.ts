import { assertEquals } from "@std/assert";

import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { remarkZennDirective } from "./lib.ts";

const messageWarning = [
  `
:::message
Warning
:::

:::message

Warning

:::
`.trim(),
  `
<div class="message-warning">
Warning
</div>

<div class="message-warning">

Warning

</div>
  `.trim(),
];

const messageAlert = [
  `
:::message alert
Alert
:::

:::message alert
[link](https://example.com)
:::

:::message

Alert

:::
`.trim(),
  `
<div class="message-alert">
Alert
</div>

<div class="message-alert">[link](https://example.com)</div>

<div class="message-warning">

Alert

</div>
  `.trim(),
] as const;

const details = [
  `
:::details title
content
:::

:::details title

# Long

content

[link](https://example.com)

:::
`.trim(),
  `
<details><summary>title</summary>
content
</details>

<details><summary>title</summary>

# Long

content

[link](https://example.com)

</details>
`.trim(),
] as const;

const nested = [
  `
:::::details title

::::details

hello

::::

::::message alert

:::message

message

:::

:::details title2

# Hello

:::

::::

# World

:::::
`.trim(),
  `
<details><summary>title</summary>

<details><summary></summary>

hello

</details>

<div class="message-alert">

<div class="message-warning">

message

</div>

<details><summary>title2</summary>

# Hello

</details>

</div>

# World

</details>
`.trim(),
] as const;

async function common(input: string, output: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkZennDirective)
    .use(remarkStringify)
    .process(input);

  assertEquals(String(file).trim(), output);
}

Deno.test("message (warning)", async () => {
  await common(messageWarning[0], messageWarning[1]);
});

Deno.test("message (alert)", async () => {
  await common(messageAlert[0], messageAlert[1]);
});

Deno.test("details", async () => {
  await common(details[0], details[1]);
});

Deno.test("nested", async () => {
  await common(nested[0], nested[1]);
});
