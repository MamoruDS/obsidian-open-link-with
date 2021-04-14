import {
    App,
    DropdownComponent,
    Modal,
    Plugin,
    PluginSettingTab,
    Setting,
} from 'obsidian'
import { openWith, OpenOptions } from './open'

interface PluginSettings {
    current: string
    profiles: Record<string, OpenOptions>
}

const DEFAULT_SETTINGS: PluginSettings = {
    current: 'default',
    profiles: {},
}

export default class MyPlugin extends Plugin {
    settings: PluginSettings

    async onload() {
        await this.loadSettings()
        this.addSettingTab(new SettingTab(this.app, this))
        this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            const ele = evt.target as Element
            if (ele.className == 'external-link') {
                const url = ele.getAttribute('href')
                const cur = this.settings.current
                if (cur != 'default') {
                    evt.preventDefault()
                    openWith(url, this.settings.profiles[cur])
                }
            }
        })
        this.registerInterval(
            window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)
        )
    }

    onunload() {
        //
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

        let profileSelector: DropdownComponent

        new Setting(containerEl)
            .setName('Browser')
            .setDesc('Open external link with...')
            .addDropdown((dd) => {
                const cur = this.plugin.settings.current
                const items: string[] = []
                let _match = false
                for (const p of Object.keys(this.plugin.settings.profiles)) {
                    if (p == cur) {
                        _match = true
                        items.unshift(p)
                    } else {
                        items.push(p)
                    }
                }
                if (!_match) {
                    items.unshift('default')
                } else {
                    items.push('default')
                }
                items.forEach((i) => dd.addOption(i, i))
                dd.onChange(async (p) => {
                    this.plugin.settings.current = p
                    await this.plugin.saveSettings()
                })
            })

        new Setting(containerEl)
            .setName('Profiles')
            .setDesc('Profiles in JSON')
            .addText((text) =>
                text
                    .setPlaceholder('{}')
                    .setValue(
                        JSON.stringify(this.plugin.settings.profiles, null, 4)
                    )
                    .onChange(async (v) => {
                        const ck = Math.floor(Math.random() * 100000).toString(
                            16
                        )
                        this._check = ck
                        setTimeout(async () => {
                            if (this._check == ck) {
                                let profiles: Record<string, OpenOptions> = {}
                                try {
                                    profiles = JSON.parse(v)
                                    this.plugin.settings.profiles = profiles
                                    await this.plugin.saveSettings()
                                    this._render()
                                } catch (e) {
                                    this.panic('JSON parse failed')
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
