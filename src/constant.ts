import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'

import { BrowserProfile } from './types'

const DEFAULT_OPEN_WITH = 'system-default'

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

export { DEFAULT_OPEN_WITH, PRESET_BROWSERS }
