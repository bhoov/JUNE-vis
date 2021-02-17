<template>
  <table class="param-selector">
    <thead>
      <tr>
        <th scope="col" align="left">Parameter Name</th>
        <th scope="col" align="left">Options</th>
      </tr>
    </thead>
    <tbody>
      <!-- <td colspan="3"> <hr /> </td> -->
      <tr
        v-for="(param, i) in paramData"
        class="param-row"
        v-bind:class="{
          clickable: allowRowSelection,
          selected: selectedRowIdx == i,
        }"
        @mouseout="() => unHoverRow(i)"
      >
        <td
          class="param-name"
          :class="{ hovered: allowRowSelection && hoveredRowIdx == i }"
          @click="() => allowRowSelection && emitFree(i)"
          @mouseover="
            () => {
              allowRowSelection && hoverRow(i);
            }
          "
        >
          {{ param.name }}
        </td>
        <td class="param-options">
          <div
            class="param-cell inline"
            v-for="(option, j) in param.options"
            :class="{
              selected: selectedRowIdx != i && selectedOptionIdxs[i] == j,
              unselectable: selectedRowIdx == i,
              clickable: true,
            }"
            @click="() => emitSelectedOptions(i, j)"
          >
            {{ formatValDisplay(option) }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>


<script lang="ts">
import {
  ref,
  defineComponent,
  PropType,
  watch,
  onMounted,
  computed,
  ComputedRef,
} from "vue";

import * as tp from "../types";
import { formatValDisplay } from "@/logic/display";

interface ParamOptions {
  name: string;
  options: any[];
}

export default defineComponent({
  name: "ParamSelector",
  props: {
    paramData: {
      type: Object as PropType<ParamOptions[]>,
      required: true,
    },
    selectedOptionIdxs: {
      type: Object as PropType<(number | null)[]>,
      required: true,
    },
    freeIdx: {
      type: Number || null,
      default: null,
      required: false,
    },
    allowRowSelection: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, context) {
    const hoveredRowIdx = ref(null as number | null);
    const selectedRowIdx = computed(() =>
      props.allowRowSelection ? props.freeIdx : null
    );

    function hoverRow(i: number) {
      hoveredRowIdx.value = i;
    }
    function unHoverRow(i: number) {
      hoveredRowIdx.value = null;
    }

    function emitFree(idx: number | null) {
      context.emit("free-idx-change", { freeIdx: idx });
    }

    function emitSelectedOptions(rowIdx: number, optionIdx: number) {
      if (
        rowIdx != selectedRowIdx.value &&
        !(props.selectedOptionIdxs[rowIdx] == optionIdx)
      ) {
        const pd = props.paramData[rowIdx];
        context.emit("selected-options-change", {
          rowIdx,
          optionIdx,
          paramName: pd.name,
          paramValue: pd.options[optionIdx],
          fullParamData: props.paramData,
          prevSelectedOptionIdxs: props.selectedOptionIdxs,
        });
      }
    }

    return {
      formatValDisplay,
      emitFree,
      emitSelectedOptions,
      hoveredRowIdx,
      selectedRowIdx,
      hoverRow,
      unHoverRow,
    };
  },
  emits: ["selected-options-change", "free-idx-change"],
});
</script>

<style scoped lang="scss">
.description {
  font-weight: 500;
  font-size: 0.8rem;
  color: rgb(49, 49, 49, 0.7);
  margin-bottom: -0.6rem;
}

th {
  font-weight: 600;
  font-size: 0.9rem;
  color: rgb(49, 49, 49, 0.7);
}

.inline {
  display: inline-block;
}
.param-cell {
  margin-left: 0.3rem;
  margin-right: 0.3rem;
  border-bottom: 0.3px dashed;
}

.clickable {
  cursor: pointer !important;
}

.unselectable {
  border-bottom: none;
  cursor: default !important;
}

.param-name {
  font-weight: bold;
  border: 0;
}

.value-item {
  &:hover {
    background-color: rgba(228, 225, 225, 0.884);
  }
}

.selected {
    background-color: #47474753;
    font-weight: bold;
    cursor: default !important;
}

.error-msg {
  background-color: orange;
  color: navy;
  font-weight: 500;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 1rem;
  border: 1px solid;
  border-radius: 0.5rem;
  box-shadow: 2.5px 2.5px 2.5px #888888;
}

.param-selector {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.hovered {
  background-color: #8888886d;
}
</style>
