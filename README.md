# RentHub - Peer-to-Peer Rental Platform

A comprehensive peer-to-peer rental platform built with React, TypeScript, and Supabase. This platform allows users to rent items from each other with a complete KYC (Know Your Customer) verification system for hosts.

## Features

### User Features
- **Browse Products**: Search and filter rental products by category and location
- **Product Details**: View detailed information, reviews, and ratings
- **Rental Management**: Track your rentals as both renter and host
- **Reviews & Ratings**: Leave and read reviews for products

### Host Features (Requires KYC Approval)
- **List Products**: Create and manage rental listings
- **KYC Verification**: Complete identity verification to become a host
  - Government ID upload (passport, driver's license, or national ID)
  - Video verification
  - Phone number verification
- **Rental Requests**: Approve or decline rental requests
- **Rental Status Tracking**: Manage active rentals

### Admin Features
- **Dashboard**: Overview of platform statistics
- **KYC Review**: Review and approve host verification requests
  - Real-time media preview (images, PDFs, videos)
  - Inline video playback
  - Full-screen media viewer
- **User Management**: View and manage users
- **Product Management**: Monitor and manage all listings
- **Category Management**: Create and organize product categories

## KYC Verification Process

To list products as a host, users must complete the following verification steps:

### 1. Document Upload
- Upload a clear image or PDF of a government-issued ID via Cloudinary
- Supported documents: Passport, Driver's License, National ID Card
- Supported formats: JPG, PNG, PDF (max 10MB)
- Real-time upload with progress tracking
- Documents are stored securely and reviewed by admin team

### 2. Video Verification
- Record and upload a short video (10-30 seconds) via Cloudinary
- Hold ID next to face and state full name
- Supported formats: MP4, MOV, AVI, WEBM (max 50MB)
- Real-time upload with progress tracking
- Video is reviewed for authenticity by admin team

### 3. Phone Verification
- Provide phone number
- Verify via SMS code
- Confirms contact information

### 4. Admin Review
- All submissions reviewed by admin team
- Typical review time: 1-2 business days
- Approval required to list products

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide React icons
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with email/password
- **Media Storage**: Cloudinary (for KYC documents and videos)

## Database Schema

### Tables
- **profiles**: User information and KYC status
- **kyc_documents**: Government ID uploads and verification
- **kyc_verifications**: Video and phone verification data
- **products**: Rental listings
- **rentals**: Rental transactions
- **reviews**: Product reviews and ratings
- **categories**: Product categories

## Security Features

- Row Level Security (RLS) on all tables
- KYC approval required for hosting
- Admin-only access to sensitive operations
- Secure authentication via Supabase
- Data validation and constraints

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase credentials in `.env`
4. Set up Cloudinary for file uploads (see [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md))
5. Run development server: `npm run dev`
6. Build for production: `npm run build`

## Admin Access

For development purposes, there is a quick admin login option:
- Email: admin@gmail.com
- Password: admin@123

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET`: Your Cloudinary upload preset
- `VITE_CLOUDINARY_API_KEY`: Your Cloudinary API key

For detailed Cloudinary setup instructions, see [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)

## License

This project is for demonstration purposes.
