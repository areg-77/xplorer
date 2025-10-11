<script setup>
const { label, direction } = defineProps({
  label: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    default: 'horizontal'
  }
});
</script>

<template>
  <div class="data-field" :class="direction">
    <div class="data-label">
      {{ label }}
    </div>
    <div class="data-value">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.data-field {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
  background-color: var(--region);
  padding: 3px;
  border-radius: calc(var(--border-radius) + 3px);
}
.data-field.horizontal {
  flex-direction: row;
}
.data-field.vertical {
  flex-direction: column;
}

.data-label {
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: var(--control-padding-1);
}
.data-field.horizontal .data-label {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.data-field.vertical .data-label {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.data-value {
  flex: 1;
  display: flex;
  overflow: hidden;
  align-items: center;
  background-color: var(--region-light);
  border: 1px solid var(--border-dark);
  border-radius: var(--border-radius);  
  padding: 2px;
}
.data-field.horizontal .data-value {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}
.data-field.vertical .data-value {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: none;
}

/* .data-value > * {
  border-radius: calc(var(--border-radius) - 2px) !important;
} */
</style>
