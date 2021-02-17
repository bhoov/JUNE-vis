<template>
  <div
    class="card"
    :class="{ basecard: isBaseline }"
    :run-id="runId"
    :style="`color: ${
      shadowColor == null ? 'rgba(0, 0, 0, 0.3)' : shadowColor
    }`"
    ref="root"
  >
    <div class="clickable" @click="emitClick">
      <p class="title">Run {{ runId }}</p>
      <div class="run-info" v-if="isLoaded">
        <div class="thumbnail-plot">
          <svg :width="svgWidth" :height="svgHeight">
            <g class="path-list">
              <path
                v-for="path in paths"
                :d="path.path"
                :class="path.className"
                :style="path.style"
              />
            </g>
          </svg>
        </div>

        <div class="hyperparameter-display">
          <div
            v-for="[key, val] in Object.entries(run.run_parameters)"
            class="param-row"
          >
            <p class="param-name">{{ key }}:</p>
            <p class="param-val">{{ formatValDisplay(val) }}</p>
          </div>
        </div>
      </div>
      <div v-else>Loading Run...</div>
    </div>
    <div class="bottom-border">
      <button class="btn" @click="emitBaseline">
        {{ isBaseline ? "Deselect" : "Use as Baseline" }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  PropType,
  watch,
  onMounted,
  computed,
} from "vue";

import { formatValDisplay, colorway } from "@/logic/display";
import * as api from "@/api/API";

import * as tp from "../types";
import { extent } from "d3-array";
import { JuneSim } from "../logic/JuneSimulation";
import { scaleLinear, scaleTime } from "d3-scale";
import { line } from "d3-shape";

export default defineComponent({
  name: "RunSummaryCard",
  components: {},
  props: {
    projectId: {
      type: String,
      required: true,
    },
    runId: {
      type: String,
      required: true,
    },
    yExtent: {
      type: Object as PropType<[number, number]>,
      default: undefined,
    },
    xExtent: {
      type: Object as PropType<[number, number]>,
      default: undefined,
    },
    isBaseline: {
      type: Boolean,
      default: false,
    },
    observer: {
      type: Object as PropType<IntersectionObserver>,
      default: undefined,
    },
    region: {
      type: String,
      default: null, // By default use Avg
    },
    shadowColor: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const svgWidth = ref(225);
    const svgHeight = ref(150);
    const root = ref(null as HTMLDivElement | null);
    const run = ref(null as JuneSim | null);
    const run_parameters = ref({} as tp.RunParameters);
    const isLoaded = ref(false);

    // change on component start
    const trace = computed(() => {
      if (run.value == null) return [];
      if (props.region == null) return run.value.aggregateByAvgRegion();
      return run.value.aggregateByRegion(props.region);
    });

    const susceptible = computed((): number[] =>
      trace.value.map((t) => t.currently_susceptible)
    );
    const infected = computed((): number[] =>
      trace.value.map((t) => t.currently_infected)
    );
    const recovered = computed((): number[] =>
      trace.value.map((t) => t.currently_recovered)
    );

    const yExtent = computed((): [number, number] => {
      if (props.yExtent == undefined) {
        //@ts-ignore
        return extent([
          ...susceptible.value,
          ...infected.value,
          ...recovered.value,
        ]);
      }
      return props.yExtent;
    });

    const xExtent =
      props.xExtent == undefined
        ? computed((): [number, number] => [0, susceptible.value.length])
        : computed(() => props.xExtent);

    const scales = computed(() => {
      return {
        x: scaleLinear().domain(xExtent.value).range([0, svgWidth.value]),
        y: scaleLinear().domain(yExtent.value).range([svgHeight.value, 0]),
      };
    });

    const lineFct = computed(() => {
      return line<number>()
        .x((d, i) => scales.value.x(i))
        .y((d) => scales.value.y(d));
    });

    const paths = computed(() => {
      return [
        { className: "susceptible", path: lineFct.value(susceptible.value), style: `stroke: ${colorway[colorway.length - 1]}` },
        { className: "infected", path: lineFct.value(infected.value), style: `stroke: ${colorway[colorway.length - 2]}` },
        { className: "recovered", path: lineFct.value(recovered.value), style: `stroke: ${colorway[colorway.length - 3]}`  },
      ];
    });

    function formatValDisplay(val: any) {
      if (typeof val == "number") return val.toFixed(2);
      return val;
    }

    function emitBaseline() {
      context.emit("set-baseline", { runId: props.runId });
    }

    function emitClick() {
      context.emit("card-click", { runId: props.runId });
    }

    function load() {
      api.getRun(props.projectId, props.runId).then((r) => {
        run.value = r;
        isLoaded.value = true;
      });
    }

    onMounted(() => {
      if (props.observer != undefined && root.value != null) {
        props.observer.observe(root.value);
      }
    });

    return {
      run,
      paths,
      svgWidth,
      svgHeight,
      formatValDisplay,
      emitBaseline,
      emitClick,
      root,
      isLoaded,
      load,
      yExtent,
    };
  },
  emits: ["set-baseline", "card-click", "on-screen"],
});
</script>

<style lang="scss" scoped>
svg {
  display: block;
  margin: auto;
  background-color: rgb(249, 247, 247);
  //   box-shadow: 1px 1px 1px 1px #dedede;
}

.hyperparameter-display {
  font-size: 0.8rem;
}

path {
  fill: none;
  stroke-width: 2px;
}

.param-row {
  height: 1.25rem;
}

.param-name {
  font-weight: bold;
  display: inline-block;
  margin-right: 0.5rem;
}

.param-val {
  display: inline-block;
}

.inline {
  display: inline-block;
}

.plot-info {
  color: navy;
  background-color: orange;
  padding-left: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid;
  box-shadow: 2.5px 2.5px 2.5px #888888;
}

.hidden {
  visibility: hidden;
}

.card {
  /* Add shadows to create the "card" effect */
  box-shadow: 0 4px 8px 0;
  // color: rgba(200, 0, 0, 0.61);
  position: relative;
  border-radius: 5px;
  transition: 0.3s;
  width: 240px; // Make into variable
  height: 260px;
  margin-top: 1.5rem;
  padding: 0.5rem;
}

/* On mouse-over, add a deeper shadow */
.card:hover {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

/* Add some padding inside the card container */
.container {
  padding: 2px 16px;
}

.title {
  text-align: center;
  display: block;
  margin: auto;
  font-size: 1rem;
  font-weight: bold;
}

.bottom-border {
  text-align: center;
  margin: auto;
  display: block;
  position: absolute;
  bottom: -0.5rem;
  right: 5px;
}

.basecard {
  // box-shadow: 3px 3px 3px #0c0c0c6c;
  border-style: dashed;
  border-color: rgba(0,0,0,0.5);
  transition: border 0.05s;
}

p {
  color: #5d6263;
}
</style>
