import { ref, reactive, watch } from "vue";

let idCounter = 1;

export class TNodeBase {
  constructor(label, type, children = []) {
    this.id = idCounter++;
    this.parent = ref(null);
    this.type = ref(type);
    this.mimeType = ref(false);
    this.label = ref(label);
    this.children = reactive([]);
    this.expanded = ref(true);

    watch([this.type, this.label], ([newType, newLabel]) => {
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

    watch(() => this.children.map(child => [child.type.value, child.label.value]), () => {
      if (this.children.length <= 1) return;
      console.log(`%csorted "${this.label.value}"`, 'color: yellow;');

      this.children.sort((a, b) => {
        if (!a || !b) return 0;

        const aType = a.type?.value ?? a.type ?? "";
        const bType = b.type?.value ?? b.type ?? "";
        const aLabel = a.label?.value ?? a.label ?? "";
        const bLabel = b.label?.value ?? b.label ?? "";

        // folders first
        if (aType === "folder" && bType !== "folder") return -1;
        if (aType !== "folder" && bType === "folder") return 1;

        return aLabel.localeCompare(bLabel);
      });
    }, { deep: true });

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
