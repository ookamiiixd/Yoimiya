import { createWriteStream, readdirSync } from 'fs'
import fetch from 'node-fetch'
import pLimit from 'p-limit'
import { pipeline } from 'stream'
import { promisify } from 'util'

import { banners, cache, characters, weapons } from './data'

const endpoint = 'https://raw.githubusercontent.com/ookamiiixd/Yoimiya/images/'

async function download(path: string, file: string, saveAs?: string) {
  const isBanner = path.startsWith('banners')
  const streamPipeline = promisify(pipeline)

  const response = await fetch(`${endpoint}${path}${file}`)

  await streamPipeline(
    response.body,
    createWriteStream(`./static/images/${isBanner ? 'banners' : 'temp'}/${saveAs ?? file}`)
  )
}

const limit = pLimit(5)
const jobs: Promise<void>[] = []

async function run() {
  console.time('downloads')
  cache()

  const files = readdirSync('./static/images/temp/')

  // Download character images
  for (const char of characters.values()) {
    if (files.includes(`${char.name}.webp`)) {
      continue
    }

    jobs.push(limit(() => download(`characters/`, `${char.name}.webp`)))
  }

  // Download weapon images
  for (const weap of weapons.values()) {
    if (files.includes(`${weap.name}.webp`)) {
      continue
    }

    jobs.push(limit(() => download(`weapons/`, `${weap.name}.webp`)))
  }

  const bannerFiles = readdirSync('./static/images/banners/')

  // Download banner images
  for (const banner of banners.values()) {
    if (bannerFiles.includes(`${banner.name}.webp`)) {
      continue
    }

    jobs.push(limit(() => download(`banners/`, `${banner.name}.webp`)))
  }

  await Promise.all(jobs)
  console.timeEnd('downloads')
}

;(() => run())()
