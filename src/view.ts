import { ItemView, WorkspaceLeaf } from 'obsidian'
import { BuiltinIcon } from './obsidian/types'
import OpenLinkPlugin from './main'
import { log } from './utils'

enum ViewMode {
    LAST,
    NEW,
}

type ViewRec = {
    leafId: string
    url: string
    mode: ViewMode
}

class InAppView extends ItemView {
    icon: BuiltinIcon = 'link'
    frame: HTMLIFrameElement
    title: string
    url: string
    constructor(leaf: WorkspaceLeaf, url: string) {
        super(leaf)
        this.url = url
        this.title = new URL(url).host
    }
    async onOpen(): Promise<void> {
        this.frame = document.createElement('iframe')
        this.frame.setAttr(
            'style',
            'height: 100%; width:100%'
        )
        this.frame.setAttr('src', this.url)
        this.containerEl.children[1].appendChild(this.frame)
    }
    getDisplayText(): string {
        return this.title
    }
    getViewType(): string {
        return 'InAppView::getViewType()'
    }
}

class ViewMgr {
    plugin: OpenLinkPlugin
    constructor(plugin: OpenLinkPlugin) {
        this.plugin = plugin
    }
    // private _getLeafID(leaf: WorkspaceLeaf): string {
    // FIXME: missing property
    private _getLeafId(leaf: any): string {
        return leaf['id'] ?? ''
    }
    private _validRecords(): ViewRec[] {
        const records =
            this.plugin.settings.inAppViewRec ?? []
        const validRec: ViewRec[] = []
        try {
            for (const rec of records) {
                if (
                    this.plugin.app.workspace.getLeafById(
                        rec.leafId
                    ) !== null
                ) {
                    validRec.push(rec)
                }
            }
        } catch (err) {
            if (this.plugin.settings.enableLog) {
                log(
                    'error',
                    'failed to restore views',
                    `${err}`
                )
            }
        }
        return validRec
    }
    async createView(
        url: string,
        mode: ViewMode,
        options: {
            popupWindow?: boolean // using popout-win will overwrite mode
        } = {}
    ): Promise<string> {
        const getNewLeafId = (): string => {
            const leaf = this.plugin.app.workspace.getLeaf(
                !(
                    this.plugin.app.workspace.activeLeaf.view.getViewType() ===
                    'empty'
                )
            )
            return this._getLeafId(leaf)
        }
        let id: string = undefined
        if (options.popupWindow) {
            mode = ViewMode.NEW
            const leaf =
                this.plugin.app.workspace.openPopoutLeaf()
            id = this._getLeafId(leaf)
        } else {
            if (mode == ViewMode.NEW) {
                id = getNewLeafId()
            } else {
                const viewRec = this._validRecords()
                let rec =
                    viewRec.find(
                        ({ mode }) => mode === ViewMode.LAST
                    ) ??
                    viewRec.find(
                        ({ mode }) => mode === ViewMode.NEW
                    )
                id = rec?.leafId ?? getNewLeafId()
            }
        }
        return await this.updateView(id, url, mode)
    }
    async updateView(
        leafId: string,
        url: string,
        mode: ViewMode
    ): Promise<string | null> {
        const leaf =
            this.plugin.app.workspace.getLeafById(leafId)
        if (leaf === null) {
            return null
        } else {
            const view = new InAppView(leaf, url)
            await leaf.open(view)
            const rec =
                this.plugin.settings.inAppViewRec.find(
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
                    rec.mode
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
