<template>
  <svg :width="width" :height="height">
    <path
      class="site"
      :id="shapePath.f.properties.SSID"
      v-for="shapePath in renderShapes"
      :d="shapePath.path"
      :style="`fill: ${shapePath.color}`"
      @mouseenter="selectedID = `${shapePath.f.properties.SSID}`"
      @mouseleave="selectedID = null"
    ></path>

    <path
      v-for="sl in sparklineData"
      :d="sl.line"
      class="sparkline"
      :transform="`translate(${sl.lineOffset[0] + ',' + sl.lineOffset[1]})`"
    />
    <!--      :transform="`translate(${(sl.centroid[0]-25)+','+(sl.centroid[1]-10)})`"-->

    <!--    <text x="2" y="50">overlay</text>-->
    <path
      v-for="sl in sparklineData"
      :d="sl.line"
      :transform="`translate(5,5)`"
      style="opacity: 0.3"
      class="sparkline"
    />
    <circle
      v-for="dot in sparklineDots"
      :cx="dot.pos[0] + 5"
      :cy="dot.pos[1] + 5"
      r="2"
      class="sparklineDot"
    ></circle>

    <circle
      v-for="dot in sparklineDots"
      :cx="dot.pos[0]"
      :cy="dot.pos[1]"
      class="sparklineDot"
      r="2"
      :transform="`translate(${dot.lineOffset[0] + ',' + dot.lineOffset[1]})`"
    ></circle>
    <!--      :transform="`translate(${(dot.centroid[0]-25)+','+(dot.centroid[1]-10)})`"-->

    <!--    </path>-->

    <!--    <circle-->
    <!--      v-for="shapePath in shapePaths"-->
    <!--      class="noReact"-->
    <!--      :cx="shapePath.centroid[0]"-->
    <!--      :cy="shapePath.centroid[1]"-->
    <!--      :r=3-->
    <!--    ></circle>-->
  </svg>
  <!--  <div>{{sparklineDotIndex}}: {{sparklineDots}} </div>-->
  <div>
    <div v-for="li in legendInfo" class="legendItem">
      <div
        class="inlineBox colorBox"
        :style="{ 'background-color': li.color }"
      ></div>
      <div class="inlineBox">{{ li.value }}</div>
    </div>
  </div>
  <!--  <pre>{{ sparklineData }}</pre>-->
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  watch,
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
import { SiteGeo } from "@/logic/GeoTypes";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { prop } from "ramda";
import { line } from "d3-shape";

export interface CM_Path {
  f: SiteGeo;
  path: string;
  color: string | null;
  centroid: number[];
}

export default defineComponent({
  name: "ChoroplethMap",
  props: {
    shapes: {
      type: Object as PropType<ExtendedFeatureCollection>,
      required: true,
    },
    values: {
      type: Object as PropType<{ [key: string]: number }>,
      required: true,
    },
    valueRange: {
      type: Object as PropType<[number, number]>,
      default: null,
    },
    sparklines: {
      type: Object as PropType<{ [key: string]: number[] }>,
      default: null,
    },
    sparklineDotIndex: {
      type: Number,
      default: -1,
    },
    projection: {
      type: Function as PropType<GeoProjection>,
      default: null,
    },
    width: {
      type: Number,
      default: 400,
    },
    height: {
      type: Number,
      default: 400,
    },
  },
  setup(props, ctx) {
    // define reactive vars
    const renderShapes = ref([] as CM_Path[]);

    const getPathgen = () => {
      let projection = props.projection;
      if (projection == null) {
        projection = geoMercator();
        projection.fitSize([props.width, props.height], props.shapes);
      }

      return geoPath().projection(projection);
    };

    const maxRange = computed(() => {
      if (props.valueRange == null) {
        return extent(Object.entries(props.values).map((v) => v[1])) as [
          number,
          number
        ];
      } else {
        return props.valueRange;
      }
    });

    const colorScale = computed(() => {
      return scaleLinear<string>()
        .domain(maxRange.value)
        .range(["#ccc", "#333"]);
    });

    const legendInfo = computed(() => {
      return maxRange.value.map((value) => ({
        value,
        color: colorScale.value(value),
      }));
    });

    // convert props to renderShapes
    const generateRenderData = computed(() => {
      return () => {
        const pathGen = getPathgen();

        const colorPerSite = (SSID: string) => {
          const value = props.values[SSID];
          return isNaN(value) ? colorScale.value.range()[0] : colorScale.value(value);
        };

        const features = props.shapes.features as SiteGeo[];
        renderShapes.value = features.map((f: SiteGeo) => {
          return {
            f,
            centroid: [0, 0],
            // centroid: pathGen.centroid(f),
            path: pathGen(f) as string,
            color: colorPerSite(f.properties.SSID),
          };
        });
      };
    });

    const sparklineDots = computed(() => {
      const index = props.sparklineDotIndex;
      const sparklineList = sparklineData.value;
      if (index > -1 && sparklineList.length > 0) {
        return sparklineList.reduce((collector, slData) => {
          if (slData.points.length > index)
            collector.push({
              pos: slData.points[index],
              centroid: slData.centroid,
              lineOffset: slData.lineOffset,
            });
          return collector;
        }, [] as any[]);
      } else {
        return [];
      }
    });

    const sparklineData = computed(() => {
      if (props.sparklines == null) return [];
      const features = props.shapes.features as SiteGeo[];
      const allSparklines = Object.entries(props.sparklines);
      let maxLength = 0;
      let maxV = -Number.MAX_SAFE_INTEGER;
      let minV = Number.MAX_SAFE_INTEGER;
      allSparklines.map(([slID, sl]: [string, number[]]) => {
        maxLength = sl.length > maxLength ? sl.length : maxLength;
        sl.forEach((s) => {
          maxV = Math.max(maxV, s);
          minV = Math.min(minV, s);
        });
      });

      const slWidth = Math.floor(
        (0.5 * props.width) / Math.sqrt(Object.keys(props.values).length + 1)
      );
      const scaleX = scaleLinear()
        .domain([0, maxLength - 1])
        .range([0, slWidth]);
      const scaleY = scaleLinear().domain([minV, maxV]).range([20, 0]);

      const lineGen = line<number[]>()
        .x((d, i) => d[0])
        .y((d, i) => d[1]);

      const pathGen = getPathgen();
      const res: {
        centroid: number[];
        lineOffset: number[];
        line: string;
        points: number[][];
      }[] = [];
      features.forEach((f: SiteGeo) => {
        const SSID = f.properties.SSID;
        const sl = props.sparklines[SSID];
        if (sl) {
          const points = sl.map((d, i) => [scaleX(i), scaleY(d)]);
          const centroid = pathGen.centroid(f);
          const lineOffset = [centroid[0] - slWidth / 2, centroid[1] - 10];
          res.push({
            centroid,
            line: lineGen(points) as string,
            lineOffset,
            points,
          });
        }
      });
      return res;
    });

    onMounted(() => {
      generateRenderData.value();
    });

    // should run less than "computed"
    watch(
      () => [props.values, props.valueRange],
      () => {
        generateRenderData.value();
      }
    );

    return {
      renderShapes,
      sparklineData,
      legendInfo,
      sparklineDots,
    };
  },
});
</script>

<style scoped lang="scss">
.sparklineDot {
  fill: #cc2949;
  pointer-events: none;
  stroke-width: 1;
  stroke: #dedede;
}

.inlineBox {
  display: inline-block;
  vertical-align: middle;
}

.colorBox {
  width: 16px;
  height: 16px;
  border-radius: 8px;
  margin-right: 2px;
}

.legendItem {
  margin-right: 5px;
  white-space: nowrap;
  display: inline-block;
}

.noReact {
  pointer-events: none;
}

.sparkline {
  fill: none;
  stroke-width: 2;
  stroke: #cc2949;
}

.site {
  fill: #ffffff;

  stroke: #2c3e50;
  stroke-width: 0.5;
  transition-duration: 50ms;

  &:hover {
    fill: #2c3e50;
    transition-duration: 200ms;
    //transform: scale(1.01);
    // fill: #3e77b1;
    stroke: #3e77b1;
    stroke-width: 2;
  }
}
</style>
