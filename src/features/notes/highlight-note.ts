import "server-only"

import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import go from "@shikijs/langs/go"
import htmlLang from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import jsx from "@shikijs/langs/jsx"
import markdownLang from "@shikijs/langs/markdown"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import rehypeShikiFromHighlighter from "@shikijs/rehype/core"
import githubDark from "@shikijs/themes/github-dark"
import githubLight from "@shikijs/themes/github-light"
import type { Element, Root } from "hast"
import rehypeParse from "rehype-parse"
import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { createHighlighterCore, type HighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import { unified } from "unified"

const highlightOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
} as const

function shikiPlugin(highlighter: HighlighterCore) {
  return rehypeShikiFromHighlighter(highlighter as unknown as Parameters<typeof rehypeShikiFromHighlighter>[0], {
    ...highlightOptions,
    transformers: [
      {
        name: "note-language-label",
        pre(node) {
          const lang = this.options.lang
          if (typeof lang === "string" && lang) {
            node.properties.dataLanguage = lang
          }
        },
      },
    ],
  })
}

const languageClassPattern = /class="language-[a-zA-Z0-9_+-]+"/

let highlighterPromise: Promise<HighlighterCore> | undefined

function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [typescript, tsx, javascript, jsx, go, bash, json, css, htmlLang, markdownLang],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighterPromise
}

export async function highlightNoteMarkdown(markdown: string) {
  if (!markdown) {
    return ""
  }

  try {
    return await renderMarkdown(markdown, true)
  } catch (error) {
    console.error("Failed to highlight note markdown", error)
    return renderMarkdown(markdown, false)
  }
}

export async function highlightNoteHtml(html: string) {
  if (!html || !html.includes("<pre")) {
    return html
  }

  try {
    const processor = unified().use(rehypeParse, { fragment: true })
    if (languageClassPattern.test(html)) {
      const highlighter = await getHighlighter()
      processor.use(() => shikiPlugin(highlighter))
    }
    const file = await processor.use(rehypeCodeCards).use(rehypeStringify).process(html)
    return String(file)
  } catch (error) {
    console.error("Failed to highlight note HTML", error)
    return html
  }
}

async function renderMarkdown(markdown: string, highlight: boolean) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeExternalLinks)
  if (highlight) {
    const highlighter = await getHighlighter()
    processor.use(() => shikiPlugin(highlighter))
  }

  const file = await processor.use(rehypeCodeCards).use(rehypeStringify).process(markdown)
  return String(file)
}

function rehypeCodeCards() {
  return (tree: Root) => {
    wrapCodeBlocks(tree)
  }
}

function wrapCodeBlocks(node: Root | Element) {
  for (let index = node.children.length - 1; index >= 0; index -= 1) {
    const child = node.children[index]
    if (isParent(child)) {
      wrapCodeBlocks(child)
    }
    if (child.type !== "element" || child.tagName !== "pre") {
      continue
    }

    const language = codeLanguage(child)
    const card: Element = {
      type: "element",
      tagName: "div",
      properties: {
        className: ["note-code"],
        ...(language ? { dataLanguage: language } : {}),
      },
      children: [child],
    }
    node.children.splice(index, 1, card)
  }
}

function isParent(node: { type: string }): node is Root | Element {
  return node.type === "root" || node.type === "element"
}

function codeLanguage(pre: Element) {
  const marked = pre.properties.dataLanguage
  if (typeof marked === "string" && marked) {
    return marked
  }

  const code = pre.children.find((child) => child.type === "element" && child.tagName === "code")
  if (!code || code.type !== "element") {
    return ""
  }

  const className = code.properties.className
  const classes = Array.isArray(className) ? className.map(String) : typeof className === "string" ? [className] : []
  const languageClass = classes.find((name) => name.startsWith("language-"))
  return languageClass ? languageClass.slice("language-".length) : ""
}

function rehypeExternalLinks() {
  return (tree: Root) => {
    walk(tree, (node) => {
      if (node.tagName !== "a") {
        return
      }
      const href = node.properties.href
      if (typeof href !== "string" || !/^https?:\/\//.test(href)) {
        return
      }
      node.properties.target = "_blank"
      node.properties.rel = ["noopener", "noreferrer"]
    })
  }
}

function walk(node: Root | Element, visit: (element: Element) => void) {
  if (node.type === "element") {
    visit(node)
  }

  for (const child of node.children) {
    if (child.type === "element") {
      walk(child, visit)
    }
  }
}
