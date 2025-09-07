<script setup>
import { ref, inject } from 'vue';

const selectedNodes = inject('selectedNodes', ref([]));
</script>

<template>
  <div class="treedata">
    {{ selectedNodes.map(s => s.label) }}
  </div>
</template>

<style>
.treedata {
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
}
</style>
