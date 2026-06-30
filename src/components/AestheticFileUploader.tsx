import React, { useState, useRef } from 'react';
import { 
  Upload, HardDrive, CheckCircle2, FolderOpen, 
  FileVideo, FileImage, FileAudio, FileText, Loader2, Sparkles
} from 'lucide-react';

interface AestheticFileUploaderProps {
  onFileSelected: (url: string, name: string) => void;
  placeholderText?: string;
  id?: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'document' | 'folder';
  size: string;
}

export default function AestheticFileUploader({
  onFileSelected,
  placeholderText = "Select or paste raw photo/video asset link",
  id = "aesthetic-uploader"
}: AestheticFileUploaderProps) {
  const [activeTab, setActiveTab] = useState<'internal' | 'drive'>('internal');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [driveFolder, setDriveFolder] = useState<string>('root');
  const [selectedDriveFile, setSelectedDriveFile] = useState<GoogleDriveFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated Google Drive Files
  const driveFiles: Record<string, GoogleDriveFile[]> = {
    root: [
      { id: 'f1', name: 'Raw Video Footage Shoot', type: 'folder', size: '2 items' },
      { id: 'f2', name: 'High-Res Studio Shoot', type: 'folder', size: '3 items' },
      { id: 'd1', name: 'beach_cinematic_broll_4k.mov', type: 'video', size: '240 MB' },
      { id: 'd2', name: 'portrait_studio_lighting.tiff', type: 'image', size: '32 MB' },
      { id: 'd3', name: 'ambient_sunset_music_track.wav', type: 'audio', size: '12 MB' }
    ],
    f1: [
      { id: 'd4', name: 'commercial_model_run.mp4', type: 'video', size: '150 MB' },
      { id: 'd5', name: 'broll_shaky_take1.mov', type: 'video', size: '98 MB' }
    ],
    f2: [
      { id: 'd6', name: 'skin_retouch_raw1.jpg', type: 'image', size: '18 MB' },
      { id: 'd7', name: 'skin_retouch_raw2.jpg', type: 'image', size: '22 MB' },
      { id: 'd8', name: 'project_briefing_notes.docx', type: 'document', size: '1.2 MB' }
    ]
  };

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    // Prepare simulated local file info
    const fileId = `${Date.now()}_${encodeURIComponent(file.name)}`;
    const simulatedUrl = `https://akstar-storage.local/uploads/${fileId}`;
    const objectUrl = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      
      // Initialize global storage if not exists
      if (!(window as any).akstarStorage) {
        (window as any).akstarStorage = {};
      }

      // Format size
      let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      if (file.size > 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const fileData = {
        name: file.name,
        type: file.type,
        size: sizeStr,
        objectUrl: objectUrl,
        base64: base64Data,
        timestamp: Date.now()
      };

      (window as any).akstarStorage[simulatedUrl] = fileData;

      // Persist to localStorage if small (under 3MB) to prevent quota errors
      if (base64Data.length < 3 * 1024 * 1024) {
        try {
          const stored = localStorage.getItem('akstar_uploads_cache') 
            ? JSON.parse(localStorage.getItem('akstar_uploads_cache')!) 
            : {};
          stored[simulatedUrl] = {
            name: file.name,
            type: file.type,
            size: sizeStr,
            base64: base64Data,
            timestamp: Date.now()
          };
          localStorage.setItem('akstar_uploads_cache', JSON.stringify(stored));
        } catch (err) {
          console.warn('Could not save file to localStorage cache:', err);
        }
      }
    };
    reader.readAsDataURL(file);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadedFile(file.name);
            onFileSelected(simulatedUrl, file.name);
          }, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  const selectDriveFile = (file: GoogleDriveFile) => {
    if (file.type === 'folder') {
      setDriveFolder(file.id);
      return;
    }
    setSelectedDriveFile(file);
    const driveUrl = `https://drive.google.com/open?id=${file.id}_${Date.now()}`;
    onFileSelected(driveUrl, file.name);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="w-4 h-4 text-blue-500" />;
      case 'image': return <FileImage className="w-4 h-4 text-emerald-500" />;
      case 'audio': return <FileAudio className="w-4 h-4 text-violet-500" />;
      case 'folder': return <FolderOpen className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div id={`${id}-widget`} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/40 p-4 space-y-3.5 text-xs text-left">
      
      {/* SELECTION TABS */}
      <div className="flex gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('internal')}
          className={`px-3 py-1.5 rounded-lg text-4xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'internal' 
              ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold' 
              : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Internal Storage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drive')}
          className={`px-3 py-1.5 rounded-lg text-4xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'drive' 
              ? 'bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold' 
              : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <span className="text-xs">☁️</span>
          Google Drive
        </button>
      </div>

      {/* INTERNAL STORAGE CONTENT */}
      {activeTab === 'internal' && (
        <div className="space-y-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLocalFileChange} 
            className="hidden" 
            id={`${id}-native-file-input`}
          />
          
          {!isUploading && !uploadedFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-neutral-50/40 dark:bg-neutral-950/10"
            >
              <Upload className="w-6 h-6 text-neutral-400" />
              <div className="text-center">
                <span className="block font-bold text-3xs text-neutral-700 dark:text-neutral-300">Choose file or drag here</span>
                <span className="text-[10px] text-neutral-400 font-mono">Maximum upload limit: 12 GB raw file cache</span>
              </div>
            </button>
          )}

          {isUploading && (
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  Encrypting & uploading asset segment...
                </span>
                <span className="font-bold text-amber-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-150" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadedFile && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="block font-sans font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px] text-3xs">{uploadedFile}</span>
                  <span className="text-[9px] text-neutral-400 font-mono">Uploaded successfully to local client storage</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setUploadedFile(null); }}
                className="text-4xs font-mono uppercase text-red-500 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* GOOGLE DRIVE STORAGE CONTENT */}
      {activeTab === 'drive' && (
        <div className="space-y-3">
          <div className="bg-neutral-50 dark:bg-neutral-950/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">☁️</span>
              <div className="text-left">
                <span className="block text-4xs font-mono text-neutral-400 uppercase tracking-wider">Drive Account connected</span>
                <span className="text-3xs font-semibold text-neutral-800 dark:text-neutral-200 truncate block max-w-[150px]">akstarmodofficial732@gmail.com</span>
              </div>
            </div>
            {driveFolder !== 'root' && (
              <button
                type="button"
                onClick={() => setDriveFolder('root')}
                className="px-2 py-1 bg-neutral-200 dark:bg-neutral-850 hover:bg-neutral-300 rounded text-4xs font-mono cursor-pointer"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Drive Explorer list */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-800/80 max-h-36 overflow-y-auto bg-white dark:bg-neutral-950/20 font-mono text-3xs">
            {driveFiles[driveFolder]?.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => selectDriveFile(file)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer ${
                  selectedDriveFile?.id === file.id ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(file.type)}
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-4xs text-neutral-400 shrink-0">{file.size}</span>
              </button>
            ))}
          </div>

          {selectedDriveFile && (
            <p className="text-emerald-600 dark:text-emerald-400 text-4xs font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Connected: Imported {selectedDriveFile.name} from Google Drive.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
