const {
  ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionsBitField,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const { requireStaff } = require('../../utils/permissions');
const { updateControlPanel } = require('./controlPanel');
const emojis = require('../../../emojis.json');

async function handleAddMember(interaction) {
  if (!await requireStaff(interaction)) return;
  const modal = new ModalBuilder()
    .setCustomId('ticket:add:save')
    .setTitle('Add Member to Ticket')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('userid')
          .setLabel('User ID or @mention (ID only)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter a Discord user ID...')
          .setRequired(true),
      ),
    );
  await interaction.showModal(modal);
}

async function handleAddMemberSave(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const userId = interaction.fields.getTextInputValue('userid').replace(/[^0-9]/g, '');

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.editReply({ content: '❌ Ticket not found.' });

  if (ticket.memberIds.includes(userId)) {
    return interaction.editReply({ content: '❌ That user is already in this ticket.' });
  }

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.editReply({ content: '❌ Could not find that user in this server.' });

  await interaction.channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  ticket.memberIds.push(userId);
  await ticket.save();

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await updateControlPanel(interaction.channel, ticket, config);
  await interaction.editReply({ content: `${emojis.addMember} Added <@${userId}> to this ticket.` });
}

async function handleRemoveMember(interaction) {
  if (!await requireStaff(interaction)) return;

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

  const removable = [ticket.creatorId, ...ticket.memberIds];
  if (removable.length === 0) {
    return interaction.reply({ content: '❌ No members to remove.', ephemeral: true });
  }

  const options = await Promise.all(removable.slice(0, 25).map(async (id) => {
    const m = await interaction.guild.members.fetch(id).catch(() => null);
    return new StringSelectMenuOptionBuilder()
      .setLabel(m ? m.user.tag : id)
      .setValue(id)
      .setDescription(id === ticket.creatorId ? 'Ticket creator' : 'Added member');
  }));

  await interaction.reply({
    content: `${emojis.removeMember} Select a member to remove from this ticket:`,
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket:remove:save')
          .setPlaceholder('Select member to remove...')
          .addOptions(options),
      ),
    ],
    ephemeral: true,
  });
}

async function handleRemoveMemberSave(interaction) {
  await interaction.deferUpdate();
  const userId = interaction.values[0];

  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return;

  await interaction.channel.permissionOverwrites.delete(userId).catch(() => {});
  ticket.memberIds = ticket.memberIds.filter(id => id !== userId);
  await ticket.save();

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await updateControlPanel(interaction.channel, ticket, config);
  await interaction.editReply({ content: `${emojis.removeMember} Removed <@${userId}> from this ticket.`, components: [] });
}

module.exports = { handleAddMember, handleAddMemberSave, handleRemoveMember, handleRemoveMemberSave };
