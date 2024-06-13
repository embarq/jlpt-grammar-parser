import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import _ from 'lodash'

const __filename = fileURLToPath(import.meta.url)

if (path.resolve(process.argv[1]) === path.resolve(__filename)) {
  void main().catch(console.error)
}

async function main() {
  const dir = await fs.readdir(path.resolve('src/pages'))
  const srcFile = await fs.readFile(
    path.resolve('dist/export-src.json'),
    'utf-8',
  )
  const fixFile = await fs.readFile(path.resolve('dist/data.json'), 'utf-8')
  const fixFileData = JSON.parse(fixFile)
  const data = JSON.parse(srcFile).map((entry) => {
    const fix = fixFileData.find(({ link }) => link === entry.link)

    if (fix.examples[0]?.section == null) {
      return entry
    }

    return {
      ...entry,
      examples: entry.examples.map((section, sectionIx) => {
        return {
          ...section,
          section: fix.examples[sectionIx].section,
        }
      }),
    }
  })

  await fs.writeFile(
    path.resolve('dist/export-v2.json'),
    JSON.stringify(data, null, 2),
    'utf-8',
  )
}
