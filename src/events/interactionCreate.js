const { handleComponent } = require('../handlers/componentHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[CMD ERROR] /${interaction.commandName}`, err);
        const msg = { content: '❌ An error occurred while running this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg).catch(() => {});
        } else {
          await interaction.reply(msg).catch(() => {});
        }
      }
      return;
    }

    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isChannelSelectMenu() ||
      interaction.isRoleSelectMenu() ||
      interaction.isUserSelectMenu() ||
      interaction.isMentionableSelectMenu() ||
      interaction.isModalSubmit()
    ) {
      await handleComponent(interaction);
    }
  },
};
