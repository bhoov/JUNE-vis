import {
    reactive,
    watch,
    watchEffect,
    computed,
} from "@vue/runtime-core";


import * as tp from "@/types"
import * as api from "@/api/API"
import * as R from "ramda"

interface StateI {
    selectedRunIds: string[]
    baselineRunId: string
    availableFields: string[]
    availableRegions: string[]
    legend: string[]
    numericFields: string[],
    projectId: string
    selectedRegion: string
    region: string
    xTrace: any[]
    overviewYTraces: any[][]
    overviewTraces: tp.Trace[]
    paramOptions: tp.ParamOptions[]
    selectedParamIdxs: (number | null)[]
    freeIdx: number | null
    selectedField: string
    hasAgeInfo: boolean
}

const state = reactive(<StateI>{
    runId: "4",
    baselineRunId: "",
    selectedRunIds: [],
    availableFields: [],
    availableRegions: [],
    legend: [],
    numericFields: [],
    projectId: "learning_centers", // Change this to not be dependent on call
    selectedRegion: "all",
    region: "CXB-201",
    xTrace: [],
    overviewYTraces: [[]],
    overviewTraces: [],
    paramOptions: [],
    freeIdx: null,
    selectedParamIdxs: [], // Update this to start with the empty list
    selectedField: "currently_infected",
    hasAgeInfo: false
})

const freeParamName = computed(() => {
    return state.freeIdx == null ? "" : state.paramOptions[state.freeIdx].name
})

// How can these be combined?
async function updateAgeInfo() {
    const project = await api.getProject(state.projectId)
    state.hasAgeInfo = project.ageFieldsAvailable.has(state.selectedField)
}
watchEffect(async () => {
    console.log("Initializing ageInfo")
    updateAgeInfo()
})
watch(() => [state.projectId, state.selectedField], async () => {
    console.log("Rerunning ageInfo")
    updateAgeInfo()
})

const store = {
    state: state,

    freeParamName,

    paramSelectionQuery: computed((): tp.ParamQuery => {
        const entries = R.zip(state.paramOptions, state.selectedParamIdxs).map(([p, selectedIdx], i) => {
            let v: any[]
            if (i == state.freeIdx || p.options[(<number>selectedIdx)] == undefined) {
                v = []
            }
            else {
                v = [p.options[(<number>selectedIdx)]]
            }

            return [p.name, v]
        })
        return Object.fromEntries(entries)
    }),

    newNumericFields(value: string[]) {
        state.numericFields = value
    },

    newBaselineRunId(value: string) {
        state.baselineRunId = value
    },

    newAvailableRegions(value: string[]) {
        state.availableRegions = value
    },

    newAvailableFields(value: string[]) {
        state.availableFields = value
    },

    newRegion(region: string) {
        state.region = region
    },

    newXTrace(newX: any[]) {
        state.xTrace = newX
    },

    newYTraces(newYs: any[][]) {
        state.overviewYTraces = newYs
    },

    newParamOptions(params: tp.ParamOptions[]) {
        state.paramOptions = params
    },

    updateParamSelection(rowIdx: number, colIdx: number) {
        const newSelectedValues = state.selectedParamIdxs.slice()
        newSelectedValues[rowIdx] = colIdx
        state.selectedParamIdxs = newSelectedValues
    },

    updateSelectedIdxsFromParamObject(paramObject: tp.RunParameters) {
        const newSelection: (number | null)[] = state.paramOptions.map(p => {
            const v = paramObject[p.name]
            const pos = p.options.indexOf(v)
            if (pos == -1) {
                console.log("ERROR: INVALID SELECTION. Returning 'null'");
                return null
            }
            return pos
        })
        state.selectedParamIdxs = newSelection
    },

    toggleFreeIdx(idx: number | null) {
        const value = idx == state.freeIdx ? null : idx;
        state.freeIdx = value
    },
}

watch(() => [state.freeIdx, state.selectedParamIdxs, state.paramOptions], async () => {
    state.selectedRunIds = await api.filterByParamSelection(state.projectId, store.paramSelectionQuery.value)
    state.legend = await api.getLegend(state.projectId, state.selectedRunIds, store.freeParamName.value)
})

watch(() => [state.selectedRunIds, state.selectedField, state.selectedRegion, state.baselineRunId], async () => {
    Promise.all(state.selectedRunIds.map(runId => api.getTraceWithField(state.projectId, runId, state.selectedRegion, state.selectedField))).then(r => {
        const selectedOverviewTraces = r.map(rawTrace => {
            const x = rawTrace.map(t => t.x)
            const y = rawTrace.map(t => t.y)
            return { x, y }
        });

        if (state.baselineRunId != "") {
            api.getRun(state.projectId, state.baselineRunId).then(baseRun => {
                api.getTraceWithField(state.projectId, state.baselineRunId, state.selectedRegion, state.selectedField).then(trace => {
                    const x = trace.map(t => t.x)
                    const y = trace.map(t => t.y)
                    const line = {
                        dash: 'dash',
                        color: "black",
                    }
                    const name = state.selectedRunIds.length <= 1 ? `run-${state.baselineRunId}` : `${freeParamName.value}=${baseRun.run_parameters[freeParamName.value]}`
                    let baselineOverviewTrace = {
                        x, y, line, name
                    }
                    state.overviewTraces = [...selectedOverviewTraces, baselineOverviewTrace];
                })
            })
        }
        else {
            state.overviewTraces = selectedOverviewTraces
        }
    })
})

export default store