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
const emojis = require("../../../emojis.json");

function toggle(val) {
  return val ? "🟢 ON" : "🔴 OFF";
}

function buildBehaviorEmbed(config) {
  const b = config.behavior;
  return new EmbedBuilder()
    .setTitle(`${emojis.behavior} Behavior Settings`)
    .setDescription("Toggle features and configure ticket behavior.")
    .setColor("#5865F2")
    .addFields(
      {
        name: `${emojis.claim} Claiming`,
        value: toggle(b.claimingEnabled),
        inline: true,
      },
      {
        name: `${emojis.feedback} Feedback`,
        value: toggle(b.feedbackEnabled),
        inline: true,
      },
      {
        name: `${emojis.autoclose} Auto-Close`,
        value: `${toggle(b.autoCloseEnabled)}${b.autoCloseEnabled ? ` (${b.autoCloseHours}h)` : ""}`,
        inline: true,
      },
      {
        name: "🗑️ Delete on Close",
        value: `${toggle(b.deleteOnClose)} *(off = archive)*`,
        inline: true,
      },
      {
        name: `${emojis.lock} Lock on Close`,
        value: toggle(b.lockOnClose),
        inline: true,
      },
      {
        name: "🎫 Max Open Tickets/User",
        value: `\`${b.maxOpenTickets}\``,
        inline: true,
      },
      {
        name: "📝 Channel Naming Format",
        value: `\`${b.namingFormat}\`\n*(tokens: {username}, {userid}, {number}, {category})*`,
        inline: false,
      },
    );
}

function buildBehaviorRows(config) {
  const b = config.behavior;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:behavior:toggle:claiming")
        .setLabel("Claiming")
        .setEmoji(emojis.claim)
        .setStyle(
          b.claimingEnabled ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
      new ButtonBuilder()
        .setCustomId("setup:behavior:toggle:feedback")
        .setLabel("Feedback")
        .setEmoji(emojis.feedback)
        .setStyle(
          b.feedbackEnabled ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
      new ButtonBuilder()
        .setCustomId("setup:behavior:toggle:autoclose")
        .setLabel("Auto-Close")
        .setEmoji(emojis.autoclose)
        .setStyle(
          b.autoCloseEnabled ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
      new ButtonBuilder()
        .setCustomId("setup:behavior:toggle:delete")
        .setLabel("Delete on Close")
        .setEmoji("🗑️")
        .setStyle(b.deleteOnClose ? ButtonStyle.Danger : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("setup:behavior:toggle:lock")
        .setLabel("Lock on Close")
        .setEmoji(emojis.lock)
        .setStyle(b.lockOnClose ? ButtonStyle.Success : ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("setup:behavior:modal:autoclose")
        .setLabel("Set Auto-Close Hours")
        .setEmoji("⏱️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup:behavior:modal:maxtickets")
        .setLabel("Set Max Tickets")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup:behavior:modal:naming")
        .setLabel("Set Naming Format")
        .setEmoji("📝")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup:main")
        .setLabel("Back")
        .setEmoji(emojis.back)
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

async function showBehaviorSettings(interaction, config) {
  if (!config)
    config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const payload = {
    embeds: [buildBehaviorEmbed(config)],
    components: buildBehaviorRows(config),
  };
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
  } else {
    await interaction.update(payload);
  }
}

async function toggleBehavior(interaction, setting) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const map = {
    claiming: "claimingEnabled",
    feedback: "feedbackEnabled",
    autoclose: "autoCloseEnabled",
    delete: "deleteOnClose",
    lock: "lockOnClose",
  };
  const key = map[setting];
  if (key) config.behavior[key] = !config.behavior[key];
  await config.save();
  await showBehaviorSettings(interaction, config);
}

async function openBehaviorModal(interaction, sub) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const b = config.behavior;

  if (sub === "autoclose") {
    const modal = new ModalBuilder()
      .setCustomId("setup:behavior:save:autoclose")
      .setTitle("Auto-Close Hours")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("hours")
            .setLabel("Hours of inactivity before auto-close")
            .setStyle(TextInputStyle.Short)
            .setValue(String(b.autoCloseHours))
            .setRequired(true),
        ),
      );
    return interaction.showModal(modal);
  }

  if (sub === "maxtickets") {
    const modal = new ModalBuilder()
      .setCustomId("setup:behavior:save:maxtickets")
      .setTitle("Max Open Tickets Per User")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("max")
            .setLabel("Max open tickets per user (1–20)")
            .setStyle(TextInputStyle.Short)
            .setValue(String(b.maxOpenTickets))
            .setRequired(true),
        ),
      );
    return interaction.showModal(modal);
  }

  if (sub === "naming") {
    const modal = new ModalBuilder()
      .setCustomId("setup:behavior:save:naming")
      .setTitle("Channel Naming Format")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("format")
            .setLabel("Format: {username} {userid} {number} {category}")
            .setStyle(TextInputStyle.Short)
            .setValue(b.namingFormat)
            .setRequired(true),
        ),
      );
    return interaction.showModal(modal);
  }
}

async function saveBehaviorModal(interaction, sub) {
  await interaction.deferUpdate();
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  if (sub === "autoclose") {
    const hours = parseInt(interaction.fields.getTextInputValue("hours"), 10);
    if (!isNaN(hours) && hours > 0) config.behavior.autoCloseHours = hours;
  } else if (sub === "maxtickets") {
    const max = parseInt(interaction.fields.getTextInputValue("max"), 10);
    if (!isNaN(max) && max >= 1 && max <= 20)
      config.behavior.maxOpenTickets = max;
  } else if (sub === "naming") {
    config.behavior.namingFormat =
      interaction.fields.getTextInputValue("format");
  }

  await config.save();
  await showBehaviorSettings(interaction, config);
}

module.exports = {
  showBehaviorSettings,
  toggleBehavior,
  openBehaviorModal,
  saveBehaviorModal,
};
