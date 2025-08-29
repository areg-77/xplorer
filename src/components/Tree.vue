<script setup>
import { ref } from 'vue';
import { TNode } from './model/TNode';
import TreeNode from './TreeNode.vue';

const tree = [
  new TNode('Assets', 'folder', [
    new TNode('Characters', 'folder', [
      new TNode('hero', 'folder', [
        new TNode('hero.fbx', 'file')
      ])
    ]),
    new TNode('Environment', 'folder', [
      new TNode('building', 'folder', [
        new TNode('building.fbx', 'file')
      ])
    ])
  ]),
  new TNode('Settings', 'folder', [
    new TNode('graphics.dll', 'file'),
    new TNode('sfx.dll', 'file')
  ]),
  new TNode('project.json', 'file')
];

const selectedNodes = ref([]);

function handleSelect(node) {
  const idx = selectedNodes.value.findIndex(n => n.equals(node));
  if (idx === -1)
    selectedNodes.value.push(node);
  else
    selectedNodes.value.splice(idx, 1);
}

</script>

<template>
  <div class="treeview" @click.self="selectedNodes = []">
    <ul>
      <TreeNode v-for="node in tree" :key="node.id" :node="node" @select="handleSelect" :selected-nodes="selectedNodes"/>
    </ul>
  </div>
</template>

<style scoped>
.treeview {
  background-color: var(--region-light);
  padding: 1px;
  border: 1px solid var(--border-dark);
  border-radius: calc(var(--border-radius) + 2px);

  width: 350px;
  height: 350px;
  font-size: 13px;

  overflow: auto;
}
</style>

<style>
.treeview ul {
  margin: 0;
  padding: 0;
  min-width: fit-content;
  overflow: hidden;
}
</style>
