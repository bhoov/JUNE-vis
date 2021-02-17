<template>
  <!-- <main :class="{progress: inProgress}" class="details-wrapper"> -->

  <div class="sorter" v-if="allowSorting">
    <label for="param-dropdown">Sort by:</label>
    <select name="param-dropdown" id="param-dropdown" v-model="sortByKey">
      <option v-for="k in allKeys" :value="k">{{ k }}</option>
    </select>
    <label for="order-dropdown">Order:</label>
    <select name="order-dropdown" id="order-dropdown" v-model="sortOrder">
      <option v-for="o in orderOptions" :value="o">{{ o }}</option>
    </select>
  </div>
  <transition-group name="details-wrapper" class="details-wrapper" tag="div">
    <run-summary-card
      v-for="runId in runIDsOrdered"
      :key="runId"
      :runId="runId"
      :projectId="projectId"
      :isBaseline="runId == baselineRunId"
      :observer="observer"
      :yExtent="yExtent"
      :region="region"
      :shadowColor="runColors[runId] || null"
      @set-baseline="emitBaseline"
      @card-click="emitCardClick"
      :ref="
        (el) => {
          if (el) (runCards[runId] = el);
        }
      "
    />
  </transition-group>
</template>

<style scoped lang="scss">
main {
  &.progress {
    cursor: progress;
  }
}

.details-wrapper {
  display: flex;
}
</style>

<script lang="ts">
/**
 * The asynchronous setup to browser (loading from the API)
 */
import { ref, reactive, Ref, computed } from "@vue/reactivity";
import { PropType, watch, defineComponent, watchEffect } from "vue";
import { JuneProject } from "../logic/JuneProject";
import { JuneSim } from "../logic/JuneSimulation";
import RunSummaryCard from "./RunSummaryCard.vue";
import * as api from "../api/API";
import * as tp from "../types";
import { sortBy } from "ramda";
import { lineColor } from "@/logic/display";

export default defineComponent({
  name: "RunSummaryList",
  components: { RunSummaryCard },
  props: {
    projectId: {
      type: String,
      required: true,
    },
    runKeys: {
      type: Object as PropType<string[]>,
      required: true,
    },
    selectedRuns: {
      type: Object as PropType<string[]>,
      default: [],
    },
    baselineRunId: {
      type: String,
      default: "",
    },
    allowSorting: {
      type: Boolean,
      default: true
    }
  },
  async setup(props, context) {
    const project = await api.getProject(props.projectId);
    const yExtent = project.fieldExtent([
      "currently_susceptible",
      "currently_recovered",
      "currently_infected",
    ]);
    const runCards = ref({} as { [key: string]: any });
    const allKeys = computed(() => project.sorting_parameters);
    const sortByKey = ref(allKeys.value.length > 0 ? allKeys.value[0] : "");
    const orderOptions = ["ascending", "descending"];
    const sortOrder = ref(orderOptions[0] as "ascending" | "descending");
    const region = project.all_regions[0];
    const baselineRunIdRef = ref(props.baselineRunId);
    const runColors = computed(() => {
      const out: { [k: string]: string } = {};
      props.selectedRuns.forEach((r, i) => {
        out[r] = lineColor(i);
      });
      return out;
    });
    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) {
          return;
        }

        observer.unobserve(target);
        const i = target.getAttribute("run-id") as string;
        runCards.value[i].load();
      });
    };
    const observer = new IntersectionObserver(callback, {
      // root: document.querySelector("#observer-root"),
      threshold: 0.4,
    });

    const getParam = (run: string, val: string): any => {
      return project.run_parameters[run][val];
    };

    const runIDsOrdered = computed(() => {
      return props.runKeys.sort((runA: string, runB: string) => {
        if (sortByKey.value == "ID") {
          return sortOrder.value == "ascending" ? +runA - +runB : +runB - +runA;
        }
        const runs = sortOrder.value == "ascending" ? [runA, runB] : [runB, runA];

        return (
          getParam(runs[0], sortByKey.value) - getParam(runs[1], sortByKey.value)
        );
      });
    });

    function emitBaseline(payload: { runId: string }) {
      context.emit("set-baseline", payload)
    }

    function emitCardClick(payload: { runId: number }) {
      context.emit("card-click", payload);
    }

    return {
      runIDsOrdered,
      sortOrder,
      sortByKey,
      allKeys,
      runColors,
      orderOptions,
      emitCardClick,
      emitBaseline,
      observer,
      runCards,
      region,
      yExtent,
    };
  },
  emits: ["set-baseline", "card-click"],
});
</script>    