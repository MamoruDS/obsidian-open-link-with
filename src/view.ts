import { ItemView, WorkspaceLeaf } from 'obsidian'
import OpenLinkPlugin from './main'

type ViewRec = {
    url: string
}

class InAppView extends ItemView {
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
    private _getLeafID(leaf: any): string {
        return leaf['id'] ?? ''
    }
    async createView(url: string): Promise<string> {
        const leaf = this.plugin.app.workspace.getLeaf(
            !(
                this.plugin.app.workspace.activeLeaf.view.getViewType() ===
                'empty'
            )
        )
        const id = this._getLeafID(leaf)
        return await this.updateView(id, url)
    }
    async updateView(
        leafID: string,
        url: string
    ): Promise<string | null> {
        const leaf =
            this.plugin.app.workspace.getLeafById(leafID)
        console.log({
            msg: 'debug getLeafById',
            id: leafID,
            leaf,
        })
        if (leaf === null) {
            return null
        } else {
            const view = new InAppView(leaf, url)
            await leaf.open(view)
            this.plugin.settings.inAppViewRec[leafID] = {
                url,
            }
            await this.plugin.saveSettings()
            console.log(this.plugin.settings.inAppViewRec)
            return leafID
        }
    }
    async restoreView() {
        const viewRec =
            this.plugin.settings.inAppViewRec ?? {}
        for (const [id, rec] of Object.entries(viewRec)) {
            if (
                (await this.updateView(id, rec.url)) ===
                null
            ) {
                delete this.plugin.settings.inAppViewRec[id]
            }
        }
        await this.plugin.saveSettings()
    }
}

export { InAppView, ViewMgr, ViewRec }
