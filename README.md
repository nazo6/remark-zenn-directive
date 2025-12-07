# remark-zenn-directive

[Zennの独自記法](https://zenn.dev/zenn/articles/markdown-guide#zenn-%E7%8B%AC%E8%87%AA%E3%81%AE%E8%A8%98%E6%B3%95)であるディレクティブをHTMLに変換するためのremarkプラグイン。

## Example

```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkZennDirective from "@nazo6/remark-zenn-directive";

const file = await unified()
  .use(remarkParse)
  .use(remarkZennDirective)
  .use(remarkStringify)
  .process(input);

console.log(String(file));
```

以上のようなコードで、以下のような変換が行われます。

```markdown
::::details title

:::message

Warning

:::

:::message alert

Alert

:::

::::
```

↓

```markdown
<details><summary>title</summary>

<div class="message-warning">

Warning

</div>

<div class="message-alert">

Alert

</div>

</details>
```

## 既知の制限

以下の項目はZennではサポートされていますが、このプラグインではサポートされていません。

### インラインのディレクティブ

以下のように、`:::`の間に行間を開けないことは推奨されません。

```
:::message
[link](https://example.com)
:::
```

これは、このmarkdownが

```
<div class="message-warning">[link](https://example.com)</div>
```

と変換されるためです。テキストのみであればこれは動作しますが、例のようにHTML内にmarkdownが混在すると、後続の処理で正しく解釈されない可能性があるため、避けてください。

代わりに、以下のように行間を開けてください。

```
:::message

[link](https://example.com)

:::
```
