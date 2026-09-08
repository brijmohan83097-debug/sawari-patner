import React, { useState, useRef } from 'react';
import { 
  Camera, 
  UploadCloud, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  Eye, 
  X, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';

export interface DocumentItem {
  id: string;
  title: string;
  docNumber: string;
  requiresBack?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  description?: string;
  docNumberPlaceholder?: string;
}

export interface DocumentUploadSlotProps {
  id?: string;
  title?: string;
  description?: string;
  docNumber?: string;
  onDocNumberChange?: (value: string) => void;
  docNumberPlaceholder?: string;
  frontImage?: string | null;
  onFrontImageChange?: (image: string | null) => void;
  backImage?: string | null;
  onBackImageChange?: (image: string | null) => void;
  requiresBack?: boolean;
  documents?: DocumentItem[];
  onDocumentChange?: (updated: DocumentItem[]) => void;
}

export const DocumentPhotoUploader: React.FC<DocumentUploadSlotProps> = (props) => {
  const {
    id = '',
    title = '',
    description = '',
    docNumber = '',
    onDocNumberChange,
    docNumberPlaceholder = '',
    frontImage = null,
    onFrontImageChange,
    backImage = null,
    onBackImageChange,
    requiresBack = false,
    documents,
    onDocumentChange
  } = props;

  // If list of documents is passed, render list of upload slots
  if (documents && onDocumentChange) {
    return (
      <div className="space-y-4">
        {documents.map((doc) => (
          <DocumentPhotoUploader
            key={doc.id}
            id={doc.id}
            title={doc.title}
            description={doc.description || `${doc.title} photo verification`}
            docNumber={doc.docNumber}
            onDocNumberChange={(newNum) => {
              const updated = documents.map(d => d.id === doc.id ? { ...d, docNumber: newNum } : d);
              onDocumentChange(updated);
            }}
            docNumberPlaceholder={doc.docNumberPlaceholder || `Enter ${doc.title} Number`}
            frontImage={doc.frontImage || null}
            onFrontImageChange={(img) => {
              const updated = documents.map(d => d.id === doc.id ? { ...d, frontImage: img } : d);
              onDocumentChange(updated);
            }}
            backImage={doc.backImage || null}
            onBackImageChange={(img) => {
              const updated = documents.map(d => d.id === doc.id ? { ...d, backImage: img } : d);
              onDocumentChange(updated);
            }}
            requiresBack={doc.requiresBack}
          />
        ))}
      </div>
    );
  }
  const [activeCameraTarget, setActiveCameraTarget] = useState<'front' | 'back' | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; label: string } | null>(null);

  const frontFileInputRef = useRef<HTMLInputElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);

  const isComplete = frontImage && (!requiresBack || backImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (side === 'front') onFrontImageChange(dataUrl);
        else if (onBackImageChange) onBackImageChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isComplete 
        ? 'bg-zinc-950/80 border-emerald-500/40' 
        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'
          }`}>
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-black text-zinc-100">{title}</h5>
            <p className="text-[10px] text-zinc-400">{description}</p>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
          isComplete 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
            : 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
        }`}>
          {isComplete ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Ready</span>
            </>
          ) : (
            <span>Required</span>
          )}
        </span>
      </div>

      {/* Document Number Input */}
      <div className="mb-3">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">Document / Identification Number</label>
        <input
          type="text"
          value={docNumber}
          onChange={(e) => onDocNumberChange(e.target.value)}
          placeholder={docNumberPlaceholder}
          className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 uppercase focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
        />
      </div>

      {/* Photo Upload Slots Grid */}
      <div className={`grid gap-2.5 ${requiresBack ? 'grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* FRONT SIDE PHOTO */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
            <span>{requiresBack ? 'Front Side Photo' : 'Document Photo'}</span>
            {frontImage && <span className="text-emerald-400 font-normal">Uploaded ✓</span>}
          </div>

          {frontImage ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-700 aspect-[4/3] group bg-zinc-900">
              <img src={frontImage} alt="Front Document" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewModalImage({ url: frontImage, label: `${title} (Front)` })}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  title="View Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCameraTarget('front')}
                  className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950"
                  title="Retake Photo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onFrontImageChange(null)}
                  className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-zinc-700 hover:border-amber-400/70 rounded-xl p-3 text-center bg-zinc-900/60 aspect-[4/3] flex flex-col items-center justify-center gap-2 transition-colors">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex gap-1.5 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setActiveCameraTarget('front')}
                  className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-lg text-[10px] flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => frontFileInputRef.current?.click()}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg text-[10px] flex items-center gap-1"
                >
                  <UploadCloud className="w-3 h-3 text-amber-400" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={frontFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'front')}
            className="hidden"
          />
        </div>

        {/* BACK SIDE PHOTO (IF APPLICABLE) */}
        {requiresBack && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span>Back Side Photo</span>
              {backImage && <span className="text-emerald-400 font-normal">Uploaded ✓</span>}
            </div>

            {backImage ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 aspect-[4/3] group bg-zinc-900">
                <img src={backImage} alt="Back Document" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewModalImage({ url: backImage, label: `${title} (Back)` })}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    title="View Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCameraTarget('back')}
                    className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950"
                    title="Retake Photo"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onBackImageChange && onBackImageChange(null)}
                    className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-700 hover:border-amber-400/70 rounded-xl p-3 text-center bg-zinc-900/60 aspect-[4/3] flex flex-col items-center justify-center gap-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex gap-1.5 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveCameraTarget('back')}
                    className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => backFileInputRef.current?.click()}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <UploadCloud className="w-3 h-3 text-amber-400" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            )}

            <input
              ref={backFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, 'back')}
              className="hidden"
            />
          </div>
        )}

      </div>

      {/* Active Camera Modal */}
      {activeCameraTarget && (
        <CameraCaptureModal
          title={`Take Photo: ${title} (${activeCameraTarget.toUpperCase()})`}
          subtitle="Ensure text, photo, and details are clearly legible in good lighting"
          facingMode="environment"
          onCapture={(dataUrl) => {
            if (activeCameraTarget === 'front') onFrontImageChange(dataUrl);
            else if (onBackImageChange) onBackImageChange(dataUrl);
            setActiveCameraTarget(null);
          }}
          onClose={() => setActiveCameraTarget(null)}
        />
      )}

      {/* Full Image Preview Modal */}
      {previewModalImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3 bg-zinc-950 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200">{previewModalImage.label}</span>
              <button
                onClick={() => setPreviewModalImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 max-h-[75vh] flex items-center justify-center overflow-auto bg-black">
              <img src={previewModalImage.url} alt="Document Full Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
