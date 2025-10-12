<script setup>
import { computed } from 'vue';

const { value, borderRadiusMask } = defineProps({
  value: {
    required: true
  },
  borderRadiusMask: {
    type: String,
    default: '1111'
  }
});

const borderRadiusStyle = computed(() => {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'];
  const mask = borderRadiusMask.padEnd(4, '1');

  return Object.fromEntries(corners.map((corner, i) => mask[i] === '0' ? [`border${corner}Radius`, '0 !important'] : null).filter(Boolean));
});
</script>

<template>
  <span class="data-text" :style="borderRadiusStyle">
    {{ value }}
  </span>
</template>

<style scoped>
.data-text {
  flex: 1;
  font-size: 13px;
  background-color: var(--region);
  color: var(--fg-dark);
  border: 1px solid var(--border-darker);
  display: flex;
  overflow: hidden;
  align-items: center;
  height: 100%;
  border-radius: var(--border-radius);
  padding: 0 0.3em;
}
</style>
