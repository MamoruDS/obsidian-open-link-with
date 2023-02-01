import { ItemView, PaneType, WorkspaceLeaf } from 'obsidian'
import { BuiltinIcon } from './obsidian/types'
import { OpenLinkPluginITF, ViewMode, ViewRec } from './types'
import { log } from './utils'

class InAppView extends ItemView {
    public icon: BuiltinIcon = 'link'
    public frame: HTMLIFrameElement
    public title: string
    constructor(leaf: WorkspaceLeaf, public url: string) {
        super(leaf)
        this.title = new URL(url).host
        // TODO: remove this after tab title issue is fixed
        this.leaf.setPinned(true)
        setTimeout(() => {
            this.leaf.setPinned(false)
        }, 10)
    }
    async onOpen(): Promise<void> {
        const frame_styles: string[] = [
            'height: 100%',
            'width: 100%',
            'background-color: white', // for pages with no background
        ]
        this.frame = document.createElement('iframe')
        this.frame.setAttr('style', frame_styles.join('; '))
        this.frame.setAttr('src', this.url)
        this.containerEl.children[1].appendChild(this.frame)
    }
    getDisplayText(): string {
        return this.title
    }
    getViewType(): string {
        return 'OOLW::InAppView'
    }
}

class ViewMgr {
    constructor(public plugin: OpenLinkPluginITF) {}
    private _getLeafId(leaf: any): string {
        return leaf['id'] ?? ''
    }
    private _validRecords(): ViewRec[] {
        const records = this.plugin.settings.inAppViewRec ?? []
        const validRec: ViewRec[] = []
        try {
            for (const rec of records) {
                if (
                    this.plugin.app.workspace.getLeafById(rec.leafId) !== null
                ) {
                    validRec.push(rec)
                }
            }
        } catch (err) {
            if (this.plugin.settings.enableLog) {
                log('error', 'failed to restore views', `${err}`)
            }
        }
        return validRec
    }
    async createView(
        url: string,
        mode: ViewMode,
        options: {
            focus?: boolean
            paneType?: PaneType
        } = {}
    ): Promise<string> {
        const getNewLeafId = (): string => {
            const newLeaf =
                typeof options.paneType === 'undefined'
                    ? false
                    : options.paneType
            const leaf = this.plugin.app.workspace.getLeaf(
                newLeaf === false ? 'tab' : newLeaf // TODO: missing navigation; using tab for now
            )
            return this._getLeafId(leaf)
        }
        let id: string = undefined
        // TODO: more robust open behaviors
        if (typeof options.paneType !== 'undefined' || mode === ViewMode.NEW) {
            id = getNewLeafId()
        } else {
            const viewRec = this._validRecords()
            let rec =
                viewRec.find(({ mode }) => mode === ViewMode.LAST) ??
                viewRec.find(({ mode }) => mode === ViewMode.NEW)
            id = rec?.leafId ?? getNewLeafId()
        }
        return await this.updateView(id, url, mode, options?.focus)
    }
    async updateView(
        leafId: string,
        url: string,
        mode: ViewMode,
        focus: boolean = true
    ): Promise<string | null> {
        const leaf = this.plugin.app.workspace.getLeafById(leafId)
        if (leaf === null) {
            return null
        } else {
            const view = new InAppView(leaf, url)
            await leaf.open(view)
            const rec = this.plugin.settings.inAppViewRec.find(
                (rec) => rec.leafId === leafId
            )
            if (typeof rec !== 'undefined') {
                rec.url = url
                // TODO:
                rec.mode = rec.mode ?? mode
            } else {
                this.plugin.settings.inAppViewRec.unshift({
                    leafId,
                    url,
                    mode,
                })
            }
            await this.plugin.saveSettings()
            // this.plugin.app.workspace.setActiveLeaf(leaf, { focus }) // TODO: option `focus` is not working (cliVer == 1.1.9)
            if (focus) {
                this.plugin.app.workspace.setActiveLeaf(leaf)
            }
            return leafId
        }
    }
    async restoreView() {
        const viewRec = this._validRecords()
        const restored: ViewRec[] = []
        for (const rec of viewRec) {
            if (
                (await this.updateView(
                    rec.leafId,
                    rec.url,
                    rec.mode,
                    false
                )) !== null
            ) {
                restored.push(rec)
            }
        }
        this.plugin.settings.inAppViewRec = restored
        await this.plugin.saveSettings()
    }
}

export { InAppView, ViewMgr, ViewMode, ViewRec }
