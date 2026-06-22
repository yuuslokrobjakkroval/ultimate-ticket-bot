const { showMainDashboard } = require('./mainDashboard');
const { showPanelEditor, openPanelModal, savePanelModal, showPanelPreview } = require('./panelEditor');
const { showChannelSetup, handleChannelSelect } = require('./channelSetup');
const { showCategoryList, openAddCategoryModal, openEditCategoryModal, saveCategoryModal, confirmDeleteCategory, deleteCategory } = require('./categoryManager');
const { showStaffSetup, handleStaffSelect } = require('./staffSetup');
const { showBehaviorSettings, toggleBehavior, openBehaviorModal, saveBehaviorModal } = require('./behaviorSettings');
const { deployPanel } = require('./deployPanel');

async function handle(interaction, parts) {
  const [action, sub, extra, id] = parts;

  // Main
  if (action === 'main') return showMainDashboard(interaction);

  // Panel
  if (action === 'panel') {
    if (!sub) return showPanelEditor(interaction);
    if (sub === 'modal') return openPanelModal(interaction, extra);
    if (sub === 'save') return savePanelModal(interaction, extra);
    if (sub === 'preview') return showPanelPreview(interaction);
  }

  // Channels
  if (action === 'channels') {
    if (!sub) return showChannelSetup(interaction);
    return handleChannelSelect(interaction, sub);
  }

  // Categories
  if (action === 'categories') {
    if (!sub) return showCategoryList(interaction);
    if (sub === 'add') return openAddCategoryModal(interaction);
    if (sub === 'save') return saveCategoryModal(interaction, extra); // extra = 'new' or categoryId
    if (sub === 'edit') {
      if (extra === 'select') return openEditCategoryModal(interaction, interaction.values[0]);
    }
    if (sub === 'delete') {
      if (extra === 'select') return confirmDeleteCategory(interaction, interaction.values[0]);
      if (extra === 'confirm') return deleteCategory(interaction, id);
    }
  }

  // Staff
  if (action === 'staff') {
    if (!sub) return showStaffSetup(interaction);
    return handleStaffSelect(interaction, sub);
  }

  // Behavior
  if (action === 'behavior') {
    if (!sub) return showBehaviorSettings(interaction);
    if (sub === 'toggle') return toggleBehavior(interaction, extra);
    if (sub === 'modal') return openBehaviorModal(interaction, extra);
    if (sub === 'save') return saveBehaviorModal(interaction, extra);
  }

  // Deploy
  if (action === 'deploy') return deployPanel(interaction);
}

module.exports = { handle };
