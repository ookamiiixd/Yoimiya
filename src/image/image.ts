import { readFileSync } from 'fs'
import joinImages from 'join-images'
import type { Sharp } from 'sharp'
import sharp from 'sharp'
import invariant from 'tiny-invariant'

import type { Character, Weapon } from './../data'
import { Stars } from './../data'
import { generateGlow } from './glow'

class Image {
  constructor(
    private image: Sharp,
    private readonly data: Character | Weapon,
    private readonly isWeapon = false
  ) {}

  /** Combine images and add background */
  public static async combine(images: string[]) {
    const background = sharp('./static/images/etc/splash-background.webp')
    const combined = await joinImages(images, {
      direction: 'horizontal',
      offset: 3,
      color: { alpha: 0, b: 0, r: 0, g: 0 },
    })

    return background
      .resize(1280, 720)
      .composite([{ input: await combined.toFormat('webp').toBuffer() }])
      .sharpen()
      .toBuffer()
  }

  /** Save image */
  public async save() {
    return this.image
      .sharpen()
      .toFile(`./static/images/${this.isWeapon ? 'weapons' : 'characters'}/${this.data.name}.webp`)
  }

  /** Resize and crop image */
  public resize() {
    const width = this.isWeapon ? 100 : 1000
    const height = this.isWeapon ? 500 : 1000

    this.image.resize(width, height)

    if (!this.isWeapon) {
      invariant('offset' in this.data, 'Missing offset from data')

      this.image.extract({
        top: this.data.offset.top,
        left: this.data.offset.left,
        width: 100,
        height: 500,
      })
    }

    return this
  }

  /** Edit the image */
  public async edit() {
    const frame = sharp('./static/images/etc/container.svg')
    const icon = Buffer.from(this.generateIconWithStars())

    // Normalize catalyst size
    if (this.isWeapon && this.data.type === 'catalyst') {
      this.image.resize(100, 175)
    }

    this.image = frame.resize(100, 500).composite([
      // Resized and cropped image
      {
        input: await this.image
          .modulate({
            brightness: 0.85,
          })
          .toBuffer(),
        blend: 'atop',
      },

      // Bottom part overlay for better readibility
      {
        input: Buffer.from(
          `<svg width="100" height="175" opacity="0.5">
    <rect width="100%" height="100%" />
  </svg>`
        ),
        blend: 'atop',
        top: 325,
        left: 0,
      },

      // Icon and stars
      { input: icon, blend: 'over', top: 325, left: 0 },
    ])

    await this.injectGlow()
  }

  /** Inject glowy border  */
  private async injectGlow() {
    const GLOW_COLOR =
      this.data.rarity === 'FIVE_STAR'
        ? 'GOLD'
        : this.data.rarity === 'FOUR_STAR'
        ? 'PURPLE'
        : 'BLUE'

    this.image = sharp({
      create: {
        width: 115,
        height: 515,
        channels: 4,
        background: { alpha: 0, r: 0, g: 0, b: 0 },
      },
    }).composite([
      { input: Buffer.from(generateGlow(GLOW_COLOR)) },
      { input: await this.image.toBuffer() },
    ])
  }

  /** Generate bottom part svg */
  private generateIconWithStars() {
    const star = readFileSync(`./static/images/etc/star.svg`, {
      encoding: 'utf8',
    })

    let icon = readFileSync(`./static/images/etc/icon-${this.data.type}.svg`, {
      encoding: 'utf8',
    })

    // Strip comments and rewrite width
    icon = icon.replace(/<(\?|!DOCTYPE|!--).*>/gm, '').replace(/[\d.]+mm/gm, '100%')

    const stars = Stars[this.data.rarity]

    return `<svg width="100" height="125">
    <svg width="65" transform="translate(17.5, -15)">
      ${icon}
    </svg>
    ${star}
    <g transform="translate(${27.5 - (stars - 3) * 7.5}, 50)">
      <use href="#star" width="15" />
      <use href="#star" width="15" x="15" />
      <use href="#star" width="15" x="30" />
      ${stars > 3 && '<use href="#star" width="15" x="45" />'}
      ${stars > 4 && '<use href="#star" width="15" x="60"  />'}
    </g>
  </svg>`
  }
}

export default Image
