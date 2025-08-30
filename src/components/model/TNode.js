let idCounter = 1;

export class TNode {
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
      this.mimeType = false;
    else
      window.electronAPI.getMimeType(value).then(mime => this.mimeType = mime);
  }

  constructor(label, type, children = []) {
    this.id = idCounter++;
    this._parent = null;
    this._label = null;
    this.type = type;
    this.mimeType = false;
    this.label = label;
    this.children = [];

    children.forEach(child => child.parent = this);
  }

  get extension() {
    return this.label?.split('.').pop() || '';
  }

  equals(other) {
    return other instanceof TNode && this.id === other.id;
  }
}
