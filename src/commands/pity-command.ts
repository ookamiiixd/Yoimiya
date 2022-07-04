import { CommandInteraction, MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { SlashChoice, SlashOption } from 'discordx'
import { Slash, SlashGroup } from 'discordx'
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
@SlashGroup({ name: 'pity', description: 'Execute pity related command' })
class PityCommand {
  @SimpleCommand('pity info', {
    aliases: ['detail', 'details'],
    description: 'Show pity information',
  })
  @Guard(rateLimitGuardFn(30))
  async info(command: SimpleCommandMessage | CommandInteraction) {
    const isSlash = command instanceof CommandInteraction

    const userId = isSlash ? command.user.id : command.message.author.id
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
      .setTitle(`${isSlash ? command.user.username : command.message.author.username}'s Pity Info`)
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

    const message = { embeds: [embed] }

    if (isSlash) {
      return command.reply(message)
    }

    command.message.channel.send(message)
  }

  @Slash('info', { description: 'Show pity information' })
  @SlashGroup('pity')
  @Guard(rateLimitGuardFn(30))
  slashInfo(command: CommandInteraction) {
    this.info(command)
  }

  @SimpleCommand('pity reset', { description: 'Reset pity data' })
  @Guard(rateLimitGuardFn(30))
  async reset(
    @SimpleCommandOption('banner-type', {
      type: SimpleCommandOptionType.String,
      description:
        'Which banner type the pity should be reset to (Optional). Valid value is `standard`, `character`, `weapon` and `all`. If set to `all`, this will reset pity on all banner type. Default: `all`.',
    })
    type: BannerType | 'all' | undefined = 'all',

    command: SimpleCommandMessage | CommandInteraction
  ) {
    if (![...bannerType, 'all'].includes(type)) {
      return sendUsageSyntax(command)
    }

    const isSlash = command instanceof CommandInteraction

    const userId = isSlash ? command.user.id : command.message.author.id
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

    const message = 'Your pity has been successfully reset'

    if (isSlash) {
      return command.reply(message)
    }

    command.message.reply(message)
  }

  @Slash('reset', { description: 'Reset pity data' })
  @SlashGroup('pity')
  @Guard(rateLimitGuardFn(30))
  slashReset(
    @SlashChoice(...[...bannerType, 'all'])
    @SlashOption('banner-type', {
      required: false,
      type: 'STRING',
      description: 'Which banner type the pity should be reset to (Optional)',
    })
    type: BannerType | 'all' | undefined,

    command: CommandInteraction
  ) {
    this.reset(type, command)
  }

  @SimpleCommand('pity set', { description: 'Set pity data' })
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

    command: SimpleCommandMessage | CommandInteraction
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

    const isSlash = command instanceof CommandInteraction

    const userId = isSlash ? command.user.id : command.message.author.id
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

    const message = 'Your pity has been successfully set'

    if (isSlash) {
      return command.reply(message)
    }

    command.message.reply(message)
  }

  @Slash('set', { description: 'Set pity data' })
  @SlashGroup('pity')
  @Guard(rateLimitGuardFn(30))
  slashSet(
    @SlashChoice(...bannerType)
    @SlashOption('banner-type', {
      required: false,
      type: 'STRING',
      description: 'Which banner type the pity should be set to (Optional)',
    })
    type: BannerType | undefined,

    @SlashOption('four-star', {
      required: false,
      type: 'NUMBER',
      description: 'Four star pity (Optional)',
    })
    fourStar: number | undefined,

    @SlashOption('five-star', {
      required: false,
      type: 'NUMBER',
      description: 'Five star pity (Optional)',
    })
    fiveStar: number | undefined,

    command: CommandInteraction
  ) {
    this.set(type, fourStar, fiveStar, command)
  }
}

export default PityCommand
