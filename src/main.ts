import {
    App,
    debounce,
    Debouncer,
    Modal,
    Plugin,
    PluginSettingTab,
    Setting,
} from 'obsidian'
import { DEFAULT_OPEN_WITH } from './constant'
import { openWith, getValidBrowser } from './open'
import { log } from './utils'

interface PluginSettings {
    selected: string
    custom: Record<string, string[]>
    enableLog: boolean
    timeout: number
}

const DEFAULT_SETTINGS: PluginSettings = {
    selected: DEFAULT_OPEN_WITH,
    custom: {},
    enableLog: false,
    timeout: 500,
}

export default class OpenLinkPlugin extends Plugin {
    settings: PluginSettings
    presetProfiles: Record<string, string[]>
    get profiles(): Record<string, string[]> {
        return {
            ...this.presetProfiles,
            ...this.settings.custom,
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
                if (ele.className === 'fake-external-link') {
                    const url = ele.getAttribute('href')
                    const cur = this.settings.selected
                    if (cur !== DEFAULT_OPEN_WITH) {
                        evt.preventDefault()
                        const code = await openWith(
                            url,
                            this.profiles[cur],
                            {
                                enableLog:
                                    this.settings.enableLog,
                                timeout:
                                    this.settings.timeout,
                            }
                        )
                        if (code !== 0) {
                            if (this.settings.enableLog) {
                                log(
                                    'error',
                                    'failed to open',
                                    `'spawn' exited with code ${code} when ` +
                                        `trying to open an external link with ${cur}.`
                                )
                            }
                            open(url)
                        }
                    }
                }
            }
        )
        eval(`
            window._open = window.open
            window.open = (e, t, n) => {
                let isExternalLink = false
                try {
                    if (
                        ['http:', 'https:'].indexOf(
                            new URL(e).protocol
                        ) != -1
                    ) {
                        isExternalLink = true
                    }
                } catch (TypeError) {}
                if (isExternalLink) {
                    const url = e
                    const fakeID = 'fake_extlink'
                    let fake = document.getElementById(fakeID)
                    if (fake == null) {
                        fake = document.createElement('span')
                        fake.classList.add('fake-external-link')
                        fake.setAttribute('id', fakeID)
                        document.body.append(fake)
                    }
                    fake.setAttr('href', url)
                    fake.click()
                } else {
                    window._open(e, t, n)
                }
            }  
        `)
    }
    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        )
    }
    async saveSettings() {
        if (this.settings.enableLog) {
            log('info', 'saving settings', this.settings)
        }
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
    plugin: OpenLinkPlugin
    _profileChangeHandler: Debouncer<string[]>
    _timeoutChangeHandler: Debouncer<string[]>
    constructor(app: App, plugin: OpenLinkPlugin) {
        super(app, plugin)
        this.plugin = plugin
        this._profileChangeHandler = debounce(
            async (val) => {
                try {
                    const profiles = JSON.parse(val)
                    this.plugin.settings.custom = profiles
                    await this.plugin.saveSettings()
                    this._render()
                } catch (e) {
                    this.panic(
                        e.message ??
                            e.toString() ??
                            'some error occurred in open-link-with'
                    )
                }
            },
            1500,
            true
        )
        this._timeoutChangeHandler = debounce(
            async (val) => {
                const timeout = parseInt(val)
                if (Number.isNaN(timeout)) {
                    this.panic(
                        'Value of timeout should be interger.'
                    )
                } else {
                    this.plugin.settings.timeout = timeout
                    await this.plugin.saveSettings()
                    this._render()
                }
            },
            1500,
            true
        )
    }
    panic(msg: string) {
        new PanicModal(this.app, msg).open()
    }
    _render() {
        let { containerEl } = this
        containerEl.empty()
        new Setting(containerEl)
            .setName('Browser')
            .setDesc(
                'Open external link with selected browser.'
            )
            .addDropdown((dd) => {
                const cur = this.plugin.settings.selected
                const items: string[] = []
                const profiles = this.plugin.profiles
                let _match = false
                for (const p of Object.keys(profiles)) {
                    if (p === cur) {
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
            .setDesc('Customization profiles in JSON.')
            .addText((text) =>
                text
                    .setPlaceholder('{}')
                    .setValue(
                        JSON.stringify(
                            this.plugin.settings.custom,
                            null,
                            4
                        )
                    )
                    .onChange(this._profileChangeHandler)
            )
        new Setting(containerEl)
            .setName('Logs')
            .setDesc(
                'Display logs in console (open developer tools to view).'
            )
            .addToggle((toggle) => {
                toggle
                    .setValue(
                        this.plugin.settings.enableLog
                    )
                    .onChange((val) => {
                        this.plugin.settings.enableLog = val
                        this.plugin.saveSettings()
                        this._render()
                    })
            })
        new Setting(containerEl)
            .setName('Timeout')
            .addText((text) =>
                text
                    .setPlaceholder('500')
                    .setValue(
                        this.plugin.settings.timeout.toString()
                    )
                    .onChange(this._timeoutChangeHandler)
            )
    }
    display(): void {
        this._render()
    }
}
