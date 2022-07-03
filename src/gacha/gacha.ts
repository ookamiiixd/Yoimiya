import Big from 'big.js'
import invariant from 'tiny-invariant'

import type { Banner, Character, Rarity, Weapon } from '../data'
import { characters, standardOnlyCharacters, weapons } from '../data'
import type { Pity } from '../db/pity'
import pity from '../db/pity'
import { randomItemFromArray, randomPercentage } from '../utils'

export type PullMode = 'single' | 'multi'

export type BannerType = 'standard' | 'character' | 'weapon'

abstract class Gacha {
  /** Base percentage for all rarity */
  protected abstract readonly BASE_RATE: {
    [K in Rarity]: number
  }

  /** Opinionated soft pity rate */
  protected abstract readonly SOFT_PITY_RATE: number

  /** Minimal pulls to start the soft pity counter */
  protected abstract readonly SOFT_PITY_START: number

  /** In which pulls hard pity should be triggered */
  protected abstract readonly HARD_PITY: number

  constructor(
    /** Discord user id */
    protected readonly userId: string,
    /** Selected user banner */
    protected readonly banner: Banner,
    /** Current user pity */
    protected currentPity: Pity
  ) {}

  /** Get user stored pity or generate one if none exists */
  public static async getPity(userId: string, type: BannerType, wishedWeapon?: string) {
    const pityId = `${userId}.${type}`
    let userPity = await pity.findOne({ pityId }).exec()

    if (!userPity) {
      userPity = new pity({
        pityId,
        FOUR_STAR: 1,
        FIVE_STAR: 1,
      })
    }

    if (wishedWeapon) {
      userPity.WISHED_WEAPON = wishedWeapon
    }

    return userPity
  }

  /** Do pulls */
  public async pull(mode: PullMode = 'multi') {
    const results = []

    for (let i = 0; i < (mode === 'single' ? 1 : 10); i++) {
      const random = randomPercentage()
      const percentage = this.generatePercentage()

      if (percentage.FIVE_STAR.gte(random)) {
        results.push(this.randomFiveStar())
      } else if (percentage.FOUR_STAR.gte(random) || this.currentPity.FOUR_STAR === 10) {
        this.currentPity.FIVE_STAR += 1
        this.currentPity.FOUR_STAR = 1

        results.push(this.randomFourStar())
      } else {
        this.currentPity.FIVE_STAR += 1
        this.currentPity.FOUR_STAR += 1

        results.push(this.randomThreeStar())
      }
    }

    // Update user pity
    await this.currentPity.save()

    return results
  }

  /** Generate metadata info */
  public metadata() {
    const RATE_ON_COUNT = Math.floor(this.currentPity.FIVE_STAR / this.HARD_PITY)
    const CURRENT_PULLS = this.currentPity.FIVE_STAR - this.HARD_PITY * RATE_ON_COUNT

    const isHardPity = CURRENT_PULLS === this.HARD_PITY
    const shouldIncreaseRate = CURRENT_PULLS > this.SOFT_PITY_START

    return {
      RATE_ON_COUNT,
      CURRENT_PULLS,
      isHardPity,
      shouldIncreaseRate,
    }
  }

  /** Generate drop percentage based on metadata */
  public generatePercentage() {
    const { CURRENT_PULLS, isHardPity, shouldIncreaseRate } = this.metadata()

    const BASE_FIVE_STAR = Big(this.BASE_RATE.FIVE_STAR)
    const BASE_FOUR_STAR = Big(this.BASE_RATE.FOUR_STAR)
    const BASE_THREE_STAR = Big(this.BASE_RATE.THREE_STAR)

    const SOFT_PITY_RATE = Big(this.SOFT_PITY_RATE)
    const ZERO = Big(0)
    const DIFFERENCE = this.HARD_PITY - this.SOFT_PITY_START - (this.HARD_PITY - CURRENT_PULLS)

    return {
      FIVE_STAR: shouldIncreaseRate
        ? isHardPity
          ? Big(100)
          : BASE_FIVE_STAR.plus(SOFT_PITY_RATE.times(DIFFERENCE))
        : BASE_FIVE_STAR,
      FOUR_STAR: shouldIncreaseRate && isHardPity ? ZERO : BASE_FOUR_STAR,
      THREE_STAR: shouldIncreaseRate
        ? isHardPity
          ? ZERO
          : BASE_THREE_STAR.minus(SOFT_PITY_RATE.times(DIFFERENCE))
        : BASE_THREE_STAR,
    }
  }

  /** Generate random five star character or weapon based on metadata */
  protected abstract randomFiveStar(): Character | Weapon

  /** Generate random four star character or weapon  */
  protected randomFourStar() {
    const all = [...Array.from(characters.values()), ...Array.from(weapons.values())].filter(
      (data) => data.rarity === 'FOUR_STAR' && !data.limited // Exclude limited 4 star weapons
    )

    const filtered = this.banner.standard
      ? all.filter((data) => !standardOnlyCharacters.includes(data.name))
      : all

    const random = randomPercentage()

    if (random <= 50 && !this.banner.standard) {
      const result = (this.banner.type === 'character' ? characters : weapons).get(
        randomItemFromArray(this.banner.rateup)
      )

      invariant(result, 'Illegal calls')

      return result
    }

    return randomItemFromArray(filtered)
  }

  /** Generate random three star weapon  */
  protected randomThreeStar() {
    return randomItemFromArray(
      Array.from(weapons.values()).filter((weapon) => weapon.rarity === 'THREE_STAR')
    )
  }
}

export default Gacha
