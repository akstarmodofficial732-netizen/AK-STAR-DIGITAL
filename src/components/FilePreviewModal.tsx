import React from 'react';
import { 
  X, FileText, Image, FileVideo, FileAudio, 
  Download, Calendar, ExternalLink, HardDrive, Info 
} from 'lucide-react';

interface FilePreviewModalProps {
  fileUrl: string;
  onClose: () => void;
}

export default function FilePreviewModal({ fileUrl, onClose }: FilePreviewModalProps) {
  // Retrieve file from window storage or localStorage cache
  let fileData = (window as any).akstarStorage?.[fileUrl];

  if (!fileData) {
    try {
      const cached = localStorage.getItem('akstar_uploads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed[fileUrl]) {
          fileData = parsed[fileUrl];
          // Restore to window for reference
          if (!(window as any).akstarStorage) {
            (window as any).akstarStorage = {};
          }
          (window as any).akstarStorage[fileUrl] = fileData;
        }
      }
    } catch (e) {
      console.error('Failed to parse storage cache:', e);
    }
  }

  // Fallback metadata if not in cache (parsed from URL)
  if (!fileData) {
    const fileName = decodeURIComponent(fileUrl.split('/').pop() || 'unknown_file').replace(/^\d+_/,'');
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|tiff)$/i.test(fileName);
    const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(fileName);
    const isAudio = /\.(mp3|wav|ogg|aac|m4a)$/i.test(fileName);
    
    let simulatedType = 'application/octet-stream';
    if (isImage) simulatedType = 'image/png';
    else if (isVideo) simulatedType = 'video/mp4';
    else if (isAudio) simulatedType = 'audio/mpeg';

    fileData = {
      name: fileName,
      type: simulatedType,
      size: 'Simulated File',
      isPlaceholder: true,
      timestamp: Date.now()
    };
  }

  const isImg = fileData.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|tiff)$/i.test(fileData.name);
  const isVid = fileData.type?.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(fileData.name);
  const isAud = fileData.type?.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a)$/i.test(fileData.name);

  const downloadSource = fileData.objectUrl || fileData.base64;

  const handleDownload = () => {
    if (downloadSource) {
      const link = document.createElement('a');
      link.href = downloadSource;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('This is a mock simulated reference link with no binary data associated.');
    }
  };

  const getIcon = () => {
    if (isImg) return <Image className="w-8 h-8 text-emerald-500" />;
    if (isVid) return <FileVideo className="w-8 h-8 text-blue-500" />;
    if (isAud) return <FileAudio className="w-8 h-8 text-violet-500" />;
    return <FileText className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div id="file-preview-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="file-preview-modal-container"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <HardDrive className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-amber-500 font-bold">AK STAR CLOUD STORAGE</span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-sans max-w-[320px] truncate" title={fileData.name}>
                {fileData.name}
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-300 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center justify-center min-h-[250px]">
          
          {/* File Preview Area */}
          <div className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-150 dark:border-neutral-800/60 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group">
            {isImg && downloadSource ? (
              <img 
                src={downloadSource} 
                alt={fileData.name} 
                className="max-h-[350px] object-contain rounded-lg shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : isVid && downloadSource ? (
              <video 
                src={downloadSource} 
                controls 
                className="w-full max-h-[350px] rounded-lg shadow-sm bg-black"
                preload="metadata"
              />
            ) : isAud && downloadSource ? (
              <div className="w-full max-w-md py-8 px-4 text-center space-y-4">
                <div className="w-16 h-16 bg-violet-500/10 text-violet-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <FileAudio className="w-8 h-8" />
                </div>
                <audio src={downloadSource} controls className="w-full" />
              </div>
            ) : (
              // Document / Unknown placeholder
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                  {getIcon()}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">No Direct Web Preview</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-normal font-mono">
                    {fileData.type || 'Binary Archive file'} is stored securely on the local cloud segment. Click below to download the original asset.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-b border-neutral-100 dark:border-neutral-800/80 py-4 font-mono text-3xs text-neutral-500">
            <div className="space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-bold">File Size</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-bold">{fileData.size}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Mime Type</span>
              <span className="text-neutral-800 dark:text-neutral-200 font-bold">{fileData.type || 'unknown'}</span>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="block text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Source Storage Address</span>
              <span className="text-amber-500 font-bold flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                <ExternalLink className="w-3 h-3 shrink-0" /> {fileUrl}
              </span>
            </div>
          </div>

          {/* Sandbox Notice */}
          <div className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-800/80 rounded-xl flex gap-2.5 text-left text-3xs text-neutral-500 leading-normal">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-neutral-800 dark:text-neutral-200">Simulated Encrypted Virtual File</p>
              <p className="mt-0.5">
                We handle heavy production media on our local mock sandbox using browser-secure binary state. Opening this file is fully active on this browser session!
              </p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950/80 border-t border-neutral-100 dark:border-neutral-800 flex gap-3 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-3xs font-mono rounded-xl uppercase transition-colors cursor-pointer"
          >
            Close
          </button>
          
          {downloadSource && (
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-3xs font-mono rounded-xl uppercase transition-all tracking-wider flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Asset
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
