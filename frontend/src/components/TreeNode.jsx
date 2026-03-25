import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

function TreeNode({ node, level = 0, nodeStates, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  
  const state = nodeStates.get(node.id) || { checked: false, indeterminate: false };
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state.indeterminate;
    }
  }, [state.indeterminate]);

  return (
    <div className="flex flex-col">
      <div 
        className={clsx(
          "flex items-center gap-2 py-1.5 hover:bg-gray-800 rounded px-2 transition-colors",
          state.checked && "text-blue-300 font-medium"
        )}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        <div 
          className="w-5 h-5 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-100"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
        </div>
        
        <input
          type="checkbox"
          ref={checkboxRef}
          checked={state.checked || false}
          onChange={(e) => onToggle(node.id, e.target.checked)}
          className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-2 cursor-pointer accent-blue-500"
        />
        
        <span className="select-none text-sm cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis" onClick={() => onToggle(node.id)}>
          {node.title}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              nodeStates={nodeStates} 
              onToggle={onToggle} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TreeNode;
