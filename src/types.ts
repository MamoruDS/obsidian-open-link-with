import { PaneType, Plugin } from 'obsidian'

type Optional<T> = T | undefined

namespace Rule {
    export class _Rule<R, V> {
        constructor(public items: R[], public value: V) {}
    }

    export class Empty<R, V> extends _Rule<R, V> {
        constructor(value: V) {
            super([], value)
        }
    }

    export class Exact<R, V> extends _Rule<R, V> {}

    export class Contains<R, V> extends _Rule<R, V> {}

    export class NotExact<R, V> extends _Rule<R, V> {}

    export class NotContains<R, V> extends _Rule<R, V> {}
}

enum Platform {
    Unknown = 'unknown',
    Linux = 'linux',
    Mac = 'mac',
    Win = 'win',
}

enum Modifier {
    Alt = 'alt',
    Ctrl = 'ctrl',
    Meta = 'meta',
    Shift = 'shift',
}

enum MouseButton {
    Main,
    Auxiliary,
    Secondary,
    Fourth,
    Fifth,
}

enum ViewMode {
    LAST,
    NEW,
}

interface BrowserOptions {
    private: Partial<Omit<BrowserProfileBase, 'optional'>>
    background: boolean
}

interface BrowserProfileBase {
    sysCmd?: string
    sysArgs?: string[]
    cmd: string
    args?: string[]
}

interface BrowserProfile extends BrowserProfileBase {
    optional: Partial<BrowserOptions>
    isAvailable: (b: BrowserProfile) => Promise<boolean>
}

interface Browser {
    name: string
    profiles: Partial<Record<NodeJS.Platform, BrowserProfile>>
    getExecCommands: (platform: NodeJS.Platform) => {
        main: string[]
        private?: string[]
    }
}

interface ModifierBinding {
    id: string
    browser?: string
    platform: Platform
    modifier: ValidModifier // TODO:
    focusOnView?: boolean
    auxClickOnly: boolean
    paneType?: PaneType
}

interface OpenLinkPluginITF extends Plugin {
    settings: PluginSettings
    profiles: ProfileMgrITF
    loadSettings(): Promise<void>
    saveSettings(): Promise<void>
}

interface PluginSettings {
    selected: string
    custom: Record<string, string[]>
    modifierBindings: ModifierBinding[]
    enableLog: boolean
    timeout: number
    inAppViewRec: ViewRec[]
}

interface ProfileDisplay {
    val: string
    display?: string
}

interface ProfileMgrITF {
    loadValidPresetBrowsers: () => Promise<void>
    getBrowsers: () => Browser[]
    getBrowsersCMD: (
        custom: Record<string, string[]>
    ) => Record<string, string[]>
}

interface MWindow extends Window {
    mid: string
    oolwCIDs: string[]
    oolwPendingUrls: string[]
    _builtInOpen: (url?: string | URL, target?: any, features?: any) => Window
}

type Clickable = {
    is_clickable: boolean | null
    url: string | null
    paneType?: PaneType
    modifier_rules?: Rule._Rule<Modifier, Optional<PaneType> | false>[]
}

type LogLevels = 'info' | 'warn' | 'error'

type ValidModifier = 'none' | 'ctrl' | 'meta' | 'alt' | 'shift'

type ViewRec = {
    leafId: string
    url: string
    mode: ViewMode
}

export {
    Browser,
    BrowserOptions,
    BrowserProfile,
    BrowserProfileBase,
    Clickable,
    LogLevels,
    Modifier,
    ModifierBinding,
    MouseButton,
    MWindow,
    OpenLinkPluginITF,
    Optional,
    Platform,
    PluginSettings,
    ProfileDisplay,
    ProfileMgrITF,
    Rule,
    ValidModifier,
    ViewMode,
    ViewRec,
}
