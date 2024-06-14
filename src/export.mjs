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
        Examples: JSON.stringify(examples),
        'Grammar Notes': notes?.join('<br/>') ?? '',
        'JLPT level': jlpt?.join('<br/>') ?? '',
        Link: link,
      }),
    ),
  )

  await fs.writeFile(path.resolve(`dist/export-${Date.now() / 1000}.tsv`), tsvstr, 'utf-8')
}
