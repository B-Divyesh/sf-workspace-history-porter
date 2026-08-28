import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  manifest: {
    name: 'Workspace History Porter',
    description: 'Carry an encrypted workspace task index between browsers.',
    version: '1.0.1',
    permissions: ['storage', 'activeTab', 'permissions'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    host_permissions: ['http://127.0.0.1:43821/*', 'https://pilot-api.sociobot.in/*'],
    action: { default_title: 'Open Workspace History Porter' },
    options_ui: { page: 'options.html', open_in_tab: true },
    commands: {
      '_execute_action': {
        suggested_key: { default: 'Alt+Shift+P', mac: 'Alt+Shift+P' },
        description: 'Open Porter'
      }
    }
  }
});
