import { CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { Slash, SlashChoice, SlashOption } from 'discordx'
import { Guard } from 'discordx'
import { Discord, SimpleCommand, SimpleCommandOption, SimpleCommandOptionType } from 'discordx'
import { readFileSync } from 'fs'

import { characterVision, Stars } from '../data'
import { banners } from '../data'
import CharacterGacha from '../gacha/character-gacha'
import type { PullMode } from '../gacha/gacha'
import WeaponGacha from '../gacha/weapon-gacha'
import Image from '../image/image'
import { normalizeName, sendUsageSyntax } from '../utils'
import { EMBED_COLOR } from './command'
import { rateLimitGuardFn } from './command'

@Discord()
class GachaCommand {
  @SimpleCommand('gacha', { aliases: ['pull', 'pulls'], description: 'Do wish simulation' })
  @Guard(rateLimitGuardFn(10))
  async gacha(
    @SimpleCommandOption('mode', {
      type: SimpleCommandOptionType.String,
      description: 'Pull mode (Optional). Valid value is `single` or `multi`. Default: `multi`.',
    })
    mode: PullMode | undefined = 'multi',

    @SimpleCommandOption('banner-id', {
      type: SimpleCommandOptionType.String,
      description:
        'Banner id (Optional). Use `y!banner list` to get list of available banner and its id. Default: Latest character banner id.',
    })
    bannerId: string | undefined,

    @SimpleCommandOption('wished-weapon-id', {
      type: SimpleCommandOptionType.String,
      description:
        'Wished weapon id for the fate point system (Required for weapon banner). Use `y!banner info {banner-id}` to get info about featured weapon and its id.',
    })
    wishedWeaponId: string | undefined = undefined,

    command: SimpleCommandMessage | CommandInteraction
  ) {
    const isSlash = command instanceof CommandInteraction

    // Get banner
    const banner = bannerId
      ? banners.get(bannerId)
      : Array.from(banners.values())
          .reverse()
          .find((banner) => banner.type === 'character' && !banner.standard)

    // Validate
    if (
      !['single', 'multi'].includes(mode) ||
      !banner ||
      ('featured' in banner && !banner.featured.includes(wishedWeaponId ?? ''))
    ) {
      return sendUsageSyntax(command)
    }

    const userId = isSlash ? command.user.id : command.message.author.id
    const userPity = await CharacterGacha.getPity(
      userId,
      banner.standard ? 'standard' : banner.type,
      wishedWeaponId?.length ? wishedWeaponId : undefined
    )

    const gacha =
      banner.type === 'character'
        ? new CharacterGacha(userId, banner, userPity)
        : new WeaponGacha(userId, banner, userPity)

    const result = await gacha.pull(mode)
    const meta = gacha.metadata()
    // Build image from the gacha result
    const image = await Image.combine(
      result.map(
        (res) =>
          `./static/images/${characterVision.includes(res.type) ? 'characters' : 'weapons'}/${
            res.name
          }.webp`
      )
    )

    const resultAttachment = new MessageAttachment(image, 'result.webp')
    const bannerAttachment = new MessageAttachment(
      readFileSync(`./static/images/banners/${banner.name}.webp`),
      'banner.webp'
    )

    const embed = new MessageEmbed()

    // Build embed
    embed
      .setColor(EMBED_COLOR)
      .setImage('attachment://result.webp')
      .setThumbnail('attachment://banner.webp')
      .setTitle(
        `${isSlash ? command.user.username : command.message.author.username}'s Pull Result`
      )

      .addField('Selected Banner', `${normalizeName(banner.name)} (${banner.name})`)
      .addField(
        'Results',
        result
          .map((res) =>
            Stars[res.rarity] === 5
              ? `**[${Stars[res.rarity]}★] ${normalizeName(res.name)}**` // Boldify
              : `[${Stars[res.rarity]}★] ${normalizeName(res.name)}`
          )
          .join(', ')
      )

      .addField(
        'Current Pity',
        `**4★**: ${userPity.FOUR_STAR}\n` +
          `**5★**: ${meta.CURRENT_PULLS}\n` +
          (!banner.standard
            ? `**${banner.type === 'weapon' ? 'Fate Point' : 'Guaranteed'}**: ${
                banner.type === 'weapon'
                  ? meta.RATE_ON_COUNT
                  : meta.RATE_ON_COUNT === 1
                  ? 'Yes'
                  : 'No'
              }\n`
            : '') +
          (banner.type === 'weapon' ? `**Wished Weapon**: ${userPity.WISHED_WEAPON ?? ''}` : '')
      )

    const message = { embeds: [embed], files: [resultAttachment, bannerAttachment] }

    if (isSlash) {
      return command.reply(message)
    }

    command.message.channel.send(message)
  }

  @Slash('gacha', { description: 'Do wish simulation' })
  @Guard(rateLimitGuardFn(10))
  slashGacha(
    @SlashChoice('single', 'multi')
    @SlashOption('mode', {
      required: false,
      type: 'STRING',
      description: 'Pull mode (Optional)',
    })
    mode: PullMode | undefined,

    @SlashOption('banner-id', {
      required: false,
      type: 'STRING',
      description: 'Banner id (Optional)',
    })
    bannerId: string | undefined,

    @SlashOption('wished-weapon-id', {
      required: false,
      type: 'STRING',
      description: 'Wished weapon id for the fate point system (Required for weapon banner)',
    })
    wishedWeaponId: string | undefined,

    interaction: CommandInteraction
  ) {
    this.gacha(mode, bannerId, wishedWeaponId, interaction)
  }
}

export default GachaCommand
