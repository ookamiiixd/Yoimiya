import invariant from 'tiny-invariant'

import { weapons } from '../data'
import { randomItemFromArray, randomPercentage } from '../utils'
import Gacha from './gacha'

class WeaponGacha extends Gacha {
  protected BASE_RATE = {
    FIVE_STAR: 0.7,
    FOUR_STAR: 6,
    THREE_STAR: 93.3,
  }

  protected SOFT_PITY_RATE = 6.20625
  protected SOFT_PITY_START = 64
  protected HARD_PITY = 80

  protected randomFiveStar() {
    invariant('WISHED_WEAPON' in this.currentPity && 'featured' in this.banner, 'Illegal calls')

    const random = randomPercentage()
    const { RATE_ON_COUNT, CURRENT_PULLS } = this.metadata()

    const result = weapons.get(randomItemFromArray(this.banner.featured))
    invariant(result, 'Illegal calls')

    const isGotWished = result.name === this.currentPity.WISHED_WEAPON

    // Full fate point / won 50:50 / won 50:50 on 75:25
    if (
      RATE_ON_COUNT === 2 ||
      (RATE_ON_COUNT === 1 && isGotWished) ||
      (random <= 75 && isGotWished)
    ) {
      this.currentPity.FIVE_STAR = 1
      this.currentPity.WISHED_WEAPON = ''
      // Lost 50:50
    } else if (RATE_ON_COUNT === 1 && !isGotWished) {
      this.currentPity.FIVE_STAR = CURRENT_PULLS + (this.HARD_PITY * 2 - CURRENT_PULLS)
      // Lost 50:50 on 75:25
    } else if (random <= 75 && !isGotWished) {
      this.currentPity.FIVE_STAR = CURRENT_PULLS + (this.HARD_PITY - CURRENT_PULLS)
    }

    if (RATE_ON_COUNT > 0 || random <= 75) {
      return result
    }

    // Lost 75:25
    return randomItemFromArray(
      Array.from(weapons.values()).filter(
        (weapon) => weapon.rarity === 'FIVE_STAR' && !weapon.limited
      )
    )
  }
}

export default WeaponGacha
