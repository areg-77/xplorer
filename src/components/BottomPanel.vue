<script setup>
import { ref, inject } from 'vue';

const { selectedNodes, lastNode } = inject('selection');
</script>

<template>
  <div class="bottom-panel">
    selectedNodes: {{ selectedNodes.map(s => s.label) }}
    <br/>
    last: "{{ lastNode?.label }}
  </div>
</template>

<style>
.bottom-panel {
  font-size: 13px;
  background-color: var(--region-light);
  padding: 1px;
  border-top: 1px solid var(--border-dark);
}
</style>
