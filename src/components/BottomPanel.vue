<script setup>
import { ref, inject } from 'vue';

const isDev = inject('isDev');

const selected = inject('selected');
</script>

<template>
  <div class="bottom-panel">
    dev: {{ isDev }}
    <br/>
    selected.nodes: {{ selected.nodes.map(s => s.label) }}
    <br/>
    selected.last: "{{ selected.last?.label }}"
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
