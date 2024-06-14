import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import _ from 'lodash'
import tsv from 'tsv'

const __filename = fileURLToPath(import.meta.url)

if (path.resolve(process.argv[1]) === path.resolve(__filename)) {
  void main().catch(console.error)
}

async function main() {
  const raw = await fs.readFile(path.resolve('dist/export-src.json'), 'utf-8')
  const data = JSON.parse(raw)
  // prettier-ignore
  const examplesTempl = _.template([
    `<% _.forEach(data, function(section, i) { %>`,
      `<details <%= i === 0 ? 'open' : '' %>>`,
        `<summary class="examples-section-title"><%= _.defaultTo(section.section, 'Examples') %></summary>`,
        `<% _.forEach(section.entries, function(entry) { %>`,
          `<dt class="example-jp"><%= entry.jp %></dt>`,
          `<dd class="example-en"><%= entry.en %></dd>`,
        `<% }); %>`,
      `</details>`,
    `<% }); %>`,
  ].join(''))
  const tsvstr = tsv.stringify(
    data.map(
      ({
        definitions: { notes, conjugation, jlpt, meaning_en, meaning_jp, name },
        examples,
        link,
      }) => ({
        Topic: name,
        Conjugation: conjugation?.join('<br/>') ?? '',
        'Meaning eng': meaning_en?.join('<br/>') ?? '',
        'Meaning jp': meaning_jp?.join('<br/>') ?? '',
        Examples: examplesTempl({ data: examples }),
        'Grammar Notes': notes?.join('<br/>') ?? '',
        'JLPT level': jlpt?.join('<br/>') ?? '',
        Link: link,
      }),
    ),
  )

  await fs.writeFile(path.resolve(`dist/export-${Date.now() / 1000}.tsv`), tsvstr, 'utf-8')
}
