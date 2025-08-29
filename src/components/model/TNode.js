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

  constructor(label, type, children = []) {
    this.id = idCounter++;
    this._parent = null;
    this.label = label;
    this.type = type;
    this.children = [];

    children.forEach(child => child.parent = this);
  }

  equals(other) {
    return other instanceof TNode && this.id === other.id;
  }
}
