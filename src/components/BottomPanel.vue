<script setup>
import { inject } from 'vue';
import pkg from '../../package.json';

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
    version: {{ pkg.version }}
    
    <div v-if="isDev">
      selected.nodes: {{ selected.nodes.map(s => s.label) }}
      <br/>
      selected.last: "{{ selected.last?.label }}"
    </div>
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
