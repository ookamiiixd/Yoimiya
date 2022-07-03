import { RateLimit, TIME_UNIT } from '@discordx/utilities'
import { MessageAttachment, MessageEmbed } from 'discord.js'
import type { SimpleCommandMessage } from 'discordx'
import { Discord, Guard, SimpleCommand } from 'discordx'
import { readFileSync } from 'fs'

export const EMBED_COLOR = '#e91e62'

const commands = [
  {
    command: 'gacha',
    desc: 'Do wish simulation',
  },
  {
    command: 'banner list',
    desc: 'Show list of available banners',
  },
  {
    command: 'banner info',
    desc: 'Show banner information',
  },
  {
    command: 'pity info',
    desc: 'Show your pity information',
  },
  {
    command: 'pity reset',
    desc: 'Reset your pity data',
  },
  {
    command: 'pity set',
    desc: 'Set your pity data',
  },
  {
    command: 'help',
    desc: 'Show this help message',
  },
]

export const rateLimitGuardFn = (cooldownMs: number) =>
  RateLimit(TIME_UNIT.seconds, cooldownMs, {
    message: (command, ms) =>
      `Command is in cooldown. Please wait ${(ms / 1000).toFixed(1)} seconds.`,
  })

@Discord()
class Command {
  @SimpleCommand('help', {
    description: 'Get bot usage information',
  })
  @Guard(rateLimitGuardFn(300))
  help(command: SimpleCommandMessage) {
    const embed = new MessageEmbed()
    const attachment = new MessageAttachment(
      readFileSync('./static/images/etc/yoimiya.jpg'),
      'yoimiya.jpg'
    )

    // Build embed
    embed
      .setColor(EMBED_COLOR)
      .setThumbnail('attachment://yoimiya.jpg')
      .setTitle("Yoimiya's Usage")
      .setDescription(
        'To show help for specific command, type `<prefix><command> help`. This only available to commands that accept an argument on it.'
      )
      .addFields([
        {
          name: 'Usage',
          value:
            "To use Yoimiya's commands, type `<prefix><command-name> ...<args>`. Argument(s) is separated by single whitespace.",
        },
        {
          name: 'Prefix',
          value: "Yoimiya's prefix is `y!`. Currently Yoimiya doesn't support custom prefix.",
        },
        {
          name: 'Available Commands',
          value: commands
            .map((command) => `- **\`${command.command}\`**: ${command.desc}`)
            .join('\n'),
        },
      ])

    command.message.reply({ embeds: [embed], files: [attachment] })
  }
}

export default Command
