<template>
  <div class="main container">
    <h2 class="title">Compare Runs</h2>
    <div class="row intro">
      <div class="col-12 muted">
        Here, you can select your variables of interest and view results
          from any 2 runs at a given time. (Note that one set of plots will be 
          <span class="muted-3"
            >faded out</span
          > if the 2 runs are identical.)
        </div>
      </div>
    <div class="row">
      <div class="col-6">
        <Suspense>
          <template #default>
            <detailed-run-view
              ref="run1div"
              :projectId="projectId"
              :runId="run1Id"
              :axisRanges="axisRanges"
              @selected-options-change="(e) => catchRunChange(e, 'left')"
            ></detailed-run-view>
          </template>
          <template #fallback>
            <h1>Loading...</h1>
          </template>
        </Suspense>
      </div>

      <div class="col-6">
        <Suspense>
          <template #default>
            <detailed-run-view
              ref="run2div"
              :projectId="projectId"
              :runId="run2Id ? run2Id : run1Id"
              :axisRanges="axisRanges"
              :mutePlots="sameRun"
              @selected-options-change="(e) => catchRunChange(e, 'right')"
            ></detailed-run-view>
          </template>
          <template #fallback>
            <h1>Loading...</h1>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.main {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
  watch,
  watchEffect,
  PropType,
} from "@vue/runtime-core";
import router from "../router/index";
import * as api from "@/api/API";
import * as tp from "@/types";
import * as R from "ramda"
import ChoroplethMap from "@/components/ChoroplethMap.vue";
import { encompass } from "@/utils/numerical";
import DetailedRunView from "@/components/DetailedRunView.vue";

export default defineComponent({
  name: "RunDetails",
  components: { ChoroplethMap, DetailedRunView },
  props: {
    projectId: {
      type: String,
      required: true,
    },
    run1Id: {
      type: String,
      default: "1",
    },
    run2Id: {
      type: String,
      required: false,
      default: null,
    },
  },
  setup(props, ctx) {
    const unifyYAxes = true;

    const sameRun = computed(() => {
      const r1 = props.run1Id, r2 = props.run2Id
      return ( r2 == r1 || r2 == "" || r2 == null);
    });

    const run1div = ref(null as HTMLDivElement | null);
    const run2div = ref(null as HTMLDivElement | null);

    const ax1 = computed(() => {
      //@ts-ignore
      return run1div.value?.axisRangeExtents() ?? {}
    })
    const ax2 = computed(() => {
      //@ts-ignore
      return run2div.value?.axisRangeExtents() ?? {}
    })

    const axisRanges = computed(() => {
      let out: {[k: string]: [number, number] | undefined} = {}
      if (!R.isEmpty(ax1.value) && !R.isEmpty(ax2.value)) {
        Object.keys(ax1.value).forEach(k => {
          let newRange = ax1.value == undefined || ax2.value == undefined ? undefined : encompass(ax1.value[k], ax2.value[k])
          if (newRange != undefined) {
            newRange[1] = 1.03 * newRange[1] // Pad the maximum by a bit
          }
          out[k] = newRange
        })
      }
      return out
    })

    function catchRunChange(
      e: {
        fullParamData: tp.ParamOptions[];
        optionIdx: number;
        rowIdx: number;
        paramName: string;
        paramValue: number;
        prevSelectedOptionIdxs: number[];
      },
      side: "right" | "left"
    ) {
      let query: { [k: string]: any } = {};
      e.fullParamData.forEach((a, i) => {
        const optionIdx =
          i == e.rowIdx ? e.optionIdx : e.prevSelectedOptionIdxs[i];
        query[a.name] = [a.options[optionIdx]];
      });

      document.body.classList.add("working");
      api.filterByParamSelection(props.projectId, query).then((r) => {
        // Handle invalid selection
        if (r.length == 0) {
          alert(
            `No valid simulation run found for the requested parameter object: ${JSON.stringify(
              query
            )}`
          );
        } else {
          const newRunId = r[0];
          let newRoute: string;
          if (side == "left") {
            newRoute = `/${props.projectId}/runDetails/${newRunId}/${props.run2Id || props.run1Id}`
          } else if (side == "right") {
            newRoute = `/${props.projectId}/runDetails/${props.run1Id}/${newRunId}`
          } else {
            newRoute = `/${props.projectId}/runDetails/${newRunId}/${newRunId}`;
          }

          router.push(newRoute);
        }
        document.body.classList.remove("working");
      });
    }

    return {
      catchRunChange,
      sameRun,
      run1div,
      run2div,
      axisRanges
    };
  },
});
</script>

<style scoped>
.main {
  max-width: 1400px;
}
.geoInfo {
  display: inline-block;
}

.sortedBy {
  font-weight: 800;
}
.small {
  font-family: monospace;
  font-size: 8pt;
}

.opaque {
  opacity: 0.3;
}
</style>
