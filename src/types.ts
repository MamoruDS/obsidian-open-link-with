type Optional<T> = T | undefined

enum Platform {
    Unknown = 'unknown',
    Linux = 'linux',
    Mac = 'mac',
    Win = 'win',
}

class _MatchRule<R> {
    constructor(public items: R[]) {}
}

class MRExact<R> extends _MatchRule<R> {}

class MRContains<R> extends _MatchRule<R> {}

class MRNotExact<R> extends _MatchRule<R> {}

class MRNotContains<R> extends _MatchRule<R> {}

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
    modifier: ValidModifier
    focusOnView: boolean
    auxClickOnly: boolean
}

interface ProfileDisplay {
    val: string
    display?: string
}

interface MWindow extends Window {
    mid: string
    oolwCIDs: string[]
    oolwPendingUrls: string[]
    _builtInOpen: (url?: string | URL, target?: any, features?: any) => Window
}

type Clickable = {
    is_clickable: boolean
    url: string | undefined
    popout: boolean
    required_modifiers?: Modifier[]
}

type LogLevels = 'info' | 'warn' | 'error'

type ValidModifier = 'none' | 'ctrl' | 'meta' | 'alt' | 'shift'

export {
    Browser,
    BrowserOptions,
    BrowserProfile,
    BrowserProfileBase,
    Clickable,
    LogLevels,
    _MatchRule,
    MRExact,
    MRContains,
    MRNotExact,
    MRNotContains,
    Modifier,
    ModifierBinding,
    MouseButton,
    MWindow,
    Optional,
    Platform,
    ProfileDisplay,
    ValidModifier,
}
