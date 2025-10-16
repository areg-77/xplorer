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

const emit = defineEmits(['setvalue']);
const valueRef = ref(null);

// if value was changed outside
watch(() => value, (newVal) => {
  const text = newVal ?? '';
  if (valueRef.value && valueRef.value.innerText !== text)
    valueRef.value.innerText = text;
});

function onInput() {
  if (setMode === 'live') {
    emit('setvalue', valueRef.value?.innerText ?? '');
  }
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
  if (!committed && setMode === 'enter' && valueRef.value && value)
    valueRef.value.innerText = value;
  committed = false;
}
</script>

<template>
  <div class="data-text" :style="borderRadiusStyle">
    <span ref="valueRef" :contenteditable="editable" spellcheck="false" @input="onInput" @keydown="onKeyDown" @blur="cancelEdit"></span>
  </div>
</template>

<style scoped>
.data-text {
  flex: 1;
  font-size: 13px;
  background-color: var(--region);
  border: 1px solid var(--border-darker);
  display: flex;
  overflow: hidden;
  align-items: center;
  height: 100%;
  border-radius: var(--border-radius);
  padding: 0 0.3em;

  transition: border-color 200ms;
}
.data-text:has(> span:focus) {
  border-color: var(--border);
}

.data-text > span {
  flex: 1;
  color: var(--fg-dark);
  overflow: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  white-space: nowrap;

  transition: color 200ms;
}
.data-text > span::-webkit-scrollbar {
  display: none;
}
.data-text > span:focus {
  color: var(--fg);
}
</style>
