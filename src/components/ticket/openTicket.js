const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const Ticket = require("../../models/Ticket");
const { sendControlPanel } = require("./controlPanel");
const { scheduleAutoClose } = require("../../utils/autoClose");
const emojis = require("../../../emojis.json");

function formatChannelName(format, member, ticketNumber, category) {
  return format
    .replace(
      "{username}",
      member.user.username.toLowerCase().replace(/[^a-z0-9]/g, ""),
    )
    .replace("{userid}", member.id)
    .replace("{number}", String(ticketNumber).padStart(4, "0"))
    .replace(
      "{category}",
      (category?.name || "ticket").toLowerCase().replace(/[^a-z0-9]/g, ""),
    )
    .slice(0, 100);
}

async function handleOpenButton(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  if (!config)
    return interaction.reply({
      content: "❌ Ticket system is not configured yet.",
      ephemeral: true,
    });

  // Check max open tickets
  const openCount = await Ticket.countDocuments({
    guildId: interaction.guildId,
    creatorId: interaction.user.id,
    status: "open",
  });
  if (openCount >= config.behavior.maxOpenTickets) {
    return interaction.reply({
      content: `❌ You already have ${openCount} open ticket(s). Maximum is **${config.behavior.maxOpenTickets}**.`,
      ephemeral: true,
    });
  }

  if (!config.categories.length) {
    return openTicketFlow(interaction, config, null);
  }

  if (config.categories.length === 1) {
    return openTicketFlow(interaction, config, config.categories[0]);
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket:category")
    .setPlaceholder("Choose a category...")
    .addOptions(
      config.categories.map((c) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.name)
          .setValue(c.id)
          .setEmoji(c.emoji)
          .setDescription(c.description || ""),
      ),
    );

  await interaction.reply({
    content: `${emojis.ticket} Please select a category for your ticket:`,
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true,
  });
}

async function handleCategorySelect(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const category = config?.categories.find(
    (c) => c.id === interaction.values[0],
  );
  if (!category)
    return interaction.update({
      content: "❌ Category not found.",
      components: [],
    });
  await interaction.deferUpdate();
  await openTicketFlow(interaction, config, category);
}

async function openTicketFlow(interaction, config, category) {
  if (category?.questions?.length) {
    const modal = new ModalBuilder()
      .setCustomId(`ticket:questions:${category.id}`)
      .setTitle(category.name);

    for (const q of category.questions.slice(0, 5)) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`q_${category.questions.indexOf(q)}`)
            .setLabel(q.label)
            .setPlaceholder(q.placeholder || "")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(q.required ?? true),
        ),
      );
    }

    if (interaction.deferred || interaction.replied) {
      // Can't show modal after deferUpdate; use followUp workaround — re-prompt via reply
      await interaction.followUp({
        content: `${emojis.ticket} Opening your ticket in a moment...`,
        ephemeral: true,
      });
      return createTicketChannel(interaction, config, category, []);
    }
    return interaction.showModal(modal);
  }

  return createTicketChannel(interaction, config, category, []);
}

async function handleQuestionsModal(interaction, categoryId) {
  await interaction.deferReply({ ephemeral: true });
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const category = config?.categories.find((c) => c.id === categoryId);

  const answers =
    category?.questions.map((q, i) => ({
      question: q.label,
      answer: interaction.fields.getTextInputValue(`q_${i}`) || "",
    })) || [];

  await createTicketChannel(interaction, config, category, answers);
}

async function createTicketChannel(interaction, config, category, answers) {
  const guild = interaction.guild;
  const member = interaction.member;

  config.ticketCounter = (config.ticketCounter || 0) + 1;
  const ticketNumber = config.ticketCounter;
  await GuildConfig.updateOne(
    { guildId: guild.id },
    { $inc: { ticketCounter: 1 } },
  );

  const channelName = formatChannelName(
    config.behavior.namingFormat || "ticket-{username}",
    member,
    ticketNumber,
    category,
  );

  const permOverwrites = [
    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    {
      id: member.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageMessages,
      ],
    },
  ];

  for (const roleId of config.staff.supportRoleIds) {
    permOverwrites.push({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    parent: config.channels.ticketCategoryId || null,
    permissionOverwrites: permOverwrites,
  });

  const ticket = await Ticket.create({
    guildId: guild.id,
    channelId: channel.id,
    ticketNumber,
    categoryId: category?.id || null,
    categoryName: category?.name || "",
    creatorId: member.id,
    answers,
  });

  await scheduleAutoClose(ticket, config);
  await ticket.save();

  // Assign ticket open role if configured
  if (config.staff.ticketOpenRoleId) {
    await member.roles.add(config.staff.ticketOpenRoleId).catch(() => {});
  }

  // Build ping string
  const pings = [
    ...config.staff.pingRoleIds.map((id) => `<@&${id}>`),
    ...config.staff.pingUserIds.map((id) => `<@${id}>`),
  ].join(" ");

  const openMsg = await channel.send({
    content:
      `${pings ? pings + "\n" : ""}<@${member.id}> has opened a ticket.`.trim(),
  });

  await sendControlPanel(channel, ticket, config);

  const replyContent = `${emojis.success} Your ticket has been created: <#${channel.id}>`;
  if (interaction.deferred || interaction.replied) {
    await interaction
      .editReply({ content: replyContent, components: [] })
      .catch(() =>
        interaction
          .followUp({ content: replyContent, ephemeral: true })
          .catch(() => {}),
      );
  } else {
    await interaction
      .reply({ content: replyContent, ephemeral: true })
      .catch(() => {});
  }
}

module.exports = {
  handleOpenButton,
  handleCategorySelect,
  handleQuestionsModal,
};
