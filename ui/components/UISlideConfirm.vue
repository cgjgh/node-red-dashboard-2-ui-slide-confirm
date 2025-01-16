<template>
    <v-row justify="center">
        <v-col v-if="!isSliderComplete">
            <slide-unlock
                ref="vueSlideUnlockRef" :auto-width="true" :circle="circle" :noanimate="!animate" :disabled="!state.enabled"
                :text="text" :height="sliderHeight" :success-text="successText" name="slideunlock" :style="sliderStyle"
                @completed="complete"
            />
        </v-col>
        <v-col v-else cols="2">
            <v-progress-circular class="mx-auto" :size="50" :width="10" :model-value="progressValue" color="green">
                <v-icon>{{ iconSuccess }}</v-icon>
            </v-progress-circular>
        </v-col>
    </v-row>
</template>

<script>
import SlideUnlock from '@j2only/slide-unlock'
// eslint-disable-next-line no-unused-vars
import { ref } from 'vue'
import { mapState } from 'vuex'

export default {
    name: 'DBUISlideConfirm',
    components: {
        SlideUnlock
    },
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    data () {
        return {
            isSliderComplete: false,
            countdown: 0,
            progressValue: 100,
            suSizeText: '24px' // Add this data property
        }
    },
    computed: {
        ...mapState('ui', ['widgets']),
        iconSuccess () {
            const icon = this.getProperty('iconSuccess')
            return this.makeMdiIcon(icon)
        },
        animate () {
            return this.getProperty('animate')
        },
        circle () {
            return this.getProperty('circle')
        },
        text () {
            return this.getProperty('text')
        },
        successText () {
            return this.getProperty('successText')
        },
        width () {
            return this.getProperty('width')
        },
        height () {
            return this.getProperty('height')
        },
        timeout () {
            return this.getProperty('timeout')
        },
        sliderHeight () {
            return Number(this.getProperty('sliderHeight'))
        },
        completed () {
            return this.isSliderComplete
        },
        sliderStyle () {
            return {
                '--su-size-text': `${Number(this.getProperty('textSize'))}px` // Bind the custom property here
            }
        }

    },
    watch: {
        completed (value, oldValue) {
            this.updateWidgetStates(value)
        }
    },

    created () {
        this.$dataTracker(this.id)
    },
    mounted () {
        this.$socket.emit('widget-load', this.id)
        this.updateSlider()
        this.updateWidgetStates(this.isSliderComplete)
    },
    methods: {
        onDynamicProperties (msg) {
            const updates = msg.ui_update
            if (!updates) {
                return
            }
            this.updateDynamicProperty('label', updates.label)
            this.updateDynamicProperty('iconSuccess', updates.iconSuccess)
            this.updateDynamicProperty('animate', updates.animate)
            this.updateDynamicProperty('circle', updates.circle)
            this.updateDynamicProperty('text', updates.text)
            this.updateDynamicProperty('successText', updates.successText)
            this.updateDynamicProperty('width', updates.width)
            this.updateDynamicProperty('height', updates.height)
            this.updateDynamicProperty('timeout', updates.timeout)
            this.updateDynamicProperty('sliderHeight', updates.sliderHeight)
            this.updateDynamicProperty('textSize', updates.textSize)
        },
        complete () {
            this.$socket.emit('widget-action', this.id, { payload: 'confirmed' })
            this.isSliderComplete = true
            this.updateSlider()

            if (Number(this.timeout) > 0) {
                this.countdown = this.timeout
                this.progressValue = 100
                this.startCountdown()
            }
        },
        resetComponent () {
            this.$socket.emit('widget-action', this.id, { payload: 'reset' })
            this.$refs?.vueSlideUnlockRef?.reset()
            this.isSliderComplete = false
            this.updateSlider()
        },
        completeComponent () {
            this.$refs.vueSlideUnlockRef.complete()
            this.isSliderComplete = true

            this.updateSlider()
        },
        updateSlider () {
            if (!this.$refs.vueSlideUnlockRef || !this.$refs.vueSlideUnlockRef.Slider) {
                this.isSliderComplete = false
                return false
            }
            this.isSliderComplete = this.$refs.vueSlideUnlockRef.Slider.IsComplete
            return this.isSliderComplete
        },
        updateWidgetStates (visible) {
            let controlledWidgets = this.getProperty('controlledWidgets')
            if (!Array.isArray(controlledWidgets)) {
                controlledWidgets = controlledWidgets ? [controlledWidgets] : []
            }
            const vue = this
            Object.keys(this.widgets).forEach(key => {
                const widgetId = this.widgets[key].id
                if (controlledWidgets.some(controlledWidgetId => widgetId.includes(controlledWidgetId))) {
                    if (!this.widgets[key].component.name === 'DBUITemplate') {
                        const state = this.widgets[key].state
                        vue.$store.commit('ui/setProperty', {
                            item: 'widget',
                            itemId: key,
                            property: 'state',
                            value: {
                                ...state,
                                visible,
                                enabled: visible
                            }
                        })
                    } else {
                        const props = this.widgets[key].props
                        vue.$store.commit('ui/setProperty', {
                            item: 'widget',
                            itemId: key,
                            property: 'props',
                            value: {
                                ...props,
                                visible,
                                enabled: visible
                            }
                        })
                        const state = this.widgets[key].state
                        vue.$store.commit('ui/setProperty', {
                            item: 'widget',
                            itemId: key,
                            property: 'state',
                            value: {
                                ...state,
                                visible,
                                enabled: visible
                            }
                        })
                    }
                }
            })
        },

        startCountdown () {
            const interval = setInterval(() => {
                if (this.countdown > 0) {
                    this.countdown -= 1
                    this.progressValue -= (100 / this.timeout)
                } else {
                    clearInterval(interval)
                    this.resetComponent()
                }
            }, 1000)
        },
        makeMdiIcon (icon) {
            return 'mdi-' + icon.replace(/^mdi-/, '')
        }
    }
}
</script>

<style>
  .v-theme--nrdb, .slideunlock {
    --su-color-bg: #ebebeb;
    --su-color-text-normal: #4F4F4F;
    --su-color-text-complete: #FEFEFE;
    --su-color-progress-normal-bg: #cacaca;
    --su-color-progress-complete-bg: #42b983;
    --su-color-handler-bg: #FFFFFF;
}
.v-theme--nrdbLight, .slideunlock {
    --su-color-bg: #ebebeb;
    --su-color-text-normal: #4F4F4F;
    --su-color-text-complete: #FEFEFE;
    --su-color-progress-normal-bg: #cacaca;
    --su-color-progress-complete-bg: #42b983;
    --su-color-handler-bg: #FFFFFF;
}

/* Dark Theme */
.v-theme--nrdbDark .slideunlock {
    --su-color-bg: #242424;
    --su-color-text-normal: #4F4F4F;
    --su-color-text-complete: #4F4F4F;
    --su-color-progress-normal-bg: #3a3a3a;
    --su-color-progress-complete-bg: #1bc47d;
    --su-color-handler-bg: #3e3e3e;
}

</style>
