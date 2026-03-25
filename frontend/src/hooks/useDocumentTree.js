import { useState, useCallback, useMemo } from 'react';

const getDescendantIds = (node) => {
  let ids = [];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(child.id, ...getDescendantIds(child));
    });
  }
  return ids;
};

export function useDocumentTree(initialTree = []) {
  const [tree, setTree] = useState(initialTree);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const nodesMap = useMemo(() => {
    const map = new Map();
    const traverse = (node, parentId = null) => {
      map.set(node.id, { ...node, parentId });
      if (node.children) {
        node.children.forEach(child => traverse(child, node.id));
      }
    };
    tree.forEach(root => traverse(root));
    return map;
  }, [tree]);

  const nodeStates = useMemo(() => {
    const states = new Map();

    nodesMap.forEach((_, id) => {
      states.set(id, { checked: selectedIds.has(id), indeterminate: false });
    });

    const evalNode = (nodeId) => {
      const node = nodesMap.get(nodeId);
      if (!node.children || node.children.length === 0) {
        return states.get(nodeId);
      }

      let allChecked = true;
      let allUnchecked = true;
      let someIndeterminate = false;

      node.children.forEach(child => {
        const childState = evalNode(child.id);
        if (!childState.checked) allChecked = false;
        if (childState.checked || childState.indeterminate) allUnchecked = false;
        if (childState.indeterminate) someIndeterminate = true;
      });

      const currentState = states.get(nodeId);
      if (!allUnchecked && !allChecked) {
        currentState.indeterminate = true;
        currentState.checked = false;
      } else if (allChecked) {
        currentState.checked = true;
        currentState.indeterminate = false;
      } else if (allUnchecked) {
        currentState.checked = false;
        currentState.indeterminate = false;
      }

      return currentState;
    };

    tree.forEach(root => evalNode(root.id));

    return states;
  }, [tree, selectedIds, nodesMap]);

  const toggleNode = useCallback((nodeId, forceValue) => {
    const node = nodesMap.get(nodeId);
    if (!node) return;

    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const isCurrentlySelected = prev.has(nodeId);
      const targetValue = forceValue !== undefined ? forceValue : !isCurrentlySelected;

      const idsToChange = [nodeId, ...getDescendantIds(node)];
      
      idsToChange.forEach(id => {
        if (targetValue) newSet.add(id);
        else newSet.delete(id);
      });

      return newSet;
    });
  }, [nodesMap]);

  const selectAll = useCallback(() => {
    const allIds = Array.from(nodesMap.keys());
    setSelectedIds(new Set(allIds));
  }, [nodesMap]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const getOutputIds = useCallback(() => {
    const out = [];
    nodeStates.forEach((state, id) => {
      if (state.checked) out.push(id);
    });
    return out;
  }, [nodeStates]);

  return {
    tree,
    setTree,
    nodeStates,
    toggleNode,
    selectAll,
    deselectAll,
    getOutputIds,
    hasSelection: getOutputIds().length > 0
  };
}
