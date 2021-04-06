<template>
  <main>
    <div class="container">
      <h2 class="title">Explore Runs</h2>
      <div class="row">
        <div class="col-4">
          <h3 class="muted">Parameter Selection</h3>
          <div class="muted">
            <strong>Click</strong> a parameter name to compare all options for
            that parameter, or click a value to select a specific run matching
            that parameter set
          </div>
          <div>
            <ParamSelector
              :freeIdx="freeIdx"
              :paramData="paramOptions"
              :selectedOptionIdxs="selectedParamIdxs"
              @selected-options-change="updateSelectedOptions"
              @free-idx-change="updateFreeIdx"
            />
          </div>
          <div>
            <label for="field-selection">Select field:</label>
            <select id="field-selection" v-model="selectedField">
              <option v-for="field in numericFields" :value="field">
                {{ field }}
              </option>
            </select>
          </div>
          <div>
            <label for="region-selection">Select region:</label>
            <select id="region-selection" v-model="selectedRegion">
              <option
                v-for="region in project.available_regions"
                :value="region"
              >
                {{ region }}
              </option>
            </select>
          </div>
        </div>
        <div class="col-8">
          <h3 class="muted">Matched Runs</h3>
          <div class="pinned-runs">
            <Suspense>
              <template #default>
                <run-summary-list
                  :projectId="projectId"
                  :runKeys="displayRuns"
                  :selectedRuns="selectedRunIds"
                  :allowSorting="false"
                  :baselineRunId="baselineRunId"
                  @set-baseline="toggleBaseline"
                  @card-click="detailedRedirect"
                ></run-summary-list>
              </template>
              <template #fallback>
                <div>Loading runs...</div>
              </template>
            </Suspense>
          </div>
        </div>
      </div>
      <div class="row">
        <PlotlyLineplot
          :plotData="overviewTraces"
          :legend="legend"
        ></PlotlyLineplot>
      </div>
    </div>
    <hr />
    <div>
      <div class="all-runs">
        <p class="muted">
          Below are all the simulations for this project. Shown on the thumbnail
          is the iconic SIR curve (Susceptible (S) = green, Infected (I) = red,
          Recovered (R) = blue). <strong>Click</strong> on any card to view more
          details.
        </p>
        <h3 class="muted">Explore all runs</h3>
        <Suspense>
          <template #default>
            <run-summary-list
              :projectId="projectId"
              :runKeys="allRunKeys"
              :selectedRuns="selectedRunIds"
              :allowSorting="true"
              :baselineRunId="baselineRunId"
              @set-baseline="toggleBaseline"
              @card-click="detailedRedirect"
            ></run-summary-list>
          </template>
          <template #fallback>
            <div>Loading runs...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 1200px;
  margin: 0 auto;
}

.left-controls {
  flex: 35%;
  margin: 0.5rem;
}

.right-controls {
  flex: 70%;
  margin: 0.5rem;
}

.flex {
  display: flex;
  flex-wrap: wrap;
}

.vl {
  border-left: 6px solid black;
  height: 100%;
}

.pinned-runs {
  overflow-x: auto;
  height: 330px;
}

/* '>>>' is syntax sugar to penetrate components */
.pinned-runs >>> .details-wrapper {
  /* flex-wrap: nowrap; */
  gap: 2rem;
  justify-content: flex-start;
  align-content: space-around;
  margin-left: 2rem;
  margin-right: 2rem;
}

.all-runs >>> .details-wrapper {
  flex-wrap: wrap;
  justify-content: space-around;
  align-content: space-around;
}
</style>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  onMounted,
  toRefs,
  computed
} from "@vue/runtime-core";
import PlotlyLineplot from "@/components/PlotlyLineplot.vue";
import ParamSelector from "@/components/ParamSelector.vue";
import RunSummaryList from "@/components/RunSummaryList.vue";
import * as api from "@/api/API";
import { JuneProject } from "@/logic/JuneProject";
import { JuneSim } from "@/logic/JuneSimulation";
import * as tp from "@/types";
import store from "@/exploreStore";
import { getRandomInt } from "@/utils/numerical";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "CompareRuns",
  components: { PlotlyLineplot, ParamSelector, RunSummaryList },
  props: {
    projectId: {
      type: String,
      required: true
    },
  },
  setup(props, context) {
    const allRunKeys = ref([] as string[]);
    const yExtent = ref([] as number[]);
    const project = ref({} as JuneProject);
    const router = useRouter();

    // Override projectId stored in state
    store.state.projectId = props.projectId

    function initState() {
      api.getProject(props.projectId).then((r) => {
        project.value = r;
        store.state.selectedRegion = project.value.available_regions[0];
        allRunKeys.value = r.runKeys;
      });

      api
        .getFieldExtent(props.projectId, [
          "currently_infected",
          "currently_susceptible",
          "currently_recovered",
        ])
        .then((r) => {
          yExtent.value = r;
        });

      // Get all parameter options
      api.getParamSelection(props.projectId).then((params) => {
        store.newParamOptions(params);
        store.state.selectedParamIdxs = params.map((x) => 0);
        const multipleOptions = params
          .map((x, i) => {
            return {
              options: x.options,
              i,
            };
          })
          .filter((o) => o.options.length > 1);
        const initFreeIdx =
          multipleOptions.length > 1 ? multipleOptions[0].i : null;
        store.state.freeIdx = initFreeIdx;
      });

      // Get default parameter selection
      api.getRunParameters(props.projectId, "1").then((r) => {
        store.updateSelectedIdxsFromParamObject(r);
      });

      // Get fields
      api.baseNumericFields(props.projectId).then((r) => {
        store.newAvailableFields(r);
      });

      // Get numeric fields
      api.baseNumericFields(props.projectId).then((r) => {
        store.newNumericFields(r);
      });
    }

    onMounted(() => {
      initState();
    });

    function updateSelectedOptions(payload: {
      rowIdx: number;
      optionIdx: number;
    }) {
      store.updateParamSelection(payload.rowIdx, payload.optionIdx);
    }

    function updateFreeIdx(payload: { freeIdx: number }) {
      store.toggleFreeIdx(payload.freeIdx);
    }

    function toggleBaseline(payload: { runId: string }) {
      payload.runId == store.state.baselineRunId
        ? store.newBaselineRunId("")
        : store.newBaselineRunId(payload.runId);
    }

    function detailedRedirect(payload: { runId: string }) {
      const path = `/${props.projectId}/runDetails/${payload.runId}`;
      router.push({ path });
    }

    const addBaselineRun = computed(() => {
      return store.state.baselineRunId && store.state.selectedRunIds.findIndex(x => x == store.state.baselineRunId) == -1
    })

    const displayRuns = computed(() => {
      return [...store.state.selectedRunIds, ...(addBaselineRun.value ? [store.state.baselineRunId] : [])]
    })


    return {
      project,
      updateSelectedOptions,
      updateFreeIdx,
      allRunKeys,
      yExtent,
      toggleBaseline,
      detailedRedirect,
      displayRuns,
      ...toRefs(store.state),
    };
  },
});
</script>