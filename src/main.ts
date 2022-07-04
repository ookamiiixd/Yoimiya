import 'dotenv/config'

import { importx } from '@discordx/importer'
import type { Interaction, Message } from 'discord.js'
import { Intents } from 'discord.js'
import { Client } from 'discordx'
import { connect } from 'mongoose'
import 'reflect-metadata'
import invariant from 'tiny-invariant'

import { cache } from './data'

export const bot = new Client({
  // Discord intents
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],

  // Debug logs are disabled in silent mode
  silent: process.env.NODE_ENV === 'production',

  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: 'y!',
  },
})

bot.once('ready', async () => {
  // Make sure all guilds are cached
  await bot.guilds.fetch()

  // Synchronize applications commands with Discord
  await bot.initApplicationCommands()

  // Synchronize applications command permissions with Discord
  await bot.initApplicationPermissions()

  // Set activity
  bot.user?.setActivity(`in ${bot.guilds.cache.size} servers | y!help`)

  console.log('Bot started')
})

bot.on('interactionCreate', (interaction: Interaction) => {
  bot.executeInteraction(interaction)
})

bot.on('messageCreate', (message: Message) => {
  bot.executeCommand(message)
})

async function run() {
  // Cache data
  cache()

  invariant(process.env.DATABASE_URL, 'Missing database url from the environment variables')

  // Connect to db
  await connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })

  // The following syntax should be used in the commonjs environment
  await importx(__dirname + '/{events,commands}/**/*.{ts,js}')

  // Start the bot
  invariant(process.env.BOT_TOKEN, 'Missing bot token from the environment variables')

  // Log in with your bot token
  await bot.login(process.env.BOT_TOKEN)
}

run()
