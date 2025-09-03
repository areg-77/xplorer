import { ref, reactive } from "vue";

let idCounter = 1;

export class TNodeBase {
  get parent() { return this._parent; }
  set parent(value) {
    if (this._parent) {
      const idx = this._parent.children.indexOf(this);
      if (idx !== -1)
        this._parent.children.splice(idx, 1);
    }

    this._parent = value;
    this._parent.children.push(this);
  }

  get label() { return this._label; }
  set label(value) {
    this._label = value;
    if (this.type === 'folder')
      this.mimeType.value = false;
    else
      window.electronAPI.getMimeType(value).then(mime => this.mimeType.value = mime);
  }

  constructor(label, type, children = []) {
    this.id = idCounter++;
    this._parent = null;
    this._label = null;
    this.type = type;
    this.mimeType = ref(false);
    this.label = label;
    this.children = [];
    this.expanded = true;

    children.forEach(child => child.parent = this);
  }

  get extension() {
    return this.label?.split('.').pop() || '';
  }

  equals(other) {
    return other instanceof TNodeBase && this.id === other.id;
  }
}

export function TNode(label, type, children = []) {
  return reactive(new TNodeBase(label, type, children));
}
