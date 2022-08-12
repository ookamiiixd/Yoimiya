import { CommandInteraction, MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { SimpleCommandOptionType } from 'discordx'

import { EMBED_COLOR } from './commands/command'
import type { Character, Weapon } from './data'
import { characterVision } from './data'
import { Stars } from './data'
import { bot } from './main'

export function randomPercentage() {
  return Math.floor(Math.random() * 100) + 1
}

export function randomItemFromArray<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function capitalize(text: string, all = false): string {
  if (all) {
    return text
      .split(' ')
      .map((word) => capitalize(word))
      .join(' ')
  }

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

export function normalizeName(name: string) {
  return capitalize(name.replace(/\d/g, '').replace(/_/g, "'").replace(/-/g, ' ').trim(), true)
}

export async function sendUsageSyntax(command: SimpleCommandMessage | CommandInteraction) {
  if (command instanceof CommandInteraction) {
    return command.reply('Invalid syntax. Type `<prefix><command> help` to show command usage.')
  }

  const embed = new MessageEmbed()

  embed
    .setColor(EMBED_COLOR)
    .setTitle('Command Info')
    .addField('Name', command.info.name)
    .addField('Description', command.info.description)

  // add aliases
  if (command.info.aliases.length) {
    embed.addField('Aliases', command.info.aliases.join(', '))
  }

  // add syntax usage
  embed.addField(
    'Command Usage',
    '```yml\n' +
      command.prefix +
      command.name +
      ` ${command.info.options
        .map((op) => `{${op.name}: ${SimpleCommandOptionType[op.type]}}`)
        .join(' ')}\n` +
      '```'
  )

  // add options if available
  if (command.info.options.length) {
    embed.addField(
      'Options',
      command.info.options
        .map((option) => `- **\`${option.name}\`**: ${option.description}`)
        .join('\n')
    )
  }

  return command.message.reply({ embeds: [embed] })
}

export function setActivity() {
  bot.user?.setActivity(`in ${bot.guilds.cache.size} servers | y!help`)
}

type Entity = Character | Weapon

export function sortGachaResults(results: Entity[]) {
  // Group duplicated characters
  const grouped = results.reduce((a, b) => {
    const isWeapon = !characterVision.includes(b.type)
    const prev = a.get(b.name) ?? []

    return a.set(`${b.name}${isWeapon ? Math.random() : ''}`, [...(isWeapon ? [] : prev), b])
  }, new Map<string, Entity[]>())

  return Array.from(grouped.values())
    .sort((a, b) => b.length - a.length) // Sort by duplicate
    .flat(1) // Flatten array
    .sort((a, b) => (!characterVision.includes(b.type) ? -1 : 0)) // Sort by type
    .sort((a, b) => Stars[b.rarity] - Stars[a.rarity]) // Sort by rarity
}
