require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { startAutoClose } = require('./utils/autoClose');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[DB] Connected to MongoDB');

  await loadCommands(client);
  await loadEvents(client);

  await client.login(process.env.BOT_TOKEN);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

module.exports = { client };
