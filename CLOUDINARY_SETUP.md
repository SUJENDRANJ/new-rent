# Cloudinary Setup Guide

This guide will help you set up Cloudinary for real-time file uploads (images, videos, PDFs) in the RentHub platform.

## Prerequisites

- A Cloudinary account (free tier available at https://cloudinary.com)

## Step 1: Create a Cloudinary Account

1. Visit https://cloudinary.com and sign up for a free account
2. After signing up, you'll be redirected to your dashboard

## Step 2: Get Your Cloudinary Credentials

From your Cloudinary dashboard, you'll need the following:

1. **Cloud Name**: Found at the top of your dashboard
2. **API Key**: Found in the "Account Details" section
3. **Upload Preset**: You'll need to create this (see Step 3)

## Step 3: Create an Upload Preset

1. Go to Settings > Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure the preset:
   - **Preset name**: Choose a name (e.g., `renthub_kyc`)
   - **Signing Mode**: Select "Unsigned" (allows client-side uploads)
   - **Folder**: Optional - you can specify a folder like `kyc_documents`
   - **Access Mode**: Select "Public"
   - **Resource Type**: Select "Auto"
5. Click "Save"
6. Copy the preset name

## Step 4: Configure Environment Variables

Update your `.env` file with the following values:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
```

Replace the placeholder values with your actual Cloudinary credentials:
- `your_cloud_name_here` → Your Cloud Name from Step 2
- `your_upload_preset_here` → The preset name you created in Step 3
- `your_api_key_here` → Your API Key from Step 2

## Step 5: Restart Your Development Server

After updating the environment variables, restart your development server:

```bash
npm run dev
```

## Features Enabled

Once Cloudinary is configured, the following features will work:

### For Users (KYC Submission)
- **Document Upload**: Upload government ID (passport, driver's license, national ID)
  - Supported formats: JPG, JPEG, PNG, PDF
  - Max size: 10MB
- **Video Upload**: Upload verification video
  - Supported formats: MP4, MOV, AVI, WEBM
  - Max size: 50MB

### For Admins (KYC Review)
- **Inline Media Preview**: See thumbnails of uploaded documents and videos
- **Full-Screen Viewer**: Click on any media to view it in full screen
- **Video Playback**: Play verification videos directly in the admin panel
- **PDF Viewer**: View PDF documents inline or open in new tab
- **Image Viewer**: View high-resolution images with zoom capability

## Security Best Practices

1. **Upload Presets**: Always use unsigned upload presets for client-side uploads
2. **Folder Organization**: Use folders to organize uploads (e.g., `kyc_documents/`, `product_images/`)
3. **Access Control**: Keep your API Secret secure - never expose it in client-side code
4. **File Size Limits**: Configure appropriate file size limits in your upload preset
5. **Resource Types**: Restrict resource types based on your use case

## Monitoring and Management

### View Uploaded Files
1. Go to Media Library in your Cloudinary dashboard
2. Browse uploaded files by folder
3. View file details, transformations, and URLs

### Storage Management
- Free tier includes 25 GB storage and 25 GB bandwidth per month
- Monitor usage in your dashboard under "Usage"
- Set up alerts for when you approach limits

### Transformations
Cloudinary supports automatic image and video transformations:
- Automatic format conversion
- Quality optimization
- Thumbnail generation
- Video transcoding

## Troubleshooting

### Upload Widget Not Loading
- Check that the Cloudinary script is loaded in `index.html`
- Verify your Cloud Name is correct
- Check browser console for errors

### Upload Fails
- Verify upload preset is set to "Unsigned"
- Check file size is within limits
- Ensure file format is allowed in the preset
- Check browser console for detailed error messages

### Media Not Displaying
- Verify URLs are publicly accessible
- Check CORS settings if loading from custom domain
- Ensure resource type matches file type (image/video/raw)

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload Widget Documentation](https://cloudinary.com/documentation/upload_widget)
- [Upload Presets Guide](https://cloudinary.com/documentation/upload_presets)
- [Security Best Practices](https://cloudinary.com/documentation/security)

## Support

If you encounter issues:
1. Check the Cloudinary console for error messages
2. Review the browser console for client-side errors
3. Verify all environment variables are set correctly
4. Contact Cloudinary support for platform-specific issues
