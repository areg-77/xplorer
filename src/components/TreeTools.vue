<script setup>
import { ref, inject } from 'vue';
import DataText from './DataText.vue';

const { selectedNodes } = inject('selection');

function deleteSelected() {
  Promise.all(selectedNodes.map(s => window.explorer.delete(s.path)));
}
</script>

<template>
  <div class="tree-tools">
    <DataText :value="selectedNodes[0]?.path" font-size="12px" style="color: var(--fg-dark); margin-right: 0.5em;"/>

    <button class="icon">
      <span class="icon ui file-add"></span>
    </button>
    <button class="icon">
      <span class="icon ui folder-add"></span>
    </button>
    <button class="icon version">
      <span class="icon ui version"></span>
    </button>

    <div class="divider"></div>

    <button class="icon danger" @click="deleteSelected">
      <span class="icon ui delete"></span>
    </button>

    <div class="divider"></div>

    <button class="icon">
      <span class="icon ui dots"></span>
    </button>
  </div>
</template>

<style scoped>
.tree-tools {
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
  height: 1.5em;
  margin-inline: 2px;
  background-color: var(--border-darker);
}
</style>
