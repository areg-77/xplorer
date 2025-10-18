<script setup>
import { ref, computed, watch } from 'vue';

const { value, setMode, borderRadiusMask, editable } = defineProps({
  value: {
    required: true
  },
  setMode: {
    type: String,
    default: 'enter',
    validator: v => ['live', 'enter'].includes(v)
  },
  borderRadiusMask: {
    type: String,
    default: '1111'
  },
  editable: Boolean
});

const borderRadiusStyle = computed(() => {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
  const mask = borderRadiusMask.padEnd(4, '1');

  return Object.fromEntries(corners.map((corner, i) => mask[i] === '0' ? [`border${corner}Radius`, '0 !important'] : null).filter(Boolean));
});

const emit = defineEmits(['setvalue', 'livevalue']);
const valueRef = ref(null);

// if value was changed outside
watch(() => value, (newVal) => {
  const text = newVal ?? '';
  if (valueRef.value && valueRef.value.innerText !== text)
    valueRef.value.innerText = text;
});

function onInput() {
  const text = valueRef.value?.innerText ?? '';

  emit('livevalue', text);
  if (setMode === 'live')
    emit('setvalue', text);
}

let committed = false;

function onKeyDown(e) {
  if (setMode === 'enter' && e.key === 'Enter') {
    e.preventDefault();
    committed = true;
    emit('setvalue', valueRef.value?.innerText ?? '');
    valueRef.value?.blur();
  }
  else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
    valueRef.value?.blur();
  }
}

function cancelEdit() {
  if (!committed && setMode === 'enter' && valueRef.value && value && valueRef.value.innerText !== value) {
    valueRef.value.innerText = value;
    emit('livevalue', value);
  }
  committed = false;
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();
}
</script>

<template>
  <div class="data-text" :style="borderRadiusStyle">
    <div class="value-container">
      <slot></slot>
      <div class="text-value" ref="valueRef" :contenteditable="editable" spellcheck="false" @input="onInput" @keydown="onKeyDown" @blur="cancelEdit"></div>
    </div>
  </div>
</template>

<style scoped>
.data-text {
  flex: 1;
  overflow: hidden;
  background-color: var(--region);
  border: 1px solid var(--border-darker);
  height: 100%;
  border-radius: var(--border-radius);

  transition: border-color 200ms;
}
.data-text:has(.value-container > .text-value:focus) {
  border-color: var(--border);
}

.value-container {
  opacity: 0.7;
  font-size: 13px;
  display: flex;
  gap: 0.3em;
  align-items: center;
  height: 100%;
  padding: 0 0.3em;

  transition: opacity 200ms;
}
.value-container:has(> .text-value:focus) {
  border-color: var(--border);
  opacity: 1;
}

.value-container > .text-value {
  flex: 1;
  color: var(--fg);
  overflow: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  white-space: nowrap;
}
.value-container > .text-value::-webkit-scrollbar {
  display: none;
}
.value-container > .text-value:focus {
  opacity: 1;
}
</style>
