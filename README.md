# remark-zenn-directive

[Zennの独自記法](https://zenn.dev/zenn/articles/markdown-guide#zenn-%E7%8B%AC%E8%87%AA%E3%81%AE%E8%A8%98%E6%B3%95)であるディレクティブをHTMLに変換するためのremarkプラグイン。

## Example

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
