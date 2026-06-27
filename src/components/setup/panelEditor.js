const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");
const { showMainDashboard } = require("./mainDashboard");
const emojis = require("../../../emojis.json");

function buildPanelEditorEmbed(config) {
  const p = config.panel;
  return new EmbedBuilder()
    .setTitle(`${emojis.panel} Panel Editor`)
    .setDescription(
      "Customize how your ticket panel looks. Click **Edit** to change fields, then **Preview** to see the result.",
    )
    .setColor(p.color || "#5865F2")
    .addFields(
      { name: "Title", value: p.title || "*(not set)*", inline: true },
      { name: "Color", value: p.color || "#5865F2", inline: true },
      {
        name: "Button Label",
        value: p.buttonLabel || "Open Ticket",
        inline: true,
      },
      { name: "Button Emoji", value: p.buttonEmoji || "🎫", inline: true },
      { name: "Footer", value: p.footer || "*(none)*", inline: true },
      { name: "Author", value: p.author || "*(none)*", inline: true },
      {
        name: "Description",
        value: p.description || "*(not set)*",
        inline: false,
      },
      { name: "Thumbnail URL", value: p.thumbnail || "*(none)*", inline: true },
      { name: "Image URL", value: p.image || "*(none)*", inline: true },
    );
}

function buildPanelEditorRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:panel:modal:main")
        .setLabel("Edit Title & Description")
        .setEmoji(emojis.edit)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup:panel:modal:style")
        .setLabel("Edit Color & Button")
        .setEmoji("🎨")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup:panel:modal:extra")
        .setLabel("Edit Footer, Author & Images")
        .setEmoji("🖼️")
        .setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:panel:preview")
        .setLabel("Preview Panel")
        .setEmoji(emojis.preview)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("setup:main")
        .setLabel("Back")
        .setEmoji(emojis.back)
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function showPanelEditor(interaction, config) {
  if (!config)
    config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const embed = buildPanelEditorEmbed(config);
  const rows = buildPanelEditorRows();
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed], components: rows });
  } else {
    await interaction.update({ embeds: [embed], components: rows });
  }
}

async function openPanelModal(interaction, sub) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const p = config.panel;

  if (sub === "main") {
    const modal = new ModalBuilder()
      .setCustomId("setup:panel:save:main")
      .setTitle("Edit Panel Title & Description")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Panel Title")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setValue(p.title || "")
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Panel Description")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(4000)
            .setValue(p.description || "")
            .setRequired(false),
        ),
      );
    return interaction.showModal(modal);
  }

  if (sub === "style") {
    const modal = new ModalBuilder()
      .setCustomId("setup:panel:save:style")
      .setTitle("Edit Panel Color & Button")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Embed Color (hex, e.g. #5865F2)")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(7)
            .setValue(p.color || "#5865F2")
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("buttonLabel")
            .setLabel("Button Label")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(80)
            .setValue(p.buttonLabel || "Open Ticket")
            .setRequired(true),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("buttonEmoji")
            .setLabel("Button Emoji")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setValue(p.buttonEmoji || "🎫")
            .setRequired(false),
        ),
      );
    return interaction.showModal(modal);
  }

  if (sub === "extra") {
    const modal = new ModalBuilder()
      .setCustomId("setup:panel:save:extra")
      .setTitle("Edit Footer, Author & Images")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("footer")
            .setLabel("Footer Text")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2048)
            .setValue(p.footer || "")
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("author")
            .setLabel("Author Name")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setValue(p.author || "")
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("thumbnail")
            .setLabel("Thumbnail URL")
            .setStyle(TextInputStyle.Short)
            .setValue(p.thumbnail || "")
            .setRequired(false),
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("image")
            .setLabel("Large Image URL")
            .setStyle(TextInputStyle.Short)
            .setValue(p.image || "")
            .setRequired(false),
        ),
      );
    return interaction.showModal(modal);
  }
}

async function savePanelModal(interaction, sub) {
  await interaction.deferUpdate();
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  if (sub === "main") {
    config.panel.title = interaction.fields.getTextInputValue("title");
    config.panel.description =
      interaction.fields.getTextInputValue("description");
  } else if (sub === "style") {
    const color = interaction.fields.getTextInputValue("color");
    config.panel.color = /^#[0-9A-Fa-f]{6}$/.test(color)
      ? color
      : config.panel.color;
    config.panel.buttonLabel =
      interaction.fields.getTextInputValue("buttonLabel");
    config.panel.buttonEmoji =
      interaction.fields.getTextInputValue("buttonEmoji");
  } else if (sub === "extra") {
    config.panel.footer = interaction.fields.getTextInputValue("footer");
    config.panel.author = interaction.fields.getTextInputValue("author");
    config.panel.thumbnail = interaction.fields.getTextInputValue("thumbnail");
    config.panel.image = interaction.fields.getTextInputValue("image");
  }

  await config.save();
  await showPanelEditor(interaction, config);
}

async function showPanelPreview(interaction) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const p = config.panel;

  const preview = new EmbedBuilder()
    .setTitle(p.title || "Support Tickets")
    .setDescription(
      p.description || "Click the button below to open a support ticket.",
    )
    .setColor(p.color || "#5865F2");

  if (p.footer)
    preview.setFooter({ text: p.footer, iconURL: p.footerIcon || undefined });
  if (p.author)
    preview.setAuthor({ name: p.author, iconURL: p.authorIcon || undefined });
  if (p.thumbnail) preview.setThumbnail(p.thumbnail);
  if (p.image) preview.setImage(p.image);

  const {
    ActionRowBuilder: AR,
    ButtonBuilder: BB,
    ButtonStyle: BS,
  } = require("discord.js");
  const previewRow = new AR().addComponents(
    new BB()
      .setCustomId("ticket:open")
      .setLabel(p.buttonLabel || "Open Ticket")
      .setEmoji(p.buttonEmoji || "🎫")
      .setStyle(BS.Primary)
      .setDisabled(true),
  );
  const backRow = new AR().addComponents(
    new BB()
      .setCustomId("setup:panel")
      .setLabel("Back to Editor")
      .setEmoji(emojis.back)
      .setStyle(BS.Secondary),
  );

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setDescription(
          "**Panel Preview** — this is exactly how it will look when deployed.",
        )
        .setColor("#2B2D31"),
      preview,
    ],
    components: [previewRow, backRow],
  });
}

module.exports = {
  showPanelEditor,
  openPanelModal,
  savePanelModal,
  showPanelPreview,
};
