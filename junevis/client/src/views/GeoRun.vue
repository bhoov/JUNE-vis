<template>
  <div class="me">
    <div class="optionBox">
      <label for="runIDSel">Run: </label>
      <select v-model="runId" id="runIDSel">
        <option :value="rm" v-for="rm in Object.keys(runMetas)">
          {{ JSON.stringify({ ID: rm, ...runMetas[rm] }) }}
        </option>
      </select>
    </div>
    <div class="optionBox">
      <label for="dimSel">Dim: </label>
      <select v-model="selectedDimension" id="dimSel">
        <option :value="dim" v-for="dim in availableDimensions">
          {{ dim }}
        </option>
      </select>
    </div>
    <geo-slider
      :projectId="projectId"
      :runId="runId"
      :selectedDimension="selectedDimension"
    />
    <!-- <ChoroplethMap
      v-if="currentMapValues"
      :shapes="shapes"
      :values="currentMapValues"
      :valueRange="fieldExtent"
      :sparklines="sparklines"
      :projection="projection"
      :width="cm_width"
      :height="cm_height"
      :sparklineDotIndex="selectedTimeIndex - 1"
    />

    <div class="slidecontainer" :style="{ 'max-width': cm_width + 'px' }">
      <input
        type="range"
        min="1"
        :max="sliderRange"
        :value="selectedTimeIndex"
        class="slider"
        id="myRange"
        @input="sliderChanged"
      />
    </div>
    <div>{{ selectedTime }}</div> -->
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from "@vue/runtime-core";
import ChoroplethMap from "@/components/ChoroplethMap.vue";
import GeoSlider from "@/components/GeoSlider.vue";
import {
  ExtendedFeatureCollection,
  ExtendedGeometryCollection,
  geoMercator,
  GeoPermissibleObjects,
  GeoProjection,
} from "d3-geo";
import {
  allFields,
  allRegions,
  getGeoData,
  getRegionTrace,
  numericFields,
  projectRunParameters,
  getFieldExtent,
} from "@/api/API";
import { SiteGeo } from "@/logic/GeoTypes";
import { ascending, max } from "d3-array";
import { RunDataNoRegionInfo } from "@/types";
import { useRoute, useRouter } from "vue-router";

type MapData = {
  values: { [key: string]: number };
  runMeta: object;
  sparklines?: { [key: string]: number[] };
};

type UrlParams = {
  project?: string;
  runId?: string;
  dim?: string;
};

export default defineComponent({
  name: "GeoRun",
  components: { ChoroplethMap, GeoSlider },
  setup(props, ctx) {
    const route = useRoute();
    const router = useRouter();

    const params = route.params as UrlParams;
    const checkURLParams = () => {
      const params = route.params as UrlParams;
      if (params.project) projectId.value = params.project;
      if (params.runId) runId.value = params.runId;
      if (params.dim) selectedDimension.value = params.dim;
    };

    const setURLParams = (addToHistory = false) => {
      const path = {
        name: "geoRun",
        params: {
          projectId: projectId.value,
          runId: runId.value,
          dim: selectedDimension.value,
        },
      };

      if (addToHistory) router.push(path);
      else router.replace(path);
    };

    watch(
      () => route.params,
      (newV, oldV) => {
        checkURLParams();
      }
    );

    const mapData = ref([] as MapData[]);
    const shapes = ref(null as ExtendedGeometryCollection | null);
    const projection = ref(null as GeoProjection | null);
    const projectId = ref(params.project || "mask_wearing");
    const runId = ref(params.runId || "6");
    const fieldExtent = ref(null as [number, number] | null);

    const availableDimensions = ref([] as string[]);
    const selectedDimension = ref(params.dim || "currently_dead");

    const currentV = ref(0);

    const allTimeSlots = ref([] as string[]);
    const selectedTimeIndex = ref(0);
    const regions = ref([] as string[]);
    const regionTraces = ref([] as RunDataNoRegionInfo[][]);
    // const sparklines = ref({} as { [key: string]: number[] });

    const runMetas = ref({} as { [key: string]: object });

    const sliderChanged = (e: any) => {
      selectedTimeIndex.value = e.target.valueAsNumber;
    };

    const cm_width = 500;
    const cm_height = 500;

    let visibleGeoObject = {} as GeoPermissibleObjects;

    const calculateProjecion = (geoObj: ExtendedFeatureCollection) => {
      const geoProjection = geoMercator();
      geoProjection.fitSize([cm_width, cm_height], geoObj);
      return geoProjection;
    };

    const sliderRange = computed(() => {
      return allTimeSlots.value.length - 1;
    });

    const selectedTime = computed(() => {
      return allTimeSlots.value[selectedTimeIndex.value];
    });

    const currentMapValues = computed(() => {
      const selIndex = selectedTimeIndex.value;
      const selDim = selectedDimension.value;

      if (
        shapes.value == null ||
        projection.value == null ||
        regionTraces.value.length < 1
      )
        return null;

      const res: { [key: string]: number } = {};
      regions.value.forEach((regionID, i) => {
        res[regionID] = regionTraces.value[i][selIndex][selDim] as number;
      });
      return res;
    });

    const sparklines = computed(() => {
      const res: { [key: string]: number[] } = {};
      regions.value.forEach((regionID, i) => {
        res[regionID] = regionTraces.value[i].map(
          (t) => +(t[selectedDimension.value] as number)
        );
      });
      return res;
    });

    const runMeta = computed(() => runMetas.value[runId.value]);

    const updateRunData = () => {
      Promise.all(
        regions.value.map((region) =>
          getRegionTrace(projectId.value, runId.value, region)
        )
      ).then((rT) => {
        regionTraces.value = rT;
        allTimeSlots.value = rT[0].map((t) => t.timestamp);
      });
    };

    const projectChange = () => {
      Promise.all([
        allRegions(projectId.value),
        getGeoData(projectId.value),
        projectRunParameters(projectId.value),
        numericFields(projectId.value),
        getFieldExtent(projectId.value, [selectedDimension.value]),
      ]).then(
        ([allRegions, geoData, runMeta2, allFields, maxRange]: [
          string[],
          any,
          { [key: string]: object },
          string[],
          [number, number]
        ]) => {
          fieldExtent.value = maxRange;
          const rM = Object.assign({}, runMeta2);
          regions.value = allRegions;
          const regionsSet = new Set(allRegions);
          visibleGeoObject = {
            type: "FeatureCollection",
            features: geoData.features.filter(
              (f: SiteGeo) =>
                regionsSet.has(f.properties.SSID) || allRegions.length === 0
            ),
          };
          projection.value = calculateProjecion(visibleGeoObject);
          //@ts-ignore
          shapes.value = visibleGeoObject;

          runMetas.value = rM;
          availableDimensions.value = allFields;
          updateRunData();
        }
      );
    };

    onMounted(() => {
      projectChange();
    });

    watch(
      () => selectedDimension.value,
      () => {
        setURLParams(true);
      }
    );

    watch(
      () => runId.value,
      () => {
        updateRunData();
        setURLParams(true);
      }
    );

    watch(
      () => projectId.value,
      (newV) => {
        projectChange();
        setURLParams(true);
      }
    );

    return {
      projectId,
      mapData,
      shapes,
      projection,
      cm_width,
      cm_height,
      sliderRange,
      selectedTimeIndex,
      selectedTime,
      sliderChanged,
      currentMapValues,
      sparklines,
      currentV,
      runId,
      runMetas,
      selectedDimension,
      availableDimensions,
      fieldExtent,
    };
  },
});
</script>

<style scoped>
label {
  font-weight: bold;
}

.optionBox {
  margin: 10px 0;
  width: 100%;
  white-space: nowrap;
}

select {
  padding: 5px;
  border: none;
  font: inherit;
}

.me {
  max-width: 700px;
  margin: 0 auto;
}

/*.slidecontainer {*/
/*  width: 100%; !* Width of the outside container *!*/
/*  max-width: 700px;*/
/*}*/

/* The slider itself */
.slider {
  -webkit-appearance: none; /* Override default CSS styles */
  appearance: none;
  width: 100%; /* Full-width */
  height: 27px; /* Specified height */
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
  border-radius: 7px;
  background: #333; /* Green background */
  cursor: pointer; /* Cursor on hover */
}

.slider::-moz-range-thumb {
  width: 25px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  border-radius: 5px;
  background: #333; /* Green background */
  cursor: pointer; /* Cursor on hover */
}
</style>
