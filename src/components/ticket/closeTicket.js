const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const GuildConfig = require('../../models/GuildConfig');
const Ticket = require('../../models/Ticket');
const { generateTranscript } = require('../../utils/transcript');
const emojis = require('../../../emojis.json');

async function handleCloseButton(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.reply({ content: '❌ This is not an active ticket.', ephemeral: true });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${emojis.close} Close Ticket`)
        .setDescription('Are you sure you want to close this ticket?')
        .setColor('#ED4245'),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:close:confirm').setLabel('Close Ticket').setEmoji(emojis.close).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Cancel').setEmoji(emojis.cancel).setStyle(ButtonStyle.Secondary),
      ),
    ],
    ephemeral: true,
  });
}

async function handleCloseConfirm(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channelId, status: 'open' });
  if (!ticket) return interaction.update({ content: '❌ Ticket not found or already closed.', components: [] });
  await interaction.deferUpdate();

  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await closeTicketChannel(interaction.guild, interaction.channel, ticket, interaction.user, 'manual', config);
}

async function closeTicketChannel(guild, channel, ticket, closer, reason, config) {
  if (!config) config = await GuildConfig.findOne({ guildId: guild.id });

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closedById = closer?.id || null;
  await ticket.save();

  // Generate transcript
  const file = await generateTranscript(channel, ticket, guild).catch(() => null);

  // Send to logs
  if (config?.channels?.logsChannelId && file) {
    const logsChannel = await guild.channels.fetch(config.channels.logsChannelId).catch(() => null);
    if (logsChannel) {
      await logsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${emojis.transcript} Transcript — Ticket #${ticket.ticketNumber}`)
            .setColor('#5865F2')
            .addFields(
              { name: 'Category', value: ticket.categoryName || 'None', inline: true },
              { name: 'Opened by', value: `<@${ticket.creatorId}>`, inline: true },
              { name: 'Closed by', value: closer ? `<@${closer.id}>` : reason, inline: true },
              { name: 'Duration', value: formatDuration(ticket.openedAt, ticket.closedAt), inline: true },
            )
            .setTimestamp(),
        ],
        files: file ? [file] : [],
      });
    }
  }

  // DM transcript + feedback to creator
  if (config?.behavior?.feedbackEnabled || file) {
    const creator = await guild.members.fetch(ticket.creatorId).catch(() => null);
    if (creator) {
      const feedbackRow = config?.behavior?.feedbackEnabled
        ? [new ActionRowBuilder().addComponents(
            ...[1, 2, 3, 4, 5].map(n =>
              new ButtonBuilder().setCustomId(`ticket:feedback:${ticket._id}:${n}`).setLabel('⭐'.repeat(n)).setStyle(ButtonStyle.Secondary),
            ),
          )]
        : [];

      const dmEmbed = new EmbedBuilder()
        .setTitle(`${emojis.ticket} Your ticket has been closed`)
        .setColor('#5865F2')
        .addFields(
          { name: 'Server', value: guild.name, inline: true },
          { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
          { name: 'Category', value: ticket.categoryName || 'None', inline: true },
        );

      if (config?.behavior?.feedbackEnabled) {
        dmEmbed.setDescription('Please rate your support experience:');
      }

      await creator.send({
        embeds: [dmEmbed],
        files: file ? [file] : [],
        components: feedbackRow,
      }).catch(() => {});
    }
  }

  // Delete or archive
  if (config?.behavior?.deleteOnClose) {
    await channel.delete(`Ticket #${ticket.ticketNumber} closed by ${closer?.tag || reason}`).catch(() => {});
  } else {
    if (config?.behavior?.lockOnClose) {
      await channel.permissionOverwrites.edit(ticket.creatorId, { SendMessages: false }).catch(() => {});
    }
    if (config?.channels?.archiveCategoryId) {
      await channel.setParent(config.channels.archiveCategoryId, { lockPermissions: false }).catch(() => {});
    }
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(`${emojis.close} This ticket has been closed by ${closer ? `<@${closer.id}>` : reason}.`)
          .setColor('#ED4245')
          .setTimestamp(),
      ],
    }).catch(() => {});
  }
}

async function handleFeedback(interaction, ticketId, rating) {
  await interaction.deferUpdate();
  const ticket = await Ticket.findById(ticketId);
  if (!ticket || ticket.feedbackRating) return;

  ticket.feedbackRating = parseInt(rating, 10);
  await ticket.save();

  const config = await GuildConfig.findOne({ guildId: ticket.guildId });
  if (config?.channels?.feedbackChannelId) {
    const feedbackChannel = await interaction.client.channels.fetch(config.channels.feedbackChannelId).catch(() => null);
    if (feedbackChannel) {
      await feedbackChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${emojis.feedback} Ticket Feedback`)
            .setColor('#fee75c')
            .addFields(
              { name: 'Rating', value: '⭐'.repeat(ticket.feedbackRating) + ` (${ticket.feedbackRating}/5)`, inline: true },
              { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
              { name: 'Category', value: ticket.categoryName || 'None', inline: true },
              { name: 'Opened by', value: `<@${ticket.creatorId}>`, inline: true },
              { name: 'Claimed by', value: ticket.claimedById ? `<@${ticket.claimedById}>` : 'Nobody', inline: true },
            )
            .setTimestamp(),
        ],
      });
    }
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setDescription(`${'⭐'.repeat(ticket.feedbackRating)} Thank you for your feedback!`)
        .setColor('#fee75c'),
    ],
    components: [],
  });
}

function formatDuration(start, end) {
  const ms = new Date(end) - new Date(start);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h ? `${h}h ${m}m` : `${m}m`;
}

module.exports = { handleCloseButton, handleCloseConfirm, closeTicketChannel, handleFeedback };
