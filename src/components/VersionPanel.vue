<script setup>
import { computed } from 'vue';
import VTree from './VTree.vue';
import ButtonDefault from './ButtonDefault.vue';
import DataText from './DataText.vue';
import { createVersion, deleteVersion } from './model/nodeFunctions';

const { selected, borderRadiusMask } = defineProps({
  selected: {
    type: Object,
    required: true
  },
  borderRadiusMask: {
    type: String,
    default: '1111'
  }
});

const versionPanelStyle = computed(() => {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
  const mask = borderRadiusMask.padEnd(4, '1');

  const borderStyles = Object.fromEntries(
    corners.map((corner, i) => mask[i] === '0' ? [`border${corner}Radius`, '0 !important'] : null)
      .filter(Boolean)
  );

  return borderStyles;
});

</script>

<template>
  <div class="version-panel" :style="versionPanelStyle">
    <div class="version-tools">
      <DataText :value="selected.nodes.at(-1)?.label" font-size="12px" style="color: var(--fg-dark); margin-right: 0.5em;"/>

      <ButtonDefault class="danger" @click="deleteVersion(selected.nodes.at(-1))" :disabled="selected.nodes.at(-1)?.version.index === -1">
        <span class="icon ui delete"></span>
        Delete Versions
      </ButtonDefault>
    </div>

    <VTree v-show="selected.nodes.at(-1)?.version.index !== -1" ref="vTree" :source="selected.nodes.at(-1)?.version.node" :index="selected.nodes.at(-1)?.version.index" @set-index="newIndex => selected.nodes.at(-1).version.index = newIndex" style="height: 100px;"/>      
    <VTree v-if="selected.nodes.at(-1)?.version.index === -1">
      <div class="no-version-box">
        No version available.
        <ButtonDefault class="version" @click="createVersion(selected.nodes.at(-1).parent)">
          <span class="icon ui version"></span>
          Create a Version
        </ButtonDefault>
      </div>
    </VTree>
    <!-- <ButtonDefault v-else class="danger" @click="deleteVersion(selected.nodes.at(-1))">
      <span class="icon ui delete"></span>
      Delete Version
    </ButtonDefault> -->
  </div>
</template>

<style scoped>
.version-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--region);
  border: 1px solid var(--border-darker);
  padding: 0.5rem;
  gap: 0.5rem;
  border-radius: calc(var(--border-radius) + 2px + 0.5rem);
  
}

.version-tools {
  display: flex;
  align-items: center;
  font-size: 13px;
  gap: 2px;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  padding: 2px;
  border-radius: calc(var(--border-radius) + 2px);
}

.divider {
  width: 1px;
  height: 90%;
  margin-inline: 2px;
  background-color: var(--border-darker);
}

.no-version-box {
  font-size: 14px;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  color: var(--fg-dark);
  background-color: var(--secondary-dark);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 0.5rem);
  margin: 1rem;
  padding: 0.5rem 2rem;
  gap: 0.5rem;
}
</style>
