const GuildConfig = require('../models/GuildConfig');

async function isStaff(member, guildId) {
  if (member.permissions.has('ManageGuild')) return true;
  const config = await GuildConfig.findOne({ guildId });
  if (!config) return false;
  return config.staff.supportRoleIds.some(roleId => member.roles.cache.has(roleId));
}

async function requireStaff(interaction) {
  const ok = await isStaff(interaction.member, interaction.guildId);
  if (!ok) {
    await interaction.reply({ content: '❌ You need a support role to do that.', ephemeral: true });
    return false;
  }
  return true;
}

module.exports = { isStaff, requireStaff };
