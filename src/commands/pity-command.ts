import { MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { Guard } from 'discordx'
import { Discord, SimpleCommand, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'
import invariant from 'tiny-invariant'

import { banners as bannersCache } from '../data'
import type { Pity } from '../db/pity'
import pity from '../db/pity'
import CharacterGacha from '../gacha/character-gacha'
import type { BannerType } from '../gacha/gacha'
import WeaponGacha from '../gacha/weapon-gacha'
import { normalizeName, sendUsageSyntax } from '../utils'
import { EMBED_COLOR } from './command'
import { rateLimitGuardFn } from './command'

const bannerType = ['standard', 'character', 'weapon']

@Discord()
class PityCommand {
  @SimpleCommand('pity info', {
    aliases: ['detail', 'details'],
    description: 'Get pity information',
  })
  @Guard(rateLimitGuardFn(30))
  async info(command: SimpleCommandMessage) {
    const userId = command.message.author.id
    // Get pity
    const [standardPity, characterPity, weaponPity] = await Promise.all([
      CharacterGacha.getPity(userId, 'standard'),
      CharacterGacha.getPity(userId, 'character'),
      CharacterGacha.getPity(userId, 'weapon'),
    ])

    // Get related banner to satisfy the method requirement
    const banners = Array.from(bannersCache.values())
    const [standardBanner, characterBanner, weaponBanner] = [
      banners.find((banner) => banner.standard),
      banners.find((banner) => banner.type === 'character'),
      banners.find((banner) => banner.type === 'weapon'),
    ]

    invariant(standardBanner && characterBanner && weaponBanner, 'Illegal calls')

    // Get metadata
    const standardMeta = new CharacterGacha(userId, standardBanner, standardPity).metadata()
    const characterMeta = new CharacterGacha(userId, characterBanner, characterPity).metadata()
    const weaponMeta = new WeaponGacha(userId, weaponBanner, weaponPity).metadata()

    const mapper = (
      pity: Pity,
      meta: ReturnType<CharacterGacha['metadata']>,
      type: BannerType = 'standard'
    ) =>
      `**4★**: ${pity.FOUR_STAR}\n` +
      `**5★**: ${meta.CURRENT_PULLS}\n` +
      (type !== 'standard'
        ? `**${type === 'weapon' ? 'Fate Point' : 'Guaranteed'}**: ${
            type === 'weapon' ? meta.RATE_ON_COUNT : meta.RATE_ON_COUNT === 1 ? 'Yes' : 'No'
          }\n`
        : '') +
      (type === 'weapon'
        ? `**Wished Weapon**: ${
            pity.WISHED_WEAPON ? `${normalizeName(pity.WISHED_WEAPON)} (${pity.WISHED_WEAPON})` : ''
          }`
        : '')

    const embed = new MessageEmbed()

    // Build embed
    embed
      .setColor(EMBED_COLOR)
      .setTitle(`${command.message.author.username}'s Pity Info`)
      .addFields([
        {
          name: 'Standard Banner',
          value: mapper(standardPity, standardMeta),
        },
        {
          name: 'Character Banner',
          value: mapper(characterPity, characterMeta, 'character'),
        },
        {
          name: 'Weapon Banner',
          value: mapper(weaponPity, weaponMeta, 'weapon'),
        },
      ])

    command.message.reply({ embeds: [embed] })
  }

  @SimpleCommand('pity reset', {
    description: 'Reset pity data',
  })
  @Guard(rateLimitGuardFn(30))
  async reset(
    @SimpleCommandOption('banner-type', {
      type: SimpleCommandOptionType.String,
      description:
        'Which banner the pity should be reset to (Optional). Valid value is `standard`, `character`, `weapon` and `all`. If set to `all`, this will reset pity on all banner type. Default: `all`.',
    })
    type: BannerType | 'all' | undefined = 'all',

    command: SimpleCommandMessage
  ) {
    if (![...bannerType, 'all'].includes(type)) {
      return sendUsageSyntax(command)
    }

    const userId = command.message.author.id
    const resetData = {
      FOUR_STAR: 1,
      FIVE_STAR: 1,
    }

    // Reset it
    if (type === 'all') {
      await pity.updateMany({ pityId: new RegExp(userId) }, resetData)
    } else {
      await pity.updateOne({ pityId: `${userId}.${type}` }, resetData)
    }

    command.message.reply('Your pity has been successfully reset')
  }

  @SimpleCommand('pity set', {
    description: 'Set pity data.',
  })
  @Guard(rateLimitGuardFn(30))
  async set(
    @SimpleCommandOption('banner-type', {
      type: SimpleCommandOptionType.String,
      description:
        'Which banner the pity should be set to (Optional). Valid value is `standard`, `character` and `weapon`. Default: `character`.',
    })
    type: BannerType | undefined = 'character',

    @SimpleCommandOption('four-star', {
      type: SimpleCommandOptionType.Number,
      description: 'Four star pity (Optional). Valid value is `1` - `10`. Default: `1`.',
    })
    fourStar: number | undefined = 1,

    @SimpleCommandOption('five-star', {
      type: SimpleCommandOptionType.Number,
      description:
        'Five star pity (Optional). Valid value is `1` - `80` for weapon banner, or `1` - `90` for standard and character banner. Default: `1`.',
    })
    fiveStar: number | undefined = 1,

    command: SimpleCommandMessage
  ) {
    const maxPity = type === 'character' ? 90 : 80

    // Validate
    if (
      !bannerType.includes(type) ||
      fourStar < 1 ||
      fourStar > 10 ||
      fiveStar < 1 ||
      fiveStar > maxPity - 1
    ) {
      return sendUsageSyntax(command)
    }

    const userId = command.message.author.id
    const currentPity = await CharacterGacha.getPity(userId, type)

    // Update it
    await pity
      .updateOne(
        { pityId: `${userId}.${type}` },
        {
          FOUR_STAR: fourStar,
          FIVE_STAR: maxPity * Math.floor(currentPity.FIVE_STAR / maxPity) + fiveStar,
        },
        { upsert: true }
      )
      .exec()

    command.message.reply('Your pity has been successfully set')
  }
}

export default PityCommand
