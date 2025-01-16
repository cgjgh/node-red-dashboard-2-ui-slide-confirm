module.exports = function (RED) {
    function SlideConfirmNode (config) {
        RED.nodes.createNode(this, config)

        function getSelectedWidgets (widgetIDs) {
            const selectedWidgets = []
            // Ensure widgetIDs is always an array
            const ids = Array.isArray(widgetIDs) ? widgetIDs : [widgetIDs]

            RED.nodes.eachNode(function (n) {
                ids.forEach(widgetID => {
                    const idToCompare = widgetID.includes('-') ? widgetID.split('-').pop() : widgetID
                    if (/^ui-/.test(n.type) && (idToCompare === n.id || n.id.includes(idToCompare))) {
                        selectedWidgets.push(n)
                    }
                })
            })
            return selectedWidgets
        }

        const node = this
        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)
        const base = group.getBase()

        node.pt = config.passthru
        config.controlledWidgets = Array.isArray(config.controlledWidgets)
            ? config.controlledWidgets
            : (config.controlledWidgets ? [config.controlledWidgets] : [])
        node.controlledWidgets = config.controlledWidgets
        node.state = [' ', ' ']

        const uiWidgets = getSelectedWidgets(node.controlledWidgets)
        uiWidgets.forEach(controlledWidget => {
            base.stores.state.set(base, controlledWidget, null, 'visible', false)
            base.stores.state.set(base, controlledWidget, null, 'enabled', false)
        })

        const evts = {
            onAction: true,
            beforeSend: function (msg) {
                /**
                 * Dynamic Properties
                 * */
                const updates = msg.ui_update
                if (updates) {
                    if (typeof (updates.label) !== 'undefined') {
                        // dynamically set "label" property
                        base.stores.state.set(group.getBase(), node, msg, 'label', updates.label)
                    }
                }
                return msg
            }
        }

        // inform the dashboard UI that we are adding this node
        group.register(node, config, evts)

        setTimeout(() => {
            node.send({ enabled: false, visible: false })
        }, 100)
    }
    RED.nodes.registerType('ui-slide-confirm', SlideConfirmNode)
}
