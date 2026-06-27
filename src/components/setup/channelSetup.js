const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const emojis = require("../../../emojis.json");

function channelMention(id) {
  return id ? `<#${id}>` : "*(not set)*";
}

function buildChannelEmbedPage1(config) {
  const c = config.channels;
  return new EmbedBuilder()
    .setTitle(`${emojis.channels} Channel Setup (1/2)`)
    .setDescription(
      "Select the channels for each purpose using the menus below.",
    )
    .setColor("#5865F2")
    .addFields(
      {
        name: "📋 Panel Channel",
        value: channelMention(c.panelChannelId),
        inline: true,
      },
      {
        name: "📂 Ticket Category",
        value: channelMention(c.ticketCategoryId),
        inline: true,
      },
      {
        name: "🗄️ Archive Category",
        value: channelMention(c.archiveCategoryId),
        inline: true,
      },
      {
        name: "📜 Transcript / Logs",
        value: channelMention(c.logsChannelId),
        inline: true,
      },
    );
}

function buildChannelEmbedPage2(config) {
  const c = config.channels;
  return new EmbedBuilder()
    .setTitle(`${emojis.channels} Channel Setup (2/2)`)
    .setDescription("Select the feedback channels using the menus below.")
    .setColor("#5865F2")
    .addFields(
      {
        name: "⭐ Feedback Channel",
        value: channelMention(c.feedbackChannelId),
        inline: true,
      },
      {
        name: "📋 Feedback Log Channel",
        value: channelMention(c.feedbackLogChannelId),
        inline: true,
      },
    );
}

function buildPage1Rows() {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:panel")
        .setPlaceholder("Select panel channel (text channel)")
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:ticketcat")
        .setPlaceholder("Select ticket category")
        .addChannelTypes(ChannelType.GuildCategory),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:archivecat")
        .setPlaceholder("Select archive category")
        .addChannelTypes(ChannelType.GuildCategory),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:logs")
        .setPlaceholder("Select transcript/logs channel (text channel)")
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:main")
        .setLabel("Back")
        .setEmoji(emojis.back)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("setup:channels:page:2")
        .setLabel("Feedback Channels")
        .setEmoji("⭐")
        .setStyle(ButtonStyle.Primary),
    ),
  ];
}

function buildPage2Rows() {
  return [
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:feedback")
        .setPlaceholder("Select feedback channel (text channel)")
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup:channels:feedbacklog")
        .setPlaceholder("Select feedback log channel (text channel)")
        .addChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:channels:page:1")
        .setLabel("Back")
        .setEmoji(emojis.back)
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function showChannelSetup(interaction, config, page = 1) {
  if (!config)
    config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const embed =
    page === 2
      ? buildChannelEmbedPage2(config)
      : buildChannelEmbedPage1(config);
  const rows = page === 2 ? buildPage2Rows() : buildPage1Rows();
  await interaction.update({ embeds: [embed], components: rows });
}

async function handleChannelSelect(interaction, field) {
  const channelId = interaction.values[0];
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  const fieldMap = {
    panel: "panelChannelId",
    ticketcat: "ticketCategoryId",
    archivecat: "archiveCategoryId",
    logs: "logsChannelId",
    feedback: "feedbackChannelId",
    feedbacklog: "feedbackLogChannelId",
  };

  const key = fieldMap[field];
  if (key) {
    config.channels[key] = channelId;
    await config.save();
  }

  // Determine which page we're on based on the field
  const page = ["feedback", "feedbacklog"].includes(field) ? 2 : 1;
  await showChannelSetup(interaction, config, page);
}

module.exports = { showChannelSetup, handleChannelSelect };
