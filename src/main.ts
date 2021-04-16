import {
    App,
    Modal,
    Plugin,
    PluginSettingTab,
    Setting,
} from 'obsidian'
import { DEFAULT_OPEN_WITH } from './constant'
import { openWith, getValidBrowser } from './open'

interface PluginSettings {
    selected: string
    profiles: Record<string, string[]>
}

const DEFAULT_SETTINGS: PluginSettings = {
    selected: DEFAULT_OPEN_WITH,
    profiles: {},
}

export default class MyPlugin extends Plugin {
    settings: PluginSettings
    presetProfiles: Record<string, string[]>
    get profiles(): Record<string, string[]> {
        return {
            ...this.presetProfiles,
            ...this.settings.profiles,
        }
    }
    async onload() {
        await this.loadSettings()
        this.presetProfiles = await getValidBrowser()
        this.addSettingTab(new SettingTab(this.app, this))
        this.registerDomEvent(
            document,
            'click',
            async (evt: MouseEvent) => {
                const ele = evt.target as Element
                if (ele.className == 'external-link') {
                    const url = ele.getAttribute('href')
                    const cur = this.settings.selected
                    if (cur != DEFAULT_OPEN_WITH) {
                        if (
                            await openWith(
                                url,
                                this.profiles[cur]
                            )
                        )
                            evt.preventDefault()
                    }
                }
            }
        )
    }
    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )
    }
    async saveSettings() {
        await this.saveData(this.settings)
    }
}

class PanicModal extends Modal {
    message: string
    constructor(app: App, message: string) {
        super(app)
        this.message = message
    }
    onOpen() {
        let { contentEl } = this
        contentEl.setText(this.message)
    }
    onClose() {
        let { contentEl } = this
        contentEl.empty()
    }
}

class SettingTab extends PluginSettingTab {
    plugin: MyPlugin
    _check: string
    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }
    panic(msg: string) {
        new PanicModal(this.app, msg).open()
    }
    _render() {
        let { containerEl } = this
        containerEl.empty()
        new Setting(containerEl)
            .setName('Browser')
            .setDesc('Open external link with...')
            .addDropdown((dd) => {
                const cur = this.plugin.settings.selected
                const items: string[] = []
                const profiles = this.plugin.profiles
                let _match = false
                for (const p of Object.keys(profiles)) {
                    if (p == cur) {
                        _match = true
                        items.unshift(p)
                    } else {
                        items.push(p)
                    }
                }
                if (!_match) {
                    items.unshift(DEFAULT_OPEN_WITH)
                } else {
                    items.push(DEFAULT_OPEN_WITH)
                }
                items.forEach((i) => dd.addOption(i, i))
                dd.onChange(async (p) => {
                    this.plugin.settings.selected = p
                    await this.plugin.saveSettings()
                })
            })
        new Setting(containerEl)
            .setName('Customization')
            .setDesc('Customization profiles in JSON')
            .addText((text) =>
                text
                    .setPlaceholder('{}')
                    .setValue(
                        JSON.stringify(
                            this.plugin.settings.profiles,
                            null,
                            4
                        )
                    )
                    .onChange(async (v) => {
                        const ck = Math.floor(
                            Math.random() * 100000
                        ).toString(16)
                        this._check = ck
                        setTimeout(async () => {
                            if (this._check == ck) {
                                let profiles: Record<
                                    string,
                                    string[]
                                > = {}
                                try {
                                    profiles = JSON.parse(v)
                                    this.plugin.settings.profiles = profiles
                                    await this.plugin.saveSettings()
                                    this._render()
                                } catch (e) {
                                    this.panic(
                                        e.message ??
                                            e.toString() ??
                                            'some error occurred in open-link-with'
                                    )
                                }
                            }
                        }, 1500)
                    })
            )
    }
    display(): void {
        this._render()
    }
}
