interface BrowserOptions {
    private: Partial<Omit<BrowserProfile, 'optional'>>
    background: boolean
}

interface BrowserProfile {
    sysCmd?: string
    sysArgs?: string[]
    cmd: string
    args?: string[]
    optional: Partial<BrowserOptions>
    test: (b: BrowserProfile) => Promise<boolean>
}

interface Browser {
    name: string
    profiles: Partial<
        Record<NodeJS.Platform, BrowserProfile>
    >
}

type LOG_TYPE = 'info' | 'warn' | 'error'

export { Browser, BrowserOptions, BrowserProfile, LOG_TYPE }
