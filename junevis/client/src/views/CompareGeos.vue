<template>
<div class="main container">
  <h2 class="title">Geography Overview</h2>
  <div class="row intro">
    <div class="col-12 muted">
      <p>
      This page shows the simulated impact of Covid-19 across geographical regions.
      </p>
      <p>
      <span style="color: var(--darkred)">Red curves</span> show the trend of the selected variable of interest for each region, 
      whereas the <span style="color: black">grey shading</span> reveals which regions were impacted the most over the course of each simulation. 
      Each region is colored to reflect the maximum value observed for the variable of interest
      ({{ selectedDimension }}), with values corresponding to the lightest and darkest shades shown as dots on the bottom left corner of each card.
      </p>
      <p>
      Use the dropdown menus to select the variable that is plotted on each card, and select the run parameter with which to sort these cards (optional). 
      Clicking on a card will take you to the <span class="tab">Compare Runs</span> page to view the run in more detail.
      </p>
    </div>
  </div>

  <!--  <div>{{ availableDimensions }}</div>-->
  <div class="optionBox">
    <label for="dimSel">Variable of Interest: </label>
    <select v-model="selectedDimension" id="dimSel">
      <option :value="dim" v-for="dim in availableDimensions">
        {{ dim }}
      </option>

    </select>
  </div>

  <div class="optionBox">
    <label for="sortSel">Sort by: </label>
    <select v-model="sortByMeta" id="sortSel">
      <option :value="dim" v-for="dim in availableMetas">
        {{ dim }}
      </option>

    </select>
  </div>


  <div v-for="md in mapData" class="geoInfo" @click="linkToDetail(md.runMeta)">

    <div>Run {{ md.runMeta.ID }}</div>
    <div class="small" v-for="key in Object.keys(md.runMeta)">
      <span :class="key===sortByMeta?'sortedBy':''">{{ key }}</span>:
      {{ md.runMeta[key] }}
    </div>
    <div class="map">
      <ChoroplethMap
        :shapes="shapes"
        :values="md.values"
        :sparklines="md.sparklines"
        :projection="projection"
        :width="cm_width"
        :height="cm_height"
      />
    </div>

  </div>

</div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref, watch,
  watchEffect
} from "@vue/runtime-core";
import {
  allRegions,
  getGeoData, getGeoProjection, getRegionTrace,
  getRuns, numericFields,
  projectRunParameters
} from "@/api/API";
import ChoroplethMap from "@/components/ChoroplethMap.vue";
import {
  ExtendedFeatureCollection,
  ExtendedGeometryCollection,
  geoMercator, GeoPermissibleObjects,
  GeoProjection
} from "d3-geo";
import {groupBy} from "lodash";
import {SiteGeo} from "@/logic/GeoTypes";
import {ascending, descending, max} from "d3-array";
import {RunData} from "@/types";
import {sort} from "ramda";
import {useRouter} from "vue-router";

type MapData = {
  values: { [key: string]: number },
  runMeta: object
  sparklines?: { [key: string]: number[] },
}


export default defineComponent({
  name: "CompareGeos",
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  components: {ChoroplethMap},
  setup(props, ctx) {
    const selectedDimension = ref("currently_infected");
    const sortByMeta = ref("")
    const mapData = ref([] as MapData[])
    const cm_width = ref(200);
    const cm_height = ref(200);
    const topx = 20;

    const availableDimensions = ref([] as string[])
    const availableMetas = ref([] as string[])


    const runMetas = ref({} as { [key: string]: object })
    const regions = ref([] as string[])

    let visibleGeoObject = {} as GeoPermissibleObjects;
    const shapes = ref(null as ExtendedGeometryCollection | null)
    const projection = ref(null as GeoProjection | null)

    let globalValues = {}

    numericFields(props.projectId).then(dims => availableDimensions.value = dims)


    const calculateProjecion = (geoObj: ExtendedFeatureCollection) => {
      const geoProjection = geoMercator();
      geoProjection.fitSize([cm_width.value, cm_height.value], geoObj);
      return geoProjection;
    }

    const updateAll = () => {
      mapData.value = [];
      const metaEntries = Object.entries(runMetas.value) as [string, { [key: string]: any }][];
      if (metaEntries.length > 0)
        availableMetas.value = Object.keys(metaEntries[0][1]);
      metaEntries.sort((a, b) => descending(a[1][sortByMeta.value], b[1][sortByMeta.value])).slice(0, topx).forEach(([runID, runM]) => {
        const runMeta = Object.assign({}, runM, {"ID": runID})

        // runMeta["ID"] = runID
        Promise.all(regions.value.map(region => getRegionTrace(props.projectId, runID, region)))
          .then(regionTraces => {
            const sparklines = {} as { [key: string]: number[] }
            const values = {} as { [key: string]: number }
            regions.value.forEach((regionID, i) => {
              sparklines[regionID] = regionTraces[i].map(t => +(t[selectedDimension.value] as number))
              values[regionID] = max(sparklines[regionID]) as number;
            })
            const mapDataEntry: MapData = {
              runMeta,
              values,
              sparklines
            }
            mapData.value.push(mapDataEntry)
            //@ts-ignore
            mapData.value.sort((a, b) => descending(a.runMeta[sortByMeta.value], b.runMeta[sortByMeta.value]))
          })
      })

    }

    watch(() => [selectedDimension.value, sortByMeta.value], () => {
      updateAll();
    })


    const router = useRouter();
    const linkToDetail = (e: any) => {
      // const path = {
      //   name: "geoRun", params: {
      //     projectId: props.projectId,
      //     runId: e.ID,
      //     dim: selectedDimension.value
      //   }
      // }
      const path = `/${props.projectId}/runDetails/${e.ID}`;
      router.push({ path });
      // router.push(path);
    }


    onMounted(() => {
      Promise.all([allRegions(props.projectId), getGeoData(props.projectId), projectRunParameters(props.projectId)])
        .then(([r, geoData, rM]: [string[], any, { [key: string]: object }]) => {
          // projection:
          const regionsSet = new Set(r)
          visibleGeoObject = {
            type: "FeatureCollection",
            features: geoData.features
              .filter((f: SiteGeo) => (regionsSet.has(f.properties.SSID)
                || r.length === 0))
          };
          projection.value = calculateProjecion(visibleGeoObject);
          shapes.value = geoData;
          runMetas.value = rM
          regions.value = r

          updateAll()

        })

    })


    return {
      mapData,
      shapes,
      projection,
      cm_width,
      cm_height,
      sortByMeta,
      selectedDimension,
      availableDimensions,
      availableMetas,
      topx,
      linkToDetail
    }
  }
})
</script>

<style scoped lang="scss">

.main {
  margin: 1rem 2rem;
}

.map {
  margin: 5px 0;
  pointer-events: none;
}

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


.geoInfo {
  display: inline-block;
  margin: 3px;
  padding: 5px;
  border: 1px black solid;
  border-radius: 5px;

  &:hover {
    background-color: #eee;
  }
}

.sortedBy {
  font-weight: 800;
}

.small {
  font-family: monospace;
  font-size: 8pt;
}


</style>
