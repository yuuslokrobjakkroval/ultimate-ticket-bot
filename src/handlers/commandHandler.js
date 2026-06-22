const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  const commandData = [];

  for (const file of files) {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.execute) continue;
    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
  }

  const rest = new REST().setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commandData },
  );
  console.log(`[CMD] Registered ${commandData.length} command(s)`);
}

module.exports = { loadCommands };
