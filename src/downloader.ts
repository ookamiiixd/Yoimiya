import { createWriteStream, readdirSync } from 'fs'
import fetch from 'node-fetch'
import pLimit from 'p-limit'
import { pipeline } from 'stream'
import { promisify } from 'util'

import { banners, cache, characters, weapons } from './data'

const endpoint =
  'https://raw.githubusercontent.com/AguzzTN54/Genshin-Impact-Wish-Simulator/master/static/assets/images/'

async function download(path: string, file: string, saveAs?: string) {
  const isBanner = path.startsWith('banner')
  const streamPipeline = promisify(pipeline)

  const response = await fetch(`${endpoint}${path}${isBanner ? file.split('/')[1] : file}`)

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

    jobs.push(
      limit(() =>
        download(
          `characters/splash-art/${char.rarity === 'FIVE_STAR' ? '5star' : '4star'}/`,
          `${char.typoName ?? char.name}.webp`,
          `${char.name}.webp`
        )
      )
    )
  }

  // Download weapon images
  for (const weap of weapons.values()) {
    if (files.includes(`${weap.name}.webp`)) {
      continue
    }

    jobs.push(
      limit(() =>
        download(
          `weapons/${weap.type}/${
            weap.rarity === 'FIVE_STAR' ? '5star' : weap.rarity === 'FOUR_STAR' ? '4star' : '3star'
          }/`,
          `${weap.name}.webp`
        )
      )
    )
  }

  // Download banner images
  for (const banner of banners.values()) {
    jobs.push(
      limit(() =>
        download(
          `banner/${banner.standard ? 'standard' : banner.patch.toFixed(1)}/`,
          `${banner.patch.toFixed(1)}/${banner.typoName ?? banner.name}.webp`,
          `${banner.patch.toFixed(1)}/${banner.name}.webp`
        )
      )
    )
  }

  await Promise.all(jobs)
  console.timeEnd('downloads')
}

;(() => run())()
