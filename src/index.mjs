// @ts-check
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import _ from 'lodash'
import * as cheerio from 'cheerio'

const __filename = fileURLToPath(import.meta.url)

if (path.resolve(process.argv[1]) === path.resolve(__filename)) {
  void main().catch(console.error)
}

async function main() {
  const dir = await fs.readdir(path.resolve('src/pages'))

  const data = await Promise.all(
    dir.map(async (file) => {
      const content = await fs.readFile(
        path.resolve('src/pages', file),
        'utf-8',
      )

      return parse(content, file)
    }),
  )

  console.log(data.length)

  await fs.writeFile(
    path.resolve('dist/data.json'),
    JSON.stringify(data, null, 2),
    'utf-8',
  )
}

/**
 * @param {string} content
 * @param {string} fileName
 * @returns {object}
 */
export function parse(content, fileName) {
  const $ = cheerio.load(content)
  const { link, ...definitions } = parseDefinitions(content, $)

  $('.content .sc_frame_text').parent().remove()
  $('.content .toc_container').remove()
  $('.content .toc_white').remove()
  $('.content h2:not(:first-of-type)')
    .nextAll()
    .each((_i, elem) => $(elem).remove() && void 0)
  const raw = $('.content')
    .text()
    .replace(
      /\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\({}\);/gim,
      '',
    )
  const examplesRaw =
    raw.slice(
      raw.indexOf('例文'),
      // ads section
      raw.indexOf(
        // ads section. typically goes after the examples
        'この文型が登場する教科書みんなの日本語',
      ),
    ) ?? ''
  const examples = parseExamples(examplesRaw, {
    file: fileName,
    link,
  })

  return {
    definitions,
    examples,
    link,
  }
}

/**
 * @param {string} content
 * @param {cheerio.CheerioAPI} $
 * @returns {({ meaning_jp: string[], meaning_en: string[], conjugation: string[], jlpt: string[], link: string } & Record<string, string[]>)}
 */
export function parseDefinitions(content, $) {
  const dom = new JSDOM(content)
  const document = dom.window.document
  // @ts-ignore
  const name = document
    .querySelector('.content h2')
    .textContent?.replace('文型：', '')
  // @ts-ignore
  const link = document.querySelector('[rel=canonical]')?.href
  const defElem = document.querySelector('.sc_frame_text')

  if (defElem === null) {
    console.log('No definition found for', name)
    throw new Error('No definition found')
  }

  const defEntries = Array.from(defElem.childNodes)
    .filter((elem) => elem.nodeName !== 'BR')
    .map((elem) => {
      const childNodes = Array.prototype.slice.apply(elem.childNodes)
      const targetChildNodes = _.flattenDeep(
        childNodes.map((elem) =>
          elem.childNodes.length > 0 ? Array.from(elem.childNodes) : elem,
        ),
      )
      const [kind, ...details] = targetChildNodes
        .filter((elem) => ['#text', 'STRONG', 'SPAN'].includes(elem.nodeName))
        .map((elem) => elem.textContent?.trim())
        .filter(Boolean)

      switch (true) {
        case kind?.includes('※'):
          return ['notes', [kind?.replace('※', '')]]
        case kind?.includes('意味'):
          return ['meaning_jp', details]
        case kind?.includes('英訳'):
          return ['meaning_en', details]
        case kind?.includes('接続'):
          return ['conjugation', details]
        case kind?.includes('JLPT レベル'):
          return ['jlpt', details]
        default:
          return [kind, details]
      }
    })

  const definitions = {
    ...Object.fromEntries(defEntries),
    name,
    link,
  }
  /** @type {typeof definitions} **/
  const _definitions = _.fromPairs(_.sortBy(_.toPairs(definitions), 0))
  return _definitions
}

/**
 * @description
 * #### Tokens
 * - `\d+\.\s*`: Example index like in an ordered list. e.g. "1.", "2.", "3."
 * - named group `sectionV1`:
 *   - `[NVA]`: Part of speech. Noun, Verb, Adjective.
 *   - (`[\u3000-\u303f]` ~ `[\u3400-\u4dbf]`)`{1,10}す`: Up to 10 jp characters followed by "す" that indicates the section heading, e.g. "Vにいきます", "Nでした"
 * - named group `sectionV2`:
 *   - (`[\u3000-\u303f]` ~ `[\u3400-\u4dbf]`)`: Any amount of jp characters followed by:
 *   - `文`: The kanji for "sentence".
 * 
 * #### Additional reference:
 * 
 * - `[\u3000-\u303f]`: Japanese style punctuation. e.g. "、", "。", "「", "」"
 * - `[\u3040-\u309f]`: Hiragana. e.g. "あ", "い", "う", "え", "お"
 * - `[\u30a0-\u30ff]`: Katakana. e.g. "ア", "イ", "ウ", "エ", "オ"
 * - `[\uff00-\uffef]`: Roman characters + half-width katakana. e.g. "A", "B"
 * - `[\u4e00-\u9faf]|[\u3400-\u4dbf]`: Kanji. e.g. "一", "二", "三", "四", "五"
 * [Source](https://stackoverflow.com/a/58929040/6036154)
 */
const ExampleSectionsRegexp =
  /(?:\d+\.\s*(?<sectionV1>[NVA](?:[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uffef]|[\u4e00-\u9faf]|[\u3400-\u4dbf]){1,10}す))|(\d+\.\s*(?<sectionV2>(?:[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uffef]|[\u4e00-\u9faf]|[\u3400-\u4dbf])+文))/gm

/**
 * @param {string} examplesRaw
 * @returns {{section?: null|string, entries: Array<{jp?: string, en?: string}>}[]}
 */
export function parseExamples(examplesRaw, meta) {
  const examplesRawSrc = examplesRaw.replace('例文', '')

  const hasSections = ExampleSectionsRegexp.test(examplesRawSrc)
  // Format and remap example sentences
  if (hasSections) {
    const parsedSections = examplesRawSrc
      .replaceAll(ExampleSectionsRegexp, '\n$&\n')
      .split('\n')
      .filter(Boolean)
      .map(parseExamplesSection)
    return groupEntries(parsedSections)
  }

  return [
    {
      section: null,
      entries: parseExamplesSection(examplesRawSrc),
    },
  ]
}

/**
 * @param {string} entry
 * @returns
 */
export function parseExamplesSection(entry) {
  return entry
    // Split sentences into separate lines for easier parsing
    .replaceAll(
      RegExp(`([\\w\\d]\\s?[.。!！?？]+)((?:[A-Z][:：：](?:[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uffef]|[\u4e00-\u9faf]|[\u3400-\u4dbf]))|(?:[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uffef]|[\u4e00-\u9faf]|[\u3400-\u4dbf]))`, 'g'),
      '$1\n\n$2',
    )
    .split('\n')
    .filter(Boolean)
    .map((sentenceRaw) => {
      const [sectionMatch] = [...sentenceRaw.matchAll(ExampleSectionsRegexp)]
      const section =
        (sectionMatch?.groups?.sectionV1 || sectionMatch?.groups?.sectionV2) ??
        null

      if (section) {
        return {
          en: '',
          jp: section,
          raw: sentenceRaw,
          section,
        }
      }

      const dialogueSyntaxMatch = sentenceRaw.match(/([A-Z][：:])/gi)
      const isDialogue = dialogueSyntaxMatch?.length ?? false
      const sentence = isDialogue
        ? sentenceRaw.replace(
            /([。？！])\s*([A-Z][：:]\s*)([\w.?!]+)/,
            '$1\n$2$3',
          )
        : sentenceRaw.replace(/([。？！])(\s*\w)/, '$1\n$2')
      const [jp, en] = sentence
        .split('\n')
        .filter(Boolean)
        .map((sentence) =>
          sentence
            .replace(/^。/, '')
            .replace(/[：]/gi, ': ')
            .replace(/[A-Z][:：]/gi, '\n$&')
            .replace(/^\n/, '')
            .trim(),
        )
      return {
        en,
        jp,
        raw: sentenceRaw,
        section: false,
      }
    })
}

export function groupEntries(data) {
  const result = []
  let currentSection = null
  let currentEntries = []

  for (const entry of data) {
    if (entry[0].section) {
      if (currentSection) {
        result.push({
          section: currentSection,
          entries: _.flattenDeep(currentEntries),
        })
        currentEntries = []
      }
      currentSection = entry[0].section
    } else {
      currentEntries.push(entry)
    }
  }

  if (currentSection) {
    result.push({
      section: currentSection,
      entries: _.flattenDeep(currentEntries),
    })
  }

  return result
}
