<script setup>

</script>

<template>
  <div class="tree-data">
    <slot></slot>
  </div>
</template>

<style>
.tree-data {
  display: flex;
  overflow-y: auto;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  padding: 1rem;
}
</style>
