import { expect, describe, jest, test } from '@jest/globals'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  parse,
  parseDefinitions,
  parseExamples,
  parseExamplesSection,
  groupEntries,
} from '../src/index.mjs'

const testCases = [
  'jlptn5-grammar-amari',
  'jlptn5-grammar-atode',
  'jlptn5-grammar-dake',
  'jlptn5-grammar-de',
  'jlptn5-grammar-deshou',
  'jlptn5-grammar-donna',
  'jlptn5-grammar-douyatte',
  'jlptn5-grammar-gahoshii',
  'jlptn5-grammar-gaichiban',
  'jlptn5-grammar-kara',
  'jlptn5-grammar-kata',
  'jlptn5-grammar-maeni',
  'jlptn5-grammar-masenka',
  'jlptn5-grammar-masho',
  'jlptn5-grammar-mashouka',
  'jlptn5-grammar-mou',
  'jlptn5-grammar-nagara',
  'jlptn5-grammar-naide',
  'jlptn5-grammar-naidekudasai',
  'jlptn5-grammar-nakerebanaranai',
  'jlptn5-grammar-nakutemoii',
  'jlptn5-grammar-naru',
  'jlptn5-grammar-niikimasu',
  'jlptn5-grammar-tai',
  'jlptn5-grammar-taritari',
  'jlptn5-grammar-tekara',
  'jlptn5-grammar-temoiidesuka',
  'jlptn5-grammar-tewaikemasen',
  'jlptn5-grammar-toki',
  'jlptn5-grammar-toomou',
  'jlptn5-grammar-toteomo',
  'jlptn5-grammar-wadoudesuka',
  'jlptn5-grammar-wokudasai',
  'jlptn5-grammar-yori',
  'jlptn5-grammar-zehi',
]

test.concurrent.each(testCases)('parse %s', async (testCase) => {
  const filename = `${testCase}.html`
  const content = await fs.readFile(
    path.resolve('src/pages', filename),
    'utf-8'
  )

  const result = parse(content, filename)
  expect(result).toMatchSnapshot()
})
