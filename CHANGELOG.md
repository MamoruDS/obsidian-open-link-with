# Changelog

## 0.1.10

-   fixed: no longer ignores non-clickable elements with a valid pending URL [#20](https://github.com/mamoruds/obsidian-open-link-with/issues/20)
-   fixed: blocks internal links under the .community-modal-info class [#19](https://github.com/mamoruds/obsidian-open-link-with/issues/20)
-   improved: adds background to in-app view iframe [#21](https://github.com/mamoruds/obsidian-open-link-with/issues/21)

## 0.1.9

-   fixed: external-link click ignored under live preview mode
-   added: more and native [pane-type](https://github.com/obsidianmd/obsidian-api/blob/38dd22168d2925086371bfc59e36fd9121527a39/obsidian.d.ts#L2591) support for creating views
-   improved: using rule-based checker for `clickable` checking
-   improved: in-app view opening now follows Obsidian's click behaviors

## 0.1.8

-   fixed: multi-window handling was not correct [#16](https://github.com/mamoruds/obsidian-open-link-with/issues/16)
-   fixed: unloading plugin was not being handled correctly [#16](https://github.com/mamoruds/obsidian-open-link-with/issues/16)
-   rewrote: click handler (no longer depends on Window.open)
-   added: new toggle in settings panel for toggling in-app-view update focus
-   added: preset browsers brave and waterfox
-   updated: bump up the minimum version requirement to 1.1

## 0.1.7

-   fixed: open links not working in edit mode [#3](https://github.com/MamoruDS/obsidian-open-link-with/issues/3)
-   fixed: clickable elements support [#12](https://github.com/MamoruDS/obsidian-open-link-with/issues/12)
-   added: popout windows support [#13](https://github.com/MamoruDS/obsidian-open-link-with/issues/13)
-   updated: bump up the minimum version requirement to 0.15

## 0.1.6

-   added: two new open methods: `in-app view` and `in-app view (always new split)` suggested by [#9](https://github.com/MamoruDS/obsidian-open-link-with/issues/9)

## 0.1.5

-   added: custom modifier key bindings
-   added: middle mouse click support

## 0.1.3

-   added: new setting items `Logs` and `Timeout`
-   fixed: browser open failed due to command path [#1](https://github.com/mamoruds/obsidian-open-link-with/issues/1)

## 0.1.1

-   fixed: browser detecting failed on linux
-   added: chromium has been added to detect list
