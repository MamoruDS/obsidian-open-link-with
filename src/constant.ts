import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import * as path from 'path'

import { BrowserProfile, OS } from './types'

const VALID_OS = {
    darwin: true,
    linux: true,
    win32: true,
}

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
                const c = spawnSync('whereis', [b.cmd])
                return Boolean(c.stdout)
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
                const c = spawnSync('whereis', [b.cmd])
                return Boolean(c.stdout)
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
} as Record<string, Partial<Record<OS, BrowserProfile>>>

export { VALID_OS, DEFAULT_OPEN_WITH, PRESET_BROWSERS }