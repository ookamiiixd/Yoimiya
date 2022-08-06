import { Pagination, PaginationType } from '@discordx/pagination'
import { CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { SlashOption } from 'discordx'
import { Slash, SlashGroup } from 'discordx'
import { Guard } from 'discordx'
import { SimpleCommandOption, SimpleCommandOptionType } from 'discordx'
import { Discord, SimpleCommand } from 'discordx'
import { readFileSync } from 'fs'

import type { Banner } from '../data'
import { banners } from '../data'
import { capitalize, normalizeName, sendUsageSyntax } from '../utils'
import { EMBED_COLOR } from './command'
import { rateLimitGuardFn } from './command'

@Discord()
@SlashGroup({ name: 'banner', description: 'Execute banner related command' })
class BannerCommand {
  @SimpleCommand('banner list', { description: 'Show list of available banners' })
  @Guard(rateLimitGuardFn(90))
  list(command: SimpleCommandMessage | CommandInteraction) {
    const grouped: Banner[][] = []
    const list = Array.from(banners.values())

    // Group by length for paging
    while (list.length) {
      grouped.push(list.splice(0, 10))
    }

    // Map embed
    const embed = grouped.map((list, index) =>
      new MessageEmbed()
        .setColor(EMBED_COLOR)
        .setTitle(`Banner List Page #${index + 1}`)
        .addFields(
          list.map((banner) => ({
            name: normalizeName(banner.name),
            value:
              `Banner ID: ${banner.name}\n` +
              `Patch Number: ${banner.patch.toFixed(1)}\n` +
              `Type: ${capitalize(banner.type)}\n` +
              `Featured ${capitalize(banner.type)}: ${
                banner.type === 'character' && 'character' in banner
                  ? `${normalizeName(banner.character)} (${banner.character})`
                  : 'featured' in banner
                  ? banner.featured
                      .map((weapon) => `${normalizeName(weapon)} (${weapon})`)
                      .join(', ')
                  : ''
              }`,
          }))
        )
    )

    // Send paginated result
    new Pagination(
      command instanceof CommandInteraction ? command : command.message.channel,
      embed,
      {
        type: PaginationType.Button,
        time: 60_000 * 5, // 5 minutes timeout
        start: { emoji: '⏪', label: '' },
        end: { emoji: '⏩', label: '' },
        previous: { emoji: '◀️', label: '' },
        next: { emoji: '▶️', label: '' },
      }
    ).send()
  }

  @Slash('list', { description: 'Show list of available banners' })
  @SlashGroup('banner')
  @Guard(rateLimitGuardFn(90))
  slashList(interaction: CommandInteraction) {
    this.list(interaction)
  }

  @SimpleCommand('banner info', {
    aliases: ['banner detail', 'banner details'],
    description: 'Show banner information',
  })
  @Guard(rateLimitGuardFn(15))
  info(
    @SimpleCommandOption('banner-id', {
      type: SimpleCommandOptionType.String,
      description:
        'Banner id (Required). Use `y!banner list` to get list of available banner and its id.',
    })
    bannerId: string | undefined = '',

    command: SimpleCommandMessage | CommandInteraction
  ) {
    const banner = banners.get(bannerId)

    if (!banner) {
      return sendUsageSyntax(command)
    }

    const embed = new MessageEmbed()
    const attachment = new MessageAttachment(
      readFileSync(`./static/images/banners/${banner.name}.webp`),
      'banner.webp'
    )

    // Build embed
    embed
      .setColor(EMBED_COLOR)
      .setImage('attachment://banner.webp')
      .setTitle(normalizeName(banner.name))
      .addFields([
        {
          name: 'Banner ID',
          value: banner.name,
        },
        {
          name: 'Patch Number',
          value: banner.patch.toFixed(1),
        },
        {
          name: 'Type',
          value: capitalize(banner.type),
        },
        {
          name: 'Standard',
          value: banner.standard ? 'Yes' : 'No',
        },
        {
          name: `Featured ${capitalize(banner.type)}`,
          value:
            banner.type === 'character' && 'character' in banner
              ? `${normalizeName(banner.character)} (${banner.character})`
              : 'featured' in banner
              ? banner.featured.map((weapon) => `- ${normalizeName(weapon)} (${weapon})`).join('\n')
              : '',
        },
        {
          name: 'Rate Up',
          value: banner.rateup.map((rateup) => `- ${normalizeName(rateup)} (${rateup})`).join('\n'),
        },
      ])

    const message = { embeds: [embed], files: [attachment] }

    if (command instanceof CommandInteraction) {
      return command.reply(message)
    }

    command.message.channel.send(message)
  }

  @Slash('info', { description: 'Show banner information' })
  @SlashGroup('banner')
  @Guard(rateLimitGuardFn(15))
  slashInfo(
    @SlashOption('banner-id', {
      type: 'STRING',
      description: 'Banner id (Required)',
    })
    bannerId: string | undefined,

    interaction: CommandInteraction
  ) {
    this.info(bannerId, interaction)
  }
}

export default BannerCommand
