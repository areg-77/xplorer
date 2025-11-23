<script setup>
import { ref, computed, inject } from 'vue';
import { isSNode } from './model/SNode';

const { node } = defineProps({
  node: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['select', 'deselect', 'dragdrop']);

const selected = inject('selected');
const isSelected = computed(() => selected && isSNode(selected) ? selected.nodes.some(n => n.equals(node)) : false);
const isVersioned = computed(() => node.version.index !== -1);

const draggable = inject('draggable');

const styles = computed(() => {
  if (!isSNode(selected)) return { node: {}, ul: {} };

  const siblings = node.parent?.children || [];
  const index = siblings.findIndex(n => n.equals(node));
  const prev = isSelected.value && index > 0 && selected.nodes.some(n => n.equals(siblings[index - 1])) && (!siblings[index - 1].expanded || siblings[index - 1].children.count === 0);
  const next = isSelected.value && index < siblings.length - 1 && selected.nodes.some(n => n.equals(siblings[index + 1])) && (!node.expanded || node.children.count === 0);

  const nodeStyle = {
    ...(prev && { borderTopLeftRadius: "0", borderTopRightRadius: "0" }),
    ...(next && { borderBottomLeftRadius: "0", borderBottomRightRadius: "0" })
  };
  
  return isSelected.value && node.expanded && node.children?.length
    ? { node: { ...nodeStyle, borderBottomRightRadius: "0" }, ul: { borderTopRightRadius: "0" } }
    : { node: nodeStyle, ul: {} };
});

function clickSelect() {
  if (!isSNode(selected)) return;
  emit('select', node);
}

function toggleExpand() {
  node.expanded = !node.expanded;
  node.childrens().forEach(c => emit('deselect', c));
}

function onDragStart(e) {
  if (!draggable) return;

  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('node-id', node.id);
  e.dataTransfer.setData('text/plain', node.path);

  const img = document.createElement('img');
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
  e.dataTransfer.setDragImage(img, 0, 0);
}

function selfOrParent() {
  return node.type === 'folder' ? node : node.parent;
}

function onDragEnter() {
  if (!draggable) return;

  const self = selfOrParent();
  if (!self.dragCounter) self.dragCounter = 0;
  self.dragCounter++;
}

function onDragLeave() {
  if (!draggable) return;

  const self = selfOrParent();
  if (!self.dragCounter) self.dragCounter = 0;
  self.dragCounter--;
  if (self.dragCounter < 0) self.dragCounter = 0;
}

const isDragOver = computed(() => node.dragCounter > 0);

function onDrop(e) {
  if (!draggable) return;

  const self = selfOrParent();
  self.dragCounter = 0;

  emit('dragdrop', { currentNodeId: e.dataTransfer.getData('node-id'), targetNode: node });
}
</script>

<template>
  <li v-if="!node.hidden" :class="{ 'drag-over': isDragOver }">
    <div class="tree-node" :class="{ selected: isSelected, version: isVersioned }" :style="styles.node" :draggable="draggable" @dragstart="onDragStart" @drop.prevent="onDrop" @dragenter.prevent="onDragEnter" @dragleave="onDragLeave">
      <div class="expander-container" :class="{ hidden: node.type !== 'folder' || !node.children?.filter(c => !c.hidden).length }" @click="toggleExpand">
        <span class="expander" :class="{ opened: node.expanded }"></span>
      </div>
      <div class="content-container" @click="clickSelect">
        <span class="tree-icon icon" :class="[node.type, ...(node.type !== 'folder' ? [node.mimeType ? node.mimeType.replace('/', ' ') : null, node.extension] : [])].filter(Boolean).join(' ')"></span>
        <div class="label-container">
          <transition name="label-scroll">
            <span class="tree-label" :key="node.label">{{ node.label }}</span>
          </transition>
        </div>

        <!-- <span class="tree-parameter">id: "{{ node.id }}"</span> -->
        <!-- <span v-if="node.type !== 'folder'" class="tree-parameter">mime: "{{ node.mimeType }}"</span> -->
        <!-- <span v-if="node.type !== 'folder'" class="tree-parameter">ext: "{{ node.extension }}"</span> -->
        <!-- <span class="tree-parameter">path: "{{ node.path }}"</span> -->
        <!-- <span class="tree-parameter">childrens: "{{ node.childrens().map(c => c.label) }}"</span> -->
      </div>
    </div>
    <div class="children-container" :class="{ opened: node.expanded }">
      <transition-group tag="ul" name="list" :style="styles.ul">
        <TreeNode v-for="child in node.children" :key="child.id" :node="child" @select="$emit('select', $event)" @deselect="$emit('deselect', $event)" @dragdrop="$emit('dragdrop', $event)"/>
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
  margin-right: 1px;
}

li {
  list-style: none;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  border-radius: var(--border-radius);
  transition: background-color 150ms;
}
li:hover > .children-container.opened {
  border-color: var(--border-light);
}
li.drag-over {
  background-color: var(--secondary-dark);
  outline: 1px solid var(--border-dark);
  outline-offset: -1px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 1px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  box-sizing: border-box;

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

.tree-node.version:not(.selected):hover {
  background-color: var(--version-region-dark);
  border-color: var(--version-region);
}
.tree-node.version.selected {
  border-color: var(--version-region-light);
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
  border-right: 1px solid var(--fg-darker);
  border-bottom: 1px solid var(--fg-darker);
  height: 0.5em;
  aspect-ratio: 1;
  transform: rotate(-45deg);

  transition: transform 250ms;
}
.expander.opened {
  transform: rotate(45deg);
}

.content-container {
  color: var(--fg);
  flex: 1;
  display: flex;
  align-items: center;
  white-space: nowrap; 
  padding: 2px 0.9em 2px 0px;
  gap: 0.3em;

  transition: color 200ms;
}
.tree-node.version .content-container {
  color: var(--version-fg);
}

.tree-icon {
  flex: 0 0 auto;
  height: calc(1em + 3px);
}

.tree-label {
  /* flex: 1 1 auto; */
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

.label-container {
  position: relative;
  overflow: hidden;
  flex: 1 1 auto;
  gap: 0.3em;
  display: inline-flex;
  align-items: center;
}

.label-scroll-enter-active,
.label-scroll-leave-active {
  transition: transform 250ms;
}

.label-scroll-enter-from {
  transform: translateY(-100%);
}

.label-scroll-enter-to,
.label-scroll-leave-from {
  transform: translateY(0);
}

.label-scroll-leave-to {
  transform: translateY(100%);
}

.label-scroll-leave-active {
  position: absolute;
}
</style>
