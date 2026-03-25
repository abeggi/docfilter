import React, { useState, useEffect, useRef } from 'react';
import { getTemplateInfo, uploadTemplate } from '../api/client';
import { UploadCloud, File, Calendar, HardDrive, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function Settings() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      const data = await getTemplateInfo();
      setInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('Formato non valido. Carica solo file .docx');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess(false);
      
      const res = await uploadTemplate(file);
      setInfo({
        name: res.name,
        upload_date: res.upload_date,
        size_bytes: res.size_bytes
      });
      setSuccess(true);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Errore durante il caricamento del file.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-100 flex items-center gap-2">
          Impostazioni Template
        </h2>
        
        <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-700/50 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Template Attuale</h3>
          
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={16}/> Caricamento info...</div>
          ) : info?.name ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded text-blue-400"><File size={20} /></div>
                <div className="overflow-hidden">
                  <p className="text-xs text-gray-500">Nome file</p>
                  <p className="font-medium truncate" title={info.name}>{info.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded text-emerald-400"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500">Data caricamento</p>
                  <p className="font-medium">{formatDate(info.upload_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2 rounded text-purple-400"><HardDrive size={20} /></div>
                <div>
                  <p className="text-xs text-gray-500">Dimensione</p>
                  <p className="font-medium">{formatSize(info.size_bytes)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 italic">Nessun template attualmente caricato.</div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Carica Nuovo Template</h3>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-blue-200">
              Il caricamento di un nuovo template sostituirà quello corrente in modo permanente. Assicurati che il documento sia in formato .docx e contenga gli stili di titolo corretti (Heading 1, 2, 3).
            </p>
          </div>

          <label 
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-700/50 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-400">Caricamento in corso...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-gray-300">Clicca per caricare</span> o trascina il file qui</p>
                  <p className="text-xs text-gray-500">Solo file Microsoft Word (.docx)</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              onChange={handleFileChange}
              disabled={uploading}
              ref={fileInputRef}
            />
          </label>

          {error && <p className="text-red-400 text-sm mt-2 flex items-center gap-1.5"><AlertTriangle size={14}/> {error}</p>}
          {success && <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1.5"><CheckCircle2 size={14}/> Template caricato con successo!</p>}
        </div>
      </div>
    </div>
  );
}

export default Settings;
