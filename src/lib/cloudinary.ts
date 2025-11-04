const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (
  file: File,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const getCloudinaryWidget = (
  callback: (error: Error | null, result: { info: { secure_url: string } }) => void,
  options: {
    resourceType?: 'image' | 'video' | 'raw';
    maxFileSize?: number;
    clientAllowedFormats?: string[];
  } = {}
) => {
  if (!(window as any).cloudinary) {
    console.error('Cloudinary widget not loaded');
    return null;
  }

  const widget = (window as any).cloudinary.createUploadWidget(
    {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      sources: ['local', 'camera'],
      multiple: false,
      resourceType: options.resourceType || 'auto',
      maxFileSize: options.maxFileSize || 10000000,
      clientAllowedFormats: options.clientAllowedFormats || ['jpg', 'png', 'pdf', 'mp4', 'mov'],
      cropping: false,
      showSkipCropButton: true,
      styles: {
        palette: {
          window: '#FFFFFF',
          windowBorder: '#E5E7EB',
          tabIcon: '#2563EB',
          menuIcons: '#1F2937',
          textDark: '#111827',
          textLight: '#FFFFFF',
          link: '#2563EB',
          action: '#2563EB',
          inactiveTabIcon: '#9CA3AF',
          error: '#DC2626',
          inProgress: '#2563EB',
          complete: '#059669',
          sourceBg: '#F9FAFB',
        },
      },
    },
    callback
  );

  return widget;
};

export const getResourceType = (mimeType: string): 'image' | 'video' | 'raw' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

export const isVideoFile = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
};

export const isPDFFile = (url: string): boolean => {
  return url.toLowerCase().includes('.pdf');
};

export const isImageFile = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
};
