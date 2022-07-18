import {
    App,
    debounce,
    Debouncer,
    Modal,
    Plugin,
    PluginSettingTab,
    Setting,
} from 'obsidian'
import {
    BROWSER_SYSTEM,
    BROWSER_GLOBAL,
    BROWSER_IN_APP,
    BROWSER_IN_APP_LAST,
    MODIFIER_TEXT,
    MODIFIER_TEXT_FALLBACK,
} from './constant'
import { openWith, getValidBrowser } from './open'
import {
    Clickable,
    Modifier,
    ModifierBinding,
    MouseButton,
    Optional,
    Platform,
    ProfileDisplay,
    ValidModifier,
} from './types'
import {
    genRandomStr,
    getModifiersFromMouseEvt,
    getPlatform,
    getValidHttpURL,
    getValidModifiers,
    globalWindowFunc,
    intersection,
    log,
} from './utils'
import { ViewMgr, ViewMode, ViewRec } from './view'

interface PluginSettings {
    selected: string
    custom: Record<string, string[]>
    modifierBindings: ModifierBinding[]
    enableLog: boolean
    timeout: number
    inAppViewRec: ViewRec[]
}

const DEFAULT_SETTINGS: PluginSettings = {
    selected: BROWSER_SYSTEM.val,
    custom: {},
    modifierBindings: [],
    enableLog: false,
    timeout: 500,
    inAppViewRec: [],
}

export default class OpenLinkPlugin extends Plugin {
    settings: PluginSettings
    presetProfiles: Record<string, string[]>
    _viewmgr: ViewMgr
    get profiles(): Record<string, string[]> {
        return {
            ...this.presetProfiles,
            ...this.settings.custom,
        }
    }
    async onload() {
        this._viewmgr = new ViewMgr(this)
        await this.loadSettings()
        const extLinkClick = async (
            evt: MouseEvent,
            validClassName: string,
            options: {
                allowedButton?: MouseButton
            } = {}
        ): Promise<void> => {
            const el = evt.target as Element
            if (el.classList.contains(validClassName)) {
                const {
                    button,
                    altKey,
                    ctrlKey,
                    metaKey,
                    shiftKey,
                } = evt
                let modifier: ValidModifier = 'none'
                if (altKey) {
                    modifier = 'alt'
                } else if (ctrlKey) {
                    modifier = 'ctrl'
                } else if (metaKey) {
                    modifier = 'meta'
                } else if (shiftKey) {
                    modifier = 'shift'
                }
                const url = el.getAttr('href')
                const profileName =
                    this.settings.modifierBindings.find(
                        (mb) => {
                            if (
                                mb.auxClickOnly &&
                                button !=
                                    MouseButton.Auxiliary
                            ) {
                                return false
                            } else {
                                return (
                                    mb.modifier === modifier
                                )
                            }
                        }
                    )?.browser ?? this.settings.selected
                const popupWindow =
                    el.getAttr('target') === '_blank'
                        ? true
                        : false
                const cmd = this.getOpenCMD(profileName)
                if (this.settings.enableLog) {
                    log(
                        'info',
                        'external link clicked...',
                        {
                            click: {
                                button,
                                altKey,
                                ctrlKey,
                                metaKey,
                                shiftKey,
                            },
                            modifier,
                            mouseEvent: evt,
                            url,
                            profileName,
                            popupWindow,
                            cmd,
                        }
                    )
                }
                // right click trigger (windows only)
                if (
                    typeof options.allowedButton !=
                        'undefined' &&
                    button != options.allowedButton
                ) {
                    return
                }
                // in-app view
                if (profileName === BROWSER_IN_APP.val) {
                    this._viewmgr.createView(
                        url,
                        ViewMode.NEW,
                        {
                            popupWindow,
                        }
                    )
                    return
                }
                if (
                    profileName === BROWSER_IN_APP_LAST.val
                ) {
                    this._viewmgr.createView(
                        url,
                        ViewMode.LAST
                    )
                    return
                }
                if (typeof cmd !== 'undefined') {
                    evt.preventDefault()
                    const code = await openWith(url, cmd, {
                        enableLog: this.settings.enableLog,
                        timeout: this.settings.timeout,
                    })
                    if (code !== 0) {
                        if (this.settings.enableLog) {
                            log(
                                'error',
                                'failed to open',
                                `'spawn' exited with code ${code} when ` +
                                    `trying to open an external link with ${profileName}.`
                            )
                        }
                        open(url)
                    }
                }
            }
        }
        this.presetProfiles = await getValidBrowser()
        this.addSettingTab(new SettingTab(this.app, this))
        this.registerDomEvent(
            document,
            'click',
            (evt: MouseEvent) => {
                return extLinkClick(
                    evt,
                    'fake-external-link',
                    {
                        allowedButton: MouseButton.Main,
                    }
                )
            }
        )
        this.registerDomEvent(
            document,
            'auxclick',
            (evt: MouseEvent) => {
                return extLinkClick(evt, 'external-link', {
                    allowedButton: MouseButton.Auxiliary,
                })
            }
        )

        const winFunc = (win: Window) => {
            const doc = win.document
            const builtInOpen = win.open
            win.open = (url, target, features): Window => {
                const validURL = getValidHttpURL(url)
                if (validURL !== null) {
                    const fakeID = 'fake_extlink'
                    let fake = doc.getElementById(fakeID)
                    if (fake === null) {
                        fake = doc.createElement('span')
                        fake.classList.add(
                            'fake-external-link'
                        )
                        fake.setAttribute('id', fakeID)
                        doc.body.append(fake)
                    }
                    fake.setAttr('href', `${validURL}`)
                } else {
                    return builtInOpen(
                        url,
                        target,
                        features
                    )
                }
            }
            doc.addEventListener('click', (evt) => {
                const el = evt.target as Element
                const fakeId = 'fake_extlink'
                const modifiers =
                    getModifiersFromMouseEvt(evt)
                const clickable: Clickable = {
                    'external-link': {},
                    'clickable-icon': {
                        popout: true,
                    },
                    'cm-underline': {},
                    'cm-url': {
                        only_with: [Modifier.Meta],
                    },
                } // TODO: update this
                const validList = Object.keys(clickable)
                let is_clickable = false
                let popout = false
                el.classList.forEach((cls) => {
                    const _idx = validList.indexOf(cls)
                    if (_idx != -1) {
                        const clickOpt =
                            clickable[validList[_idx]]
                        // Clickable.only_with
                        if (
                            typeof clickOpt.only_with !==
                                'undefined' &&
                            intersection(
                                modifiers,
                                clickOpt.only_with
                            ).length === 0
                        ) {
                            return
                        }
                        // Clickable.popout
                        popout = clickOpt?.popout
                            ? true
                            : popout
                        is_clickable = true
                    }
                })
                if (is_clickable) {
                    const fake = doc.getElementById(fakeId)
                    if (fake != null) {
                        evt.preventDefault()
                        //
                        if (popout) {
                            fake.setAttr('target', '_blank')
                        }
                        //
                        const e_cp = new MouseEvent(
                            evt.type,
                            evt
                        )
                        fake.dispatchEvent(e_cp)
                        fake.remove()
                    } else {
                        console.error(
                            '[open-link-with] fake-el with "' +
                                fakeId +
                                '" not found'
                        )
                    }
                }
            })
        }
        globalWindowFunc(winFunc)

        this.app.workspace.onLayoutReady(async () => {
            await this._viewmgr.restoreView()
            if (this.settings.enableLog) {
                log(
                    'info',
                    'restored views',
                    this.settings.inAppViewRec
                )
            }
        })
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
    getOpenCMD(val: string): Optional<string[]> {
        if (val === BROWSER_SYSTEM.val) {
            return undefined
        }
        if (val === BROWSER_GLOBAL.val) {
            val = this.settings.selected
        }
        return this.profiles[val]
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
                const browsers: ProfileDisplay[] = [
                    BROWSER_SYSTEM,
                    BROWSER_IN_APP_LAST,
                    BROWSER_IN_APP,
                    ...Object.keys(
                        this.plugin.profiles
                    ).map((b) => {
                        return { val: b }
                    }),
                ]
                let current = browsers.findIndex(
                    ({ val }) =>
                        val ===
                        this.plugin.settings.selected
                )
                if (current !== -1) {
                    browsers.unshift(
                        browsers.splice(current, 1)[0]
                    )
                }
                browsers.forEach((b) =>
                    dd.addOption(b.val, b.display ?? b.val)
                )
                dd.onChange(async (p) => {
                    this.plugin.settings.selected = p
                    await this.plugin.saveSettings()
                })
            })
        new Setting(containerEl)
            .setName('Customization')
            .setDesc('Customization profiles in JSON.')
            .addTextArea((text) =>
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
        const mbSetting = new Setting(containerEl)
            .setName('Modifier Bindings')
            .setDesc('Matching from top to bottom')
            .addButton((btn) => {
                btn.setButtonText('New')
                btn.onClick(async (_) => {
                    this.plugin.settings.modifierBindings.unshift(
                        {
                            id: genRandomStr(6),
                            platform: Platform.Unknown,
                            modifier: 'none',
                            auxClickOnly: true,
                        }
                    )
                    await this.plugin.saveSettings()
                    this._render()
                })
            })
        const mbSettingEl = mbSetting.settingEl
        mbSettingEl.setAttr('style', 'flex-wrap:wrap')
        const bindings =
            this.plugin.settings.modifierBindings

        bindings.forEach((mb) => {
            const ctr = document.createElement('div')
            ctr.setAttr(
                'style',
                'flex-basis:100%;height:auto;margin-top:18px'
            )
            const mini = document.createElement('div')
            const kb = new Setting(mini)
            kb.addDropdown((dd) => {
                const browsers: ProfileDisplay[] = [
                    BROWSER_GLOBAL,
                    BROWSER_IN_APP_LAST,
                    BROWSER_IN_APP,
                    ...Object.keys(
                        this.plugin.profiles
                    ).map((b) => {
                        return { val: b }
                    }),
                    BROWSER_SYSTEM,
                ]
                browsers.forEach((b) => {
                    dd.addOption(b.val, b.display ?? b.val)
                })
                dd.setValue(
                    mb.browser ?? BROWSER_GLOBAL.val
                )
                dd.onChange(async (browser) => {
                    if (browser === BROWSER_GLOBAL.val) {
                        browser = undefined
                    }
                    this.plugin.settings.modifierBindings.find(
                        (m) => m.id === mb.id
                    ).browser = browser
                    await this.plugin.saveSettings()
                })
            })
                .addToggle((toggle) => {
                    toggle.setValue(mb.auxClickOnly)
                    toggle.setTooltip(
                        'Triggered on middle mouse button click only'
                    )
                    toggle.onChange(async (val) => {
                        this.plugin.settings.modifierBindings.find(
                            (m) => m.id === mb.id
                        ).auxClickOnly = val
                        await this.plugin.saveSettings()
                    })
                })
                .addDropdown((dd) => {
                    const platform = getPlatform()
                    getValidModifiers(platform).forEach(
                        (m) => {
                            dd.addOption(
                                m,
                                {
                                    ...MODIFIER_TEXT_FALLBACK,
                                    ...MODIFIER_TEXT[
                                        platform
                                    ],
                                }[m]
                            )
                        }
                    )
                    dd.setValue(mb.modifier)
                    dd.onChange(
                        async (modifier: ValidModifier) => {
                            this.plugin.settings.modifierBindings.find(
                                (m) => m.id === mb.id
                            ).modifier = modifier
                            await this.plugin.saveSettings()
                        }
                    )
                })
                .addButton((btn) => {
                    btn.setButtonText('Remove')
                    btn.setClass('mod-warning')
                    btn.onClick(async (_) => {
                        const idx =
                            this.plugin.settings.modifierBindings.findIndex(
                                (m) => m.id === mb.id
                            )
                        this.plugin.settings.modifierBindings.splice(
                            idx,
                            1
                        )
                        await this.plugin.saveSettings()
                        this._render()
                    })
                })
            kb.controlEl.setAttr(
                'style',
                'justify-content: space-between !important;'
            )
            mbSettingEl.appendChild(ctr)
            ctr.appendChild(kb.controlEl)
        })

        new Setting(containerEl)
            .setName('Logs')
            .setDesc(
                'Display logs in console (open developer tools to view).'
            )
            .addToggle((toggle) => {
                toggle.setValue(
                    this.plugin.settings.enableLog
                )
                toggle.onChange(async (val) => {
                    this.plugin.settings.enableLog = val
                    await this.plugin.saveSettings()
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
