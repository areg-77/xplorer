<script setup>
import Tree from './components/Tree.vue';
</script>

<template>
  <main class="maingrid">
    <Tree/>
  </main>
</template>

<style>
#app {
  height: 100%;
}

.maingrid {
  display: grid;
  overflow: hidden;
  grid-template-columns: 55fr 45fr;
  gap: 0.5rem;
  height: 100%;
}
</style>
