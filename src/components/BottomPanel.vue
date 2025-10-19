<script setup>
import { ref, inject } from 'vue';

const isDev = inject('isDev');

const { selectedNodes, lastNode } = inject('selection');
</script>

<template>
  <div class="bottom-panel">
    dev: {{ isDev }}
    <br/>
    selectedNodes: {{ selectedNodes.map(s => s.label) }}
    <br/>
    last: "{{ lastNode?.label }}"
  </div>
</template>

<style scoped>
.bottom-panel {
  font-size: 13px;
  background-color: var(--region-light);
  padding: 1px;
  border-top: 1px solid var(--border-dark);
}
</style>
