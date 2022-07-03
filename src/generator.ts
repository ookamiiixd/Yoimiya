import { readdirSync } from 'fs'
import pLimit from 'p-limit'
import sharp from 'sharp'

import { cache, characters, weapons } from './data'
import Image from './image/image'

const limit = pLimit(5)
const jobs: Promise<void>[] = []

async function run() {
  console.time('generate')
  cache()

  const charFiles = readdirSync('./static/images/characters/')
  const weapFiles = readdirSync('./static/images/weapons/')

  for (const char of characters.values()) {
    if (charFiles.includes(`${char.name}.webp`)) {
      continue
    }

    jobs.push(
      limit(async () => {
        const image = new Image(sharp(`./static/images/temp/${char.name}.webp`), char, false)

        await image.resize().edit()
        await image.save()
      })
    )
  }

  for (const weap of weapons.values()) {
    if (weapFiles.includes(`${weap.name}.webp`)) {
      continue
    }

    jobs.push(
      limit(async () => {
        const image = new Image(sharp(`./static/images/temp/${weap.name}.webp`), weap, true)

        await image.resize().edit()
        await image.save()
      })
    )
  }

  await Promise.all(jobs)
  console.timeEnd('generate')
}

;(async () => run())()
