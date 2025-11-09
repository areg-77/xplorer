<script setup>
import VTreeNode from './VTreeNode.vue';

const { source: tree, index } = defineProps({
  source: Object,
  index: Number,
});

const emit = defineEmits(['set-index']);
</script>

<template>
  <div class="tree-view">
    <ul>
      <VTreeNode v-for="(node, i) in tree?.version.children" :key="node.id" :node="node" :is-selected="i === index" @select="emit('set-index', i)"/>
    </ul>
  </div>
</template>

<style scoped>
.tree-view {
  flex: 1;
  width: 100%;
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);
  font-size: 13px;

  overflow: auto;
  position: relative;
  box-sizing: border-box;
}
.tree-view:focus {
  border-color: var(--border);
}
</style>

<style>
.tree-view ul {
  margin: 0;
  padding: 0;
  min-width: fit-content;
  overflow: hidden;
}
.tree-view .children-container:not(.opened) > ul {
  min-width: 0;
}
</style>
