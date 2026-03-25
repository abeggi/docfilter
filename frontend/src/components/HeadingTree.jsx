import React, { useEffect, useState } from 'react';
import { getStructure, downloadFilteredDocument } from '../api/client';
import { useDocumentTree } from '../hooks/useDocumentTree';
import TreeNode from './TreeNode';
import { Download, CheckSquare, Square, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

function HeadingTree() {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  
  const { tree, setTree, nodeStates, toggleNode, selectAll, deselectAll, getOutputIds, hasSelection } = useDocumentTree([]);

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStructure();
      setTree(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Nessun template trovato. Vai nelle Impostazioni per caricarne uno.');
      } else {
        setError('Errore durante il caricamento della struttura.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const selectedIds = getOutputIds();
    if (selectedIds.length === 0) return;
    
    try {
      setDownloading(true);
      const { blob, filename } = await downloadFilteredDocument(selectedIds);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Errore durante la generazione del documento.');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-6 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
        <p className="text-red-200 mb-4">{error}</p>
        <Link to="/settings" className="bg-red-500/20 hover:bg-red-500/30 text-red-100 px-4 py-2 rounded-md transition-colors border border-red-500/30">
          Vai alle Impostazioni
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-200">Struttura Documento</h2>
        <div className="flex gap-2">
          <button 
            onClick={selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-gray-300"
          >
            <CheckSquare size={16} /> Seleziona tutto
          </button>
          <button 
            onClick={deselectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-gray-300"
          >
            <Square size={16} /> Deseleziona tutto
          </button>
        </div>
      </div>
      
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {tree.length === 0 ? (
          <p className="text-gray-400 text-center py-10">Il template non contiene capitoli (Heading 1/2/3).</p>
        ) : (
          <div className="flex flex-col">
            {tree.map(rootNode => (
              <TreeNode 
                key={rootNode.id} 
                node={rootNode} 
                nodeStates={nodeStates} 
                onToggle={toggleNode} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800/80 mt-auto flex justify-end">
        <button
          onClick={handleDownload}
          disabled={!hasSelection || downloading}
          className={clsx(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-md",
            hasSelection && !downloading
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 hover:shadow-blue-500/40" 
              : "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600"
          )}
        >
          {downloading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Download size={18} />
          )}
          {downloading ? 'Generazione...' : 'Scarica documento filtrato'}
        </button>
      </div>
    </div>
  );
}

export default HeadingTree;
