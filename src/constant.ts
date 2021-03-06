import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'

import {
    BrowserProfile,
    Platform,
    ProfileDisplay,
    ValidModifier,
} from './types'

const BROWSER_SYSTEM: ProfileDisplay = {
    val: '_system',
    display: 'system-default',
}
const BROWSER_GLOBAL: ProfileDisplay = {
    val: '_global',
    display: 'global',
}

const BROWSER_IN_APP: ProfileDisplay = {
    val: '_in_app',
    display: 'in-app view (always new split)',
}

const BROWSER_IN_APP_LAST: ProfileDisplay = {
    val: '_in_app_last',
    display: 'in-app view',
}

const PRESET_BROWSERS = {
    safari: {
        darwin: {
            sysCmd: 'open',
            sysArgs: ['-a'],
            cmd: 'safari',
            optional: {},
            test: async (b) => {
                return true
            },
        },
    },
    firefox: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Firefox.app',
                'Contents',
                'MacOS',
                'firefox'
            ),
            optional: {
                private: {
                    args: ['--private-window'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
        linux: {
            cmd: 'firefox',
            optional: {
                private: {
                    args: ['--private-window'],
                },
            },
            test: async (b) => {
                const c = spawnSync('which', [b.cmd])
                return c.status === 0
            },
        },
        win32: {
            cmd: path.join(
                'c:',
                'Program Files',
                'Mozilla Firefox',
                'firefox.exe'
            ),
            optional: {
                private: {
                    args: ['--private-window'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
    },
    chrome: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Google Chrome.app',
                'Contents',
                'MacOS',
                'Google Chrome'
            ),
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
        linux: {
            cmd: 'google-chrome',
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            test: async (b) => {
                const c = spawnSync('which', [b.cmd])
                return c.status === 0
            },
        },
        win32: {
            cmd: path.join(
                'c:',
                'Program Files (x86)',
                'Google',
                'Chrome',
                'Application',
                'chrome.exe'
            ),
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
    },
    chromium: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Chromium.app',
                'Contents',
                'MacOS',
                'Chromium'
            ),
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
        linux: {
            cmd: 'chromium-browser',
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            test: async (b) => {
                const c = spawnSync('which', [b.cmd])
                return c.status === 0
            },
        },
    },
    edge: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Microsoft Edge.app',
                'Contents',
                'MacOS',
                'Microsoft Edge'
            ),
            optional: {
                private: {
                    args: ['-inprivate'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
        win32: {
            cmd: path.join(
                'c:',
                'Program Files (x86)',
                'Microsoft',
                'Edge',
                'Application',
                'msedge.exe'
            ),
            optional: {
                private: {
                    args: ['-inprivate'],
                },
            },
            test: async (b) => {
                return existsSync(b.cmd)
            },
        },
    },
} as Record<
    string,
    Partial<Record<NodeJS.Platform, BrowserProfile>>
>

const MODIFIER_TEXT_FALLBACK: Record<
    ValidModifier,
    string
> = {
    none: 'None',
    meta: 'Meta',
    alt: 'Alt',
    ctrl: 'Ctrl',
    shift: 'Shift',
}

const MODIFIER_TEXT: Partial<
    Record<Platform, Partial<Record<ValidModifier, string>>>
> = {
    mac: {
        meta: 'Cmd???',
        alt: 'Option???',
        ctrl: 'Control???',
        shift: 'Shift???',
    },
    win: {
        meta: 'Windows',
    },
}

export {
    BROWSER_SYSTEM,
    BROWSER_GLOBAL,
    BROWSER_IN_APP,
    BROWSER_IN_APP_LAST,
    MODIFIER_TEXT,
    MODIFIER_TEXT_FALLBACK,
    PRESET_BROWSERS,
}
