import { useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { getCloudinaryWidget } from '../lib/cloudinary';

type CloudinaryUploadWidgetProps = {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: Error) => void;
  resourceType?: 'image' | 'video' | 'raw';
  buttonText?: string;
  disabled?: boolean;
  acceptedFormats?: string[];
  maxFileSize?: number;
};

export const CloudinaryUploadWidget = ({
  onUploadSuccess,
  onUploadError,
  resourceType = 'image',
  buttonText = 'Upload File',
  disabled = false,
  acceptedFormats,
  maxFileSize,
}: CloudinaryUploadWidgetProps) => {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!(window as any).cloudinary) {
      console.error('Cloudinary script not loaded');
      return;
    }

    widgetRef.current = getCloudinaryWidget(
      (error, result: any) => {
        if (error) {
          console.error('Upload error:', error);
          onUploadError?.(error);
          return;
        }

        if (result && result.event === 'success') {
          onUploadSuccess(result.info.secure_url);
        }
      },
      {
        resourceType,
        maxFileSize,
        clientAllowedFormats: acceptedFormats,
      }
    );

    return () => {
      if (widgetRef.current) {
        widgetRef.current.close();
      }
    };
  }, [resourceType, acceptedFormats, maxFileSize]);

  const handleClick = () => {
    if (widgetRef.current && !disabled) {
      widgetRef.current.open();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
    >
      <Upload size={20} />
      {buttonText}
    </button>
  );
};
