<script setup>
import { ref, inject } from 'vue';

const selectedNodes = inject('selectedNodes', ref([]));
</script>

<template>
  <div class="bottom-panel">
    selectedNodes: {{ selectedNodes.map(s => s.label) }}
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
