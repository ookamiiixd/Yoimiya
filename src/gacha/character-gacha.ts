import invariant from 'tiny-invariant'

import type { CharacterBanner } from '../data'
import { characters } from '../data'
import { randomItemFromArray, randomPercentage } from '../utils'
import Gacha from './gacha'

class CharacterGacha extends Gacha {
  protected BASE_RATE = {
    FIVE_STAR: 0.6,
    FOUR_STAR: 5.1,
    THREE_STAR: 94.3,
  }

  protected SOFT_PITY_RATE = 6.2125
  protected SOFT_PITY_START = 74
  protected HARD_PITY = 90

  protected randomFiveStar() {
    invariant(this.banner.type !== 'weapon', 'Illegal calls')

    // Standard banner
    if (this.banner.standard) {
      this.currentPity.FIVE_STAR = 1

      const result = characters.get(randomItemFromArray(this.banner.rateup))
      invariant(result, 'Illegal calls')

      return result
    }

    const random = randomPercentage()
    const { RATE_ON_COUNT, CURRENT_PULLS } = this.metadata()

    // Rate on / won 50:50
    if (RATE_ON_COUNT === 1 || random <= 50) {
      this.currentPity.FIVE_STAR = 1

      const result = characters.get((this.banner as CharacterBanner).character)
      invariant(result, 'Illegal calls')

      return result
    }

    // Lost 50:50
    this.currentPity.FIVE_STAR = CURRENT_PULLS + (this.HARD_PITY - CURRENT_PULLS)

    return randomItemFromArray(
      Array.from(characters.values()).filter(
        (character) => character.rarity === 'FIVE_STAR' && !character.limited
      )
    )
  }
}

export default CharacterGacha
