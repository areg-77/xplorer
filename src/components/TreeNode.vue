<script setup>
import { computed, inject, onUpdated } from 'vue';

const { node } = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select', 'drag-drop']);

const { selectedNodes } = inject('selection');
const selected = computed(() => selectedNodes.some(n => n.equals(node)));

const styles = computed(() => {
  const siblings = node.parent?.children || [];
  const index = siblings.findIndex(n => n.equals(node));
  const prev = selected.value && index > 0 && selectedNodes.some(n => n.equals(siblings[index - 1])) && (!siblings[index - 1].expanded || siblings[index - 1].children.count === 0);
  const next = selected.value && index < siblings.length - 1 && selectedNodes.some(n => n.equals(siblings[index + 1])) && (!node.expanded || node.children.count === 0);

  const nodeStyle = {
    ...(prev && { borderTopLeftRadius: "0", borderTopRightRadius: "0" }),
    ...(next && { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" })
  };
  
  return selected.value && node.expanded && node.children?.length
    ? { node: { ...nodeStyle, borderBottomRightRadius: "0" }, ul: { borderTopRightRadius: "0" } }
    : { node: nodeStyle, ul: {} };
});

function onDragStart(e) {
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('node-id', node.id);

  e.dataTransfer.setData('text/plain', node.path);

  const img = document.createElement('img');
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
  e.dataTransfer.setDragImage(img, 0, 0);
}

function onDrop(e) {
  e.preventDefault();
  emit('drag-drop', { currentNodeId: e.dataTransfer.getData('node-id'), targetNode: node });
}

onUpdated(() => {
  console.log(`%c"${node.label}" updated`, 'color: greenyellow;');
});
</script>

<template>
  <li :key="node.vIndex">
    <div class="tree-node" :class="{ selected: selected }" :style="styles.node" draggable="true" @dragstart="onDragStart" @drop="onDrop" @dragenter.prevent @dragover.prevent>
      <div class="expander-container" :class="{ hidden: node.type !== 'folder' || !node.children?.length }" @click="node.expanded = !node.expanded">
        <span class="expander" :class="{ opened: node.expanded }"></span>
      </div>
      <div class="label-container" @click="emit('select', node)">
        <span :class="['tree-icon', 'icon', node.type, node.mimeType ? node.mimeType.replace('/', ' ') : null, node.extension].filter(Boolean).join(' ')"></span>
        <span class="tree-label">{{ node.label }}</span>

        <span class="tree-parameter">id: "{{ node.id }}"</span>
        <span v-if="node.type !== 'folder'" class="tree-parameter">mime: "{{ node.mimeType }}"</span>
        <!-- <span v-if="node.type !== 'folder'" class="tree-parameter">ext: "{{ node.extension }}"</span> -->
        <span class="tree-parameter">path: "{{ node.path }}"</span>
        <!-- <span class="tree-parameter">childrens: "{{ node.childrens().map(c => c.label) }}"</span> -->
      </div>
    </div>
    <div class="children-container" :class="{ opened: node.expanded }">
      <transition-group tag="ul" name="list" :style="styles.ul">
        <TreeNode v-for="child in node.children" :key="child.id" :node="child" @select="$emit('select', $event)" @drag-drop="$emit('drag-drop', $event)"/>
      </transition-group>
    </div>
  </li>
</template>

<style scoped>
ul {
  padding-left: 0.9em !important;
  border-radius: calc(var(--border-radius) + 1px);
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;

  transition: background-color 200ms, border-radius 150ms;
}
.tree-node.selected + .children-container.opened > ul {
  transition-delay: 100ms 0ms;
  background-color: var(--secondary-dark);
  margin-right: 1px; /* might cause a bug */
}

li {
  list-style: none;
}
li:hover > .children-container.opened {
  border-color: var(--border-light);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 1px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);

  transition: background-color 150ms, border-radius 150ms;
}
.tree-node:hover {
  background-color: var(--secondary);
  border-color: var(--border);
}
.tree-node.selected {
  background-color: var(--secondary-light);
  border-color: var(--border-light);
}
.tree-node.selected:hover {
  background-color: var(--secondary-lighter);
}

.expander-container {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex: 0 0 1.8em;

  cursor: pointer;
}
.expander-container.hidden {
  visibility: hidden;
}

.expander {
  border-right: 1px solid var(--border-lighter);
  border-bottom: 1px solid var(--border-lighter);
  height: 0.5em;
  aspect-ratio: 1;
  transform: rotate(-45deg);

  transition: transform 250ms;
}
.expander.opened {
  transform: rotate(45deg);
}

.label-container {
  flex: 1;
  display: flex;
  align-items: center;
  white-space: nowrap; 
  padding: 2px 0.9em 2px 0px;
  gap: 0.3em;
}

.tree-icon {
  flex: 0 0 auto;
  height: calc(1em + 3px);
}

.tree-label {
  flex: 1 1 auto;
  white-space: nowrap;
}

.tree-parameter {
  color: var(--fg-darker);
  font-size: 0.82em;
  opacity: 0;

  transition: opacity 125ms;
}
.tree-node:hover .tree-parameter,
.tree-node.selected .tree-parameter {
  transition-delay: 100ms;
  opacity: 1;
}

.children-container {
  display: grid;
  grid-template-rows: 0fr;
  border-left: 1px solid var(--border-dark);
  margin-left: 1em;
  opacity: 0;

  transition: grid-template-rows 250ms cubic-bezier(0.33, 0.13, 0.19, 1), border-color 350ms 100ms, opacity 450ms;
}
.children-container.opened {
  grid-template-rows: 1fr;
  opacity: 1;
}
</style>
