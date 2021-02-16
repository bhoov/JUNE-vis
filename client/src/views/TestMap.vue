<template>
    <svg :width="width" :height="height">
        <path v-for="path in paths" :d="path"/>
    </svg>
</template>

<style scoped>
path {
    fill: none;
    stroke-width: 3px;
    stroke: black;
}

</style>

<script>
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  watch,
  watchEffect,
  unref,
  computed,
} from "@vue/runtime-core";

import {
  ExtendedFeatureCollection,
  GeoGeometryObjects,
  geoMercator,
  geoPath,
  GeoProjection,
} from "d3-geo";

import {json} from "d3-fetch";

export default defineComponent({
    props: {
        width: {
            type: Number,
            default: 600
        },
        height: {
            type: Number,
            default: 300
        }
    },
    setup(props, ctx) {
        const paths = ref([])
        const geoObj = ref({})
        const getProjection = computed(() => {
            return function(geoObj) {
                return geoMercator().fitSize([props.width, props.height], geoObj)
            }
        })

        const getPaths = computed(() => {
            return function(geoObj) {
                const projection = getProjection.value(geoObj)
                const pathGen = geoPath().projection(projection)
                return geoObj.features.map(feat => pathGen(feat))
            }
        })

        const pathF = computed(() => {
            // return geoPath()
            return geoPath().projection(projection.value);
        })

        onMounted(() => {
            console.log("RUNNING MY MOUNTED")
            json("/demo/projects/surprise/sites.new.small.geojson").then(jsonData => {
                console.log("Found my data: ", jsonData)
                const p = getPaths.value(jsonData)
                paths.value = p
                // geoObj.value = jsonData
                // paths.value = jsonData.features.map(f => pathF.value(f))
            })
        })

        return {
            paths
        }
    }
})
</script>
 function parseResultShopDetails() {

      d3.json("http://localhost:1209/data/JSONfromDB_8Feb2014.json", function (error,       jsonData) {
        var color1 = d3.scale.category10();

        svg.selectAll("path")
        .data(jsonData.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .attr("text", function (d, i) { return "js"; })
                        .attr("fill", function (d, i) { return color1(i); });


    });           
}        