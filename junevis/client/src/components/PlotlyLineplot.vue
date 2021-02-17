<template>
  <div ref="plotDiv"></div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  computed,
  watch,
  ref,
  PropType,
  Ref,
} from "@vue/runtime-core";
import { lineColor } from "@/logic/display";
import Plotly from "plotly.js";
import * as tp from "@/types";

export default defineComponent({
  name: "PlotlyLineplot",
  props: {
    plotData: {
      type: Array as PropType<tp.Trace[]>, // Plotly information for line plot added later
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    legend: {
      type: Array as PropType<string[]>,
      default: null,
    },
    yLabel: {
      type: String,
      default: "Number of People",
    },
    yRange: {
      type: Array as PropType<number[]>,
      default: undefined,
    },
  },
  setup(props, ctx) {
    const plotDiv = ref(null as HTMLDivElement | null);

    const convertData = (data: tp.Trace[]): Partial<Plotly.PlotData>[] => {
      return data.map((v, i) => {
        return {
          type: "scatter",
          name: props.legend == undefined ? undefined : props.legend[i],
          line: { color: lineColor(i) },
          ...v,
        };
      });
    };

    const layout = computed((): Partial<Plotly.Layout>  => {
      return {
        title: props.title || undefined,
        yaxis: {
          fixedrange: false,
          title: props.yLabel,
          range: props.yRange,
        },
        xaxis: {
          // fixedrange: true,
          title: "Day",
        },
      };
    });

    function draw() {
      if (plotDiv.value != null && plotDiv.value != undefined) {
        Plotly.newPlot(
          plotDiv.value as HTMLDivElement,
          convertData(props.plotData),
          layout.value
        );
      }
    }

    function redraw() {
      if (plotDiv.value != null && plotDiv.value != undefined) {
        Plotly.react(
          plotDiv.value as HTMLDivElement,
          convertData(props.plotData),
          layout.value
        );
      }
    }

    onMounted(() => {
      draw();
    });

    watch(
      () => [props.plotData, layout.value],
      () => {
        redraw();
      }
    );

    return {
      plotDiv,
      draw,
      redraw,
    };
  },
});
</script>

<style scoped>
</style>
