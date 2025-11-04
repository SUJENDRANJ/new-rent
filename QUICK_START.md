# Quick Start Guide

Get RentHub up and running with Cloudinary integration in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Cloudinary account (free tier at https://cloudinary.com)
- A Supabase account (already configured)

## Step 1: Clone and Install (1 minute)

```bash
git clone <repository-url>
cd renthub
npm install
```

## Step 2: Configure Cloudinary (2 minutes)

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com and sign up
   - Note your Cloud Name from the dashboard

2. **Create Upload Preset**
   - Go to Settings > Upload
   - Click "Add upload preset"
   - Name it: `renthub_kyc`
   - Signing Mode: **Unsigned**
   - Click Save

3. **Update Environment Variables**

   Edit `.env` file:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_UPLOAD_PRESET=renthub_kyc
   VITE_CLOUDINARY_API_KEY=your_api_key_here
   ```

## Step 3: Run the Application (30 seconds)

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Step 4: Test the Integration (1 minute)

### Test as User

1. Sign up for a new account
2. Navigate to "Host" page
3. Complete KYC verification:
   - Upload a document (image or PDF)
   - Upload a video
   - Verify phone number

### Test as Admin

1. Sign in with admin credentials:
   - Email: `admin@gmail.com`
   - Password: `admin@123`
2. Click "Admin" in navigation
3. Click "KYC Review" tab
4. Click "Review" on a submission
5. Click on document/video thumbnails to view full-screen
6. Approve or reject the submission

## Troubleshooting

### Upload Widget Not Appearing
- Refresh the page
- Check browser console for errors
- Verify environment variables are set correctly

### Upload Fails
- Check file size (max 10MB for docs, 50MB for videos)
- Verify file format is supported
- Ensure upload preset is set to "Unsigned"

### Media Not Displaying
- Check Cloudinary URLs are publicly accessible
- Verify upload preset access mode is "Public"
- Check browser console for CORS errors

## What's Working Now

- Real-time file uploads via Cloudinary
- Image uploads (JPG, PNG, PDF) up to 10MB
- Video uploads (MP4, MOV, AVI, WEBM) up to 50MB
- Inline media preview for admins
- Full-screen media viewer
- Video playback with controls
- PDF viewing
- Secure file storage in Cloudinary

## Next Steps

- Review [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) for detailed configuration
- Review [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) for technical details
- Configure additional Cloudinary features (transformations, optimization)
- Set up production environment variables
- Configure Cloudinary folders for organization

## Need Help?

- Check [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) for setup issues
- Review browser console for errors
- Check Cloudinary dashboard for upload logs
- Verify environment variables are correct

## Production Checklist

Before deploying to production:

- [ ] Set up production Cloudinary account
- [ ] Create production upload presets
- [ ] Configure environment variables in hosting platform
- [ ] Set appropriate file size limits
- [ ] Configure folder structure in Cloudinary
- [ ] Set up usage alerts in Cloudinary dashboard
- [ ] Test uploads in production environment
- [ ] Verify media playback on all devices
- [ ] Test with various file sizes and formats
- [ ] Set up monitoring and error tracking

## Support

For issues specific to:
- **Cloudinary**: Check [Cloudinary Documentation](https://cloudinary.com/documentation)
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **Application**: Check project README and integration docs
