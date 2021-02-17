<template>
  <div class="main">
    <div class="sticky overlay">
      <h2>Run {{ hasRun ? run.runId : "..." }}</h2>
      <param-selector
        :paramData="paramOptions"
        :selectedOptionIdxs="selectedOptionIdxs"
        :allowRowSelection="false"
        @selected-options-change="changeRun"
      />

      <!-- <label for="region-selection">Select region:</label>
      <div v-if="hasProject">
        <select id="region-selection" v-model="selectedRegion">
          <option v-for="region in project.available_regions" :value="region">
            {{ region }}
          </option>
        </select>
      </div> -->
      <hr />
    </div>

    <div v-bind:class="{ opaque: mutePlots }">
      <plotly-lineplot
        :plotData="dataSIR"
        :legend="legendSIR"
        :yRange="axisRanges['SIR']"
        :ref="plotlys['SIR']"
        title="SIR Curve"
      />

      <hr />

      <div v-if="hasLocInfo">
        <plotly-lineplot
          :plotData="dataLoc"
          :legend="legendLoc"
          :yRange="axisRanges['Loc']"
          :ref="plotlys['Loc']"
          title="Locations of Infection"
        />
      </div>
      <div v-else><h4>No location info available</h4></div>

      <hr />

      <div v-if="hasAgeInfo">
        <label for="field-selection-ages">Select field: </label>
        <select id="field-selection-ages" v-model="selectedFieldAge">
          <option v-for="field in fieldsAge" :value="field">{{ field }}</option>
        </select>

        <plotly-lineplot
          :plotData="dataAge"
          :legend="legendAge"
          :yRange="axisRanges['Age']"
          :ref="plotlys['Age']"
          title="Ages Affected"
          yLabel="Pct of Population"
        />
      </div>
      <div v-else><h4>No age info available</h4></div>

      <hr />

      <div v-if="hasProject && hasRun">
        <label for="field-selection">Select field:</label>
        <select id="field-selection" v-model="selectedFieldGeo">
          <option v-for="field in project.numeric_fields" :value="field">
            {{ field }}
          </option>
        </select>

        <geo-slider
          :projectId="projectId"
          :runId="runId"
          :selectedDimension="selectedFieldGeo"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onBeforeUpdate,
  computed,
  watch,
  watchEffect,
  reactive,
  ref,
  toRefs,
  PropType,
  Ref,
} from "@vue/runtime-core";
import * as api from "@/api/API";
import * as tp from "@/types";
import * as d3 from "d3";
import { JuneProject, isAgeField } from "@/logic/JuneProject";
import { JuneSim } from "@/logic/JuneSimulation";
import PlotlyLineplot from "@/components/PlotlyLineplot.vue";
import ChoroplethMap from "@/components/ChoroplethMap.vue";
import GeoSlider from "@/components/GeoSlider.vue";
import ParamSelector from "@/components/ParamSelector.vue";
import { ExtendedFeatureCollection, GeoProjection } from "d3-geo";
import Config from "../logic/ui_config";

interface AxisRangeObject {
  SIR?: [number, number];
  Age?: [number, number];
  Loc?: [number, number];
}

export default defineComponent({
  name: "DetailedRunView",
  components: { PlotlyLineplot, ChoroplethMap, GeoSlider, ParamSelector },
  props: {
    projectId: {
      type: String,
      required: true,
    },
    runId: {
      type: String,
      required: true,
    },
    axisRanges: {
      type: Object as PropType<AxisRangeObject>,
      default: {},
    },
    mutePlots: {
      type: Boolean,
      default: false,
    },
  },
  async setup(props, context) {
    const project = ref(undefined as JuneProject | undefined);
    const run = ref(undefined as JuneSim | undefined);
    const selectedRegion = ref("");
    const paramOptions = ref([] as tp.ParamOptions[]);

    // Create objects to bind for Plotly graphs, if redrawing is needed
    const plotlys = ref({
      SIR: null,
      Age: null,
      Loc: null,
    } as { [k: string]: HTMLDivElement | null });
    onBeforeUpdate(() => {
      //@ts-ignore
      plotlys.value = {
        SIR: null,
        Age: null,
        Loc: null,
      };
    });

    const hasProject = computed((): boolean => project.value != undefined);
    const hasRun = computed((): boolean => run.value != undefined);
    const hasParamOptions = computed(
      (): boolean => paramOptions.value.length > 0
    );

    // project won't change, run can
    watchEffect(async () => {
      project.value = await api.getProject(props.projectId);
    });
    watchEffect(async () => {
      run.value = await api.getRun(props.projectId, props.runId);
    });
    watchEffect(async () => {
      run.value = await api.getRun(props.projectId, props.runId);
    });
    watchEffect(async () => {
      paramOptions.value = await api.getParamSelection(props.projectId);
    });
    watchEffect(async () => {
      selectedRegion.value = project.value?.available_regions[0] ?? "";
    });

    const selectedOptionIdxs = computed(() => {
      return hasRun.value
        ? paramOptions.value.map((p) => {
            //@ts-ignore
            return p.options.indexOf(run.value.run_parameters[p.name]);
          })
        : [];
    });

    const regionTrace = computed(() => {
      return run.value?.aggregateByRegion(selectedRegion.value) ?? [];
    });

    const xData = computed(() => {
      return Config.showRealDate
        ? regionTrace.value.map((d, i) => d.date_time)
        : regionTrace.value.map((d, i) => i);
    });

    // SIR Curve Information
    const fieldsSIR = [
      "currently_susceptible",
      "currently_infected",
      "currently_recovered",
    ];
    const fieldTracesSIR = computed(() => {
      return fieldsSIR.map((f) => regionTrace.value.map((d) => d[f]));
    });
    const dataSIR = computed(() => {
      return fieldTracesSIR.value.map((t) => {
        return { x: xData.value, y: t };
      });
    });
    const legendSIR = ["susceptible", "infected", "recovered"];

    // Location of Infection Information
    const hasLocInfo = computed(() => project.value?.hasLocOfInfectionInfo)
    // const hasLocInfo = false; // For testing
    const fieldsLoc = computed(() => {
      return project.value?.locOfInfectionFields ?? [];
    });
    const fieldTracesLoc = computed(() => {
      return fieldsLoc.value.map((f) => regionTrace.value.map((d) => d[f]));
    });

    const dataLoc = computed(() => {
      return fieldTracesLoc.value.map((t) => {
        return { x: xData.value, y: t };
      });
    });
    const legendLoc = computed(() => {
      return fieldsLoc.value.map((f) => f.split("_").slice(3).join("_"));
    });

    // Age of infection information
    const hasAgeInfo = computed(() => project.value?.hasAgeInfo)
    // const hasAgeInfo = false; // For testing
    const fieldsAge = computed(() => {
      return Array.from(project.value?.ageFieldsAvailable ?? []);
    });
    const selectedFieldAge = ref("");
    watch(
      () => fieldsAge.value,
      () => {
        if (selectedFieldAge.value == "" && fieldsAge.value.length > 0) {
          selectedFieldAge.value = fieldsAge.value[0];
        }
      }
    );
    const validFieldsAge = computed(() => {
      return (
        project.value?.all_fields.filter((f) =>
          f.startsWith(selectedFieldAge.value + "_")
        ) ?? []
      );
    });
    const ageBinKeys = computed(() => run.value?.ageBinKeys() ?? []);
    const fieldTracesAge = computed(() => {
      const ageBinCounts = run.value?.ageBinCounts(regionTrace.value) ?? {};
      return validFieldsAge.value.map((f, i) => {
        if (Config.normalizeAgeBins) {
          const div = ageBinCounts[ageBinKeys.value[i]];
          //@ts-ignore
          return regionTrace.value.map((d) => +d[f] / div);
        }
        return regionTrace.value.map((d) => d[f]);
      });
    });
    const dataAge = computed(() => {
      return fieldTracesAge.value.map((t, i) => {
        return { x: xData.value, y: t };
      });
    });
    const legendAge = computed(() => {
      return validFieldsAge.value.map((f) => {
        return "Ages " + f.split("_").slice(-2).join(" - ");
      });
    });

    // Chloropleth Information
    const allRegions = computed(() => project.value?.all_regions ?? []);
    const allFields = computed(() => project.value?.baseNumericFields ?? []);

    const selectedFieldGeo = ref(
      allFields.value.length > 0 ? allFields.value[0] : ("" as string)
    );
    watch(
      () => allFields.value,
      () => {
        if (selectedFieldGeo.value == "" && allFields.value.length > 0) {
          selectedFieldGeo.value = allFields.value[0];
        }
      }
    );

    function changeRun(event: {
      rowIdx: number;
      optionIdx: number;
      paramName: string;
      paramValue: any;
    }) {
      context.emit("selected-options-change", event);
    }

    function axisRangeExtents() {
      const SIRmin = d3.min(
        fieldTracesSIR.value.map((v: unknown) => d3.min(v as number[]))
      );
      const SIRmax = d3.max(
        fieldTracesSIR.value.map((v: unknown) => d3.max(v as number[]))
      );
      const LocMin = d3.min(
        fieldTracesLoc.value.map((v: unknown) => d3.min(v as number[]))
      );
      const LocMax = d3.max(
        fieldTracesLoc.value.map((v: unknown) => d3.max(v as number[]))
      );
      const AgeMin = d3.min(
        fieldTracesAge.value.map((v: unknown) => d3.min(v as number[]))
      );
      const AgeMax = d3.max(
        fieldTracesAge.value.map((v: unknown) => d3.max(v as number[]))
      );
      return {
        SIR: [SIRmin, SIRmax],
        Loc: [LocMin, LocMax],
        Age: [AgeMin, AgeMax],
      };
    }

    function redraw() {
      //@ts-ignore
      const vs = Object.values(plotlys.value);

      //@ts-ignore
      vs.forEach((p: unknown) => p != null && p.draw());
    }

    return {
      project,
      run,
      hasProject,
      hasRun,
      selectedRegion,
      dataSIR,
      legendSIR,
      hasLocInfo,
      dataLoc,
      legendLoc,
      selectedFieldGeo,
      hasAgeInfo,
      selectedFieldAge,
      dataAge,
      legendAge,
      fieldsAge,
      paramOptions,
      selectedOptionIdxs,
      changeRun,
      axisRangeExtents,
      plotlys,
      redraw,
    };
  },
  emits: ["selected-options-change"],
});
</script>

<style scoped lang="scss">
.main {
  max-width: 1200px;
  margin: 0 auto;
}

.inline {
  display: inline-block;
}

.sticky {
  position: -webkit-sticky; /* Safari */
  position: sticky;
  top: 0;
}

.overlay {
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
}

.slidecontainer {
  width: 100%; /* Width of the outside container */
  max-width: 700px;
}

/* The slider itself */
.slider {
  -webkit-appearance: none; /* Override default CSS styles */
  appearance: none;
  width: 100%; /* Full-width */
  height: 25px; /* Specified height */
  background: #d3d3d3; /* Grey background */
  outline: none; /* Remove outline */
  opacity: 0.7; /* Set transparency (for mouse-over effects on hover) */
  -webkit-transition: 0.2s; /* 0.2 seconds transition on hover */
  transition: opacity 0.2s;
}

/* Mouse-over effects */
.slider:hover {
  opacity: 1; /* Fully shown on mouse-over */
}

/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  width: 25px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: #333; /* Green background */
  cursor: pointer; /* Cursor on hover */
}

.slider::-moz-range-thumb {
  width: 25px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: #333; /* Green background */
  cursor: pointer; /* Cursor on hover */
}

.opaque {
  opacity: 0.3;
}
</style>
