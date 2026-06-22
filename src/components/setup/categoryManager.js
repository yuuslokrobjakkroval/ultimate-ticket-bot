const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
} = require('discord.js');
const { randomUUID } = require('crypto');
const GuildConfig = require('../../models/GuildConfig');
const emojis = require('../../../emojis.json');

function buildCategoryListEmbed(config) {
  const cats = config.categories;
  return new EmbedBuilder()
    .setTitle(`${emojis.categories} Category Manager`)
    .setDescription(
      cats.length
        ? cats.map((c, i) => `**${i + 1}.** ${c.emoji} **${c.name}**\n> ${c.description || 'No description'} · ${c.questions.length} question(s)`).join('\n\n')
        : '> No categories yet. Add one below.',
    )
    .setColor('#5865F2')
    .setFooter({ text: `${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}` });
}

function buildCategoryListRows(config) {
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setup:categories:add').setLabel('Add Category').setEmoji(emojis.add).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup:main').setLabel('Back').setEmoji(emojis.back).setStyle(ButtonStyle.Secondary),
    ),
  ];

  if (config.categories.length > 0) {
    const editSelect = new StringSelectMenuBuilder()
      .setCustomId('setup:categories:edit:select')
      .setPlaceholder('Select a category to edit...')
      .addOptions(config.categories.map(c =>
        new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id).setEmoji(c.emoji),
      ));

    const deleteSelect = new StringSelectMenuBuilder()
      .setCustomId('setup:categories:delete:select')
      .setPlaceholder('Select a category to delete...')
      .addOptions(config.categories.map(c =>
        new StringSelectMenuOptionBuilder().setLabel(c.name).setValue(c.id).setEmoji(c.emoji),
      ));

    rows.unshift(
      new ActionRowBuilder().addComponents(editSelect),
      new ActionRowBuilder().addComponents(deleteSelect),
    );
  }

  return rows;
}

async function showCategoryList(interaction, config) {
  if (!config) config = await GuildConfig.findOne({ guildId: interaction.guildId });
  await interaction.update({
    embeds: [buildCategoryListEmbed(config)],
    components: buildCategoryListRows(config),
  });
}

async function openAddCategoryModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('setup:categories:save:new')
    .setTitle('Add New Category')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Category Name').setStyle(TextInputStyle.Short)
          .setMaxLength(50).setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('emoji').setLabel('Emoji (default or custom)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setValue('🎫').setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('description').setLabel('Description (shown in select menu)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('q1').setLabel('Question 1 (leave blank for none)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('q2').setLabel('Question 2 (leave blank for none)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setRequired(false),
      ),
    );
  await interaction.showModal(modal);
}

async function openEditCategoryModal(interaction, categoryId) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const cat = config.categories.find(c => c.id === categoryId);
  if (!cat) return interaction.reply({ content: '❌ Category not found.', ephemeral: true });

  const modal = new ModalBuilder()
    .setCustomId(`setup:categories:save:${categoryId}`)
    .setTitle(`Edit: ${cat.name}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Category Name').setStyle(TextInputStyle.Short)
          .setMaxLength(50).setValue(cat.name).setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('emoji').setLabel('Emoji').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setValue(cat.emoji || '🎫').setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setValue(cat.description || '').setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('q1').setLabel('Question 1 (leave blank to remove)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setValue(cat.questions[0]?.label || '').setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('q2').setLabel('Question 2 (leave blank to remove)').setStyle(TextInputStyle.Short)
          .setMaxLength(100).setValue(cat.questions[1]?.label || '').setRequired(false),
      ),
    );
  await interaction.showModal(modal);
}

async function saveCategoryModal(interaction, categoryId) {
  await interaction.deferUpdate();
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });

  const name = interaction.fields.getTextInputValue('name');
  const emoji = interaction.fields.getTextInputValue('emoji') || '🎫';
  const description = interaction.fields.getTextInputValue('description') || '';
  const q1 = interaction.fields.getTextInputValue('q1');
  const q2 = interaction.fields.getTextInputValue('q2');

  const questions = [];
  if (q1) questions.push({ label: q1, placeholder: '', required: true });
  if (q2) questions.push({ label: q2, placeholder: '', required: false });

  if (categoryId === 'new') {
    config.categories.push({ id: randomUUID(), name, emoji, description, questions });
  } else {
    const idx = config.categories.findIndex(c => c.id === categoryId);
    if (idx !== -1) {
      config.categories[idx] = { ...config.categories[idx].toObject(), name, emoji, description, questions };
    }
  }

  await config.save();
  await showCategoryList(interaction, config);
}

async function confirmDeleteCategory(interaction, categoryId) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  const cat = config.categories.find(c => c.id === categoryId);
  if (!cat) return interaction.update({ content: '❌ Category not found.', components: [] });

  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${emojis.delete} Delete Category`)
        .setDescription(`Are you sure you want to delete **${cat.emoji} ${cat.name}**?\n\nThis cannot be undone.`)
        .setColor('#ED4245'),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`setup:categories:delete:confirm:${categoryId}`).setLabel('Delete').setEmoji(emojis.delete).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('setup:categories').setLabel('Cancel').setEmoji(emojis.cancel).setStyle(ButtonStyle.Secondary),
      ),
    ],
  });
}

async function deleteCategory(interaction, categoryId) {
  const config = await GuildConfig.findOne({ guildId: interaction.guildId });
  config.categories = config.categories.filter(c => c.id !== categoryId);
  await config.save();
  await showCategoryList(interaction, config);
}

module.exports = {
  showCategoryList,
  openAddCategoryModal,
  openEditCategoryModal,
  saveCategoryModal,
  confirmDeleteCategory,
  deleteCategory,
};
