import { RateLimit, TIME_UNIT } from '@discordx/utilities'
import type { CommandInteraction } from 'discord.js'
import { MessageAttachment, MessageEmbed } from 'discord.js'
import { SimpleCommandMessage, Slash } from 'discordx'
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
    description: 'Show bot usage information',
  })
  @Guard(rateLimitGuardFn(300))
  help(command: SimpleCommandMessage | CommandInteraction) {
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
        'To show help for specific command, type `<prefix><command> help`. This only available to prefixed commands that accept an argument on it and not available on slash commands.'
      )
      .addFields([
        {
          name: 'Usage',
          value:
            "To use Yoimiya's commands, you can either use Yoimiya's slash commands or use prefixed commands by typing `<prefix><command-name> ...<args>`. Argument(s) is separated by single whitespace.",
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

    const message = { embeds: [embed], files: [attachment] }

    if (command instanceof SimpleCommandMessage) {
      return command.message.channel.send(message)
    }

    command.reply(message)
  }

  @Slash('help', { description: 'Show bot usage information' })
  @Guard(rateLimitGuardFn(300))
  slashHelp(interaction: CommandInteraction) {
    this.help(interaction)
  }
}

export default Command
