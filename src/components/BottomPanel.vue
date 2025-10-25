<script setup>
import { inject } from 'vue';

const isDev = inject('isDev');

const { selected } = defineProps({
  selected: {
    type: Object,
    required: true
  }
});
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
