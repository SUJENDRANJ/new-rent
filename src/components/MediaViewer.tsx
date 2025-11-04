import { useState } from 'react';
import { X, Play, FileText, ExternalLink, Maximize2 } from 'lucide-react';
import { isVideoFile, isPDFFile, isImageFile } from '../lib/cloudinary';

type MediaViewerProps = {
  url: string;
  title?: string;
  onClose: () => void;
};

export const MediaViewer = ({ url, title, onClose }: MediaViewerProps) => {
  const renderMedia = () => {
    if (isVideoFile(url)) {
      return (
        <div className="relative w-full max-h-[70vh] bg-black rounded-lg overflow-hidden">
          <video
            src={url}
            className="w-full h-full"
            controls
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isPDFFile(url)) {
      return (
        <div className="w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
          <div className="mt-4 flex justify-center">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <ExternalLink size={20} />
              Open PDF in New Tab
            </a>
          </div>
        </div>
      );
    }

    if (isImageFile(url)) {
      return (
        <div className="w-full max-h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={url}
            alt={title || 'Document'}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    return (
      <div className="w-full p-12 text-center bg-gray-50 rounded-lg">
        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-4">Unable to preview this file type</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <ExternalLink size={20} />
          Open File
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {title || 'Media Viewer'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          {renderMedia()}
        </div>

        <div className="flex justify-end gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <Maximize2 size={18} />
            Open in New Tab
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

type InlineMediaPreviewProps = {
  url: string;
  onClick: () => void;
  className?: string;
};

export const InlineMediaPreview = ({ url, onClick, className = '' }: InlineMediaPreviewProps) => {
  if (isVideoFile(url)) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer group overflow-hidden rounded-lg ${className}`}
      >
        <video
          src={url}
          className="w-full h-full object-cover"
          muted
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
            <Play size={28} className="text-gray-900 ml-1" />
          </div>
        </div>
      </div>
    );
  }

  if (isPDFFile(url)) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer group bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center ${className}`}
      >
        <FileText size={48} className="text-gray-600 group-hover:text-gray-700" />
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
          PDF
        </div>
      </div>
    );
  }

  if (isImageFile(url)) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer group overflow-hidden rounded-lg ${className}`}
      >
        <img
          src={url}
          alt="Preview"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer group bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center ${className}`}
    >
      <FileText size={48} className="text-gray-600 group-hover:text-gray-700" />
    </div>
  );
};
