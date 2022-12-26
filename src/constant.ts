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

const _isExecutableExist = async (fp: string): Promise<boolean> => {
    return existsSync(fp)
}

const _isExecutableAvailable = async (exec: string): Promise<boolean> => {
    return spawnSync('which', [exec]).status === 0
}

const PRESET_BROWSERS = {
    safari: {
        darwin: {
            sysCmd: 'open',
            sysArgs: ['-a'],
            cmd: 'safari',
            optional: {},
            isAvailable: async (b) => {
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
        linux: {
            cmd: 'firefox',
            optional: {
                private: {
                    args: ['--private-window'],
                },
            },
            isAvailable: async (b) => _isExecutableAvailable(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
        linux: {
            cmd: 'google-chrome',
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            isAvailable: async (b) => _isExecutableAvailable(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
        linux: {
            cmd: 'chromium-browser',
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            isAvailable: async (b) => _isExecutableAvailable(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
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
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
    },
    brave: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Brave Browser.app',
                'Contents',
                'MacOS',
                'Brave Browser'
            ),
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
        linux: {
            cmd: 'brave-browser',
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            isAvailable: async (b) => _isExecutableAvailable(b.cmd),
        },
        win32: {
            cmd: path.join(
                'c:',
                'Program Files',
                'BraveSoftware',
                'Brave-Browser',
                'Application',
                'brave.exe'
            ),
            optional: {
                private: {
                    args: ['-incognito'],
                },
            },
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
    },
    waterfox: {
        darwin: {
            cmd: path.join(
                '/Applications',
                'Waterfox.app',
                'Contents',
                'MacOS',
                'Waterfox'
            ),
            optional: {
                private: {
                    args: ['-private-window'],
                },
            },
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
        linux: {
            cmd: 'waterfox',
            optional: {
                private: {
                    args: ['-private-window'],
                },
            },
            isAvailable: async (b) => _isExecutableAvailable(b.cmd),
        },
        win32: {
            cmd: path.join('c:', 'Program Files', 'Waterfox', 'waterfox.exe'),
            optional: {
                private: {
                    args: ['-private-window'],
                },
            },
            isAvailable: async (b) => _isExecutableExist(b.cmd),
        },
    },
} as Record<string, Partial<Record<NodeJS.Platform, BrowserProfile>>>

const MODIFIER_TEXT_FALLBACK: Record<ValidModifier, string> = {
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
        meta: 'Cmd⌘',
        alt: 'Option⌥',
        ctrl: 'Control⌃',
        shift: 'Shift⇧',
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
