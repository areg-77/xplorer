import { ref, reactive, watch } from "vue";

let idCounter = 1;

export class TNodeBase {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = ref(null);
    this.type = ref(type);
    this.mimeType = ref(false);
    this.label = ref(label);
    this.children = [];
    this.expanded = ref(true);

    watch([this.type, this.label], async ([newType, newLabel]) => {
      if (newType === 'folder')
        this.mimeType.value = false;
      else
        window.electronAPI.getMimeType(newLabel).then(mime => this.mimeType.value = mime);
    }, { immediate: true });

    watch(this.parent, (newParent, oldParent) => {
      if (oldParent) {
        const idx = oldParent.children.indexOf(this);
        if (idx !== -1) oldParent.children.splice(idx, 1);
      }
      if (newParent && !newParent.children.includes(this)) {
        newParent.children.push(this);
      }
    });

    children.forEach(child => child.parent = this);
  }

  get extension() {
    if (this.type.value === 'folder') return null;
    const label = this.label?.value ?? this.label ?? '';
    const idx = label.lastIndexOf('.');
    return idx > 0 ? label.slice(idx + 1) : '';
  }

  equals(other) {
    return other instanceof TNodeBase && this.id === other.id;
  }
}

export function TNode(label, type, children = []) {
  return reactive(new TNodeBase(label, type, children));
}
