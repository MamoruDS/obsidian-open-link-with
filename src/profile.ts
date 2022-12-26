import { platform } from 'os'

import { PRESET_BROWSERS } from './constant'
import {
    Browser as _Browser,
    BrowserProfile,
    BrowserProfileBase,
} from './types'

class Browser implements _Browser {
    name: string
    profiles: Partial<Record<NodeJS.Platform, BrowserProfile>>
    customCMD: string
    constructor(
        name: string,
        defaultCMD?: Partial<Record<NodeJS.Platform, BrowserProfile>>
    ) {
        this.name = name
        this.profiles = defaultCMD
    }
    getExecCommands = (
        platform: NodeJS.Platform
    ): {
        main: string[]
        private?: string[]
    } => {
        const res = {} as {
            main: string[]
            private?: string[]
        }
        let bp: BrowserProfile = this.profiles[platform]
        for (const pvt of [0, 1]) {
            const cmds = []
            let bpBase: BrowserProfileBase
            if (pvt) {
                if (!bp?.optional?.private) {
                    continue
                }
                bpBase = {
                    ...bp,
                    ...(bp.optional.private ?? {}),
                }
            } else {
                bpBase = bp
            }
            if (bpBase.sysCmd) {
                cmds.push(bpBase.sysCmd)
            }
            if (bpBase.sysArgs) {
                bpBase.sysArgs.forEach((arg) => cmds.push(arg))
            }
            cmds.push(bpBase.cmd)
            if (bpBase.args) {
                bpBase.args.forEach((arg) => cmds.push(arg))
            }
            if (pvt) {
                res.private = cmds
            } else {
                res.main = cmds
            }
        }
        return res
    }
}

const getPresetBrowsers = (): Browser[] => {
    const presets: Browser[] = []
    for (const name of Object.keys(PRESET_BROWSERS)) {
        presets.push(new Browser(name, PRESET_BROWSERS[name]))
    }
    return presets
}

class ProfileMgr {
    private _preset_browser: Browser[]
    private _browsers: Browser[]
    constructor() {
        this._browsers = []
    }
    loadValidPresetBrowsers = async (): Promise<void> => {
        this._preset_browser = []
        const presets = getPresetBrowsers()
        const os = platform()
        presets.forEach(async (browser) => {
            const { profiles, name } = browser
            let app = profiles[os]
            if (
                typeof app !== 'undefined' &&
                app.isAvailable &&
                (await app.isAvailable(app))
            ) {
                this._preset_browser.push(browser)
            }
        })
    }
    getBrowsers = (): Browser[] => {
        return [...this._preset_browser, ...this._browsers]
    }
    getBrowsersCMD = (
        custom: Record<string, string[]>
    ): Record<string, string[]> => {
        const res: Record<string, string[]> = {}
        this.getBrowsers().forEach((browser) => {
            const cmds = browser.getExecCommands(platform())
            res[browser.name] = cmds.main
            if (typeof cmds.private !== 'undefined') {
                res[browser.name + '-private'] = cmds.private
            }
        })
        return { ...res, ...custom }
    }
}

export { ProfileMgr }
