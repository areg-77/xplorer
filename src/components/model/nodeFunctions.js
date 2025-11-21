export function nodeById(id, tree) {
  id = Number(id);
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = nodeById(id, child);
    if (found) return found;
  }
  return null;
}

export function nodeByPath(path, tree) {
  path = path.replace(/\\/g, '/');
  if (tree.path === path) return tree;
  for (const child of tree.children) {
    const found = nodeByPath(path, child);
    if (found) return found;
  }
  return null;
}

export function addNode(parent, label, type) {
  if (type === 'folder')
    window.explorer.createFolder(parent?.path, label);
}

export function deleteNodes(nodes) {
  Promise.all(nodes.map(n => window.explorer.delete(n.path)));
}

export function renameNode(path, value) {
  window.explorer.rename(path, window.explorer.dirname(path) + '/' + value);
}
