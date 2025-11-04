import { useState, useEffect } from 'react';
import { supabase, KYCDocument, KYCVerification } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Camera,
  Loader2,
} from 'lucide-react';
import { CloudinaryUploadWidget } from './CloudinaryUploadWidget';

export const KYCSubmission = () => {
  const { user, profile } = useAuth();
  const [activeStep, setActiveStep] = useState<'document' | 'video' | 'phone' | 'review'>('document');
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [verification, setVerification] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [documentForm, setDocumentForm] = useState({
    documentType: 'passport' as 'passport' | 'drivers_license' | 'national_id' | 'other',
    documentUrl: '',
    fileName: '',
  });

  const [videoForm, setVideoForm] = useState({
    videoUrl: '',
  });

  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    verificationCode: '',
    codeSent: false,
  });

  useEffect(() => {
    if (user) {
      fetchKYCData();
    }
  }, [user]);

  const fetchKYCData = async () => {
    if (!user) return;

    const [{ data: docsData }, { data: verificationData }] = await Promise.all([
      supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    setDocuments(docsData || []);
    setVerification(verificationData);

    if (docsData && docsData.length > 0) {
      const hasApprovedDoc = docsData.some((doc) => doc.status === 'approved');
      if (hasApprovedDoc) {
        setActiveStep('video');
      }
    }

    if (verificationData?.video_url) {
      setActiveStep('phone');
    }

    if (verificationData?.phone_code_verified_at) {
      setActiveStep('review');
    }
  };

  const handleDocumentUpload = async (url: string) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const fileName = url.split('/').pop() || '';
      const { error: insertError } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: documentForm.documentType,
        document_url: url,
        file_name: fileName,
        status: 'pending',
      });

      if (insertError) throw insertError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_submitted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setDocumentForm({ documentType: 'passport', documentUrl: url, fileName });
      await fetchKYCData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (url: string) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (verification) {
        const { error: updateError } = await supabase
          .from('kyc_verifications')
          .update({
            video_url: url,
            video_uploaded_at: new Date().toISOString(),
            verification_status: 'in_review',
          })
          .eq('id', verification.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('kyc_verifications').insert({
          user_id: user.id,
          video_url: url,
          video_uploaded_at: new Date().toISOString(),
          verification_status: 'in_review',
        });

        if (insertError) throw insertError;
      }

      setVideoForm({ videoUrl: url });
      await fetchKYCData();
      setActiveStep('phone');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone_number: phoneForm.phoneNumber })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (verification) {
        const { error: updateError } = await supabase
          .from('kyc_verifications')
          .update({
            phone_verification_code: verificationCode,
            phone_code_sent_at: new Date().toISOString(),
          })
          .eq('id', verification.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('kyc_verifications').insert({
          user_id: user.id,
          phone_verification_code: verificationCode,
          phone_code_sent_at: new Date().toISOString(),
          verification_status: 'in_review',
        });

        if (insertError) throw insertError;
      }

      setPhoneForm({ ...phoneForm, codeSent: true });
      alert(`Verification code: ${verificationCode} (In production, this would be sent via SMS)`);
      await fetchKYCData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !verification) return;

    setLoading(true);
    setError('');

    try {
      if (phoneForm.verificationCode !== verification.phone_verification_code) {
        setError('Invalid verification code');
        setLoading(false);
        return;
      }

      const [{ error: verificationError }, { error: profileError }] = await Promise.all([
        supabase
          .from('kyc_verifications')
          .update({
            phone_code_verified_at: new Date().toISOString(),
            verification_status: 'in_review',
          })
          .eq('id', verification.id),
        supabase
          .from('profiles')
          .update({
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
          })
          .eq('id', user.id),
      ]);

      if (verificationError) throw verificationError;
      if (profileError) throw profileError;

      await fetchKYCData();
      setActiveStep('review');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = () => {
    if (documents.length === 0) return 'pending';
    const latestDoc = documents[0];
    return latestDoc.status;
  };

  if (profile?.kyc_status === 'approved') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Approved</h2>
          <p className="text-gray-600">
            Your account has been verified. You can now list products as a host.
          </p>
        </div>
      </div>
    );
  }

  if (profile?.kyc_status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Rejected</h2>
          <p className="text-gray-600 mb-4">
            Your verification was not approved. Please contact support for more information.
          </p>
          {documents.length > 0 && documents[0].rejection_reason && (
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-gray-900 mb-1">Rejection Reason:</p>
              <p className="text-sm text-gray-600">{documents[0].rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h2>
        <p className="text-gray-600 mb-8">
          Complete the verification process to become a verified host and list products
        </p>

        <div className="flex items-center justify-between mb-8">
          {[
            { key: 'document', icon: FileText, label: 'Document' },
            { key: 'video', icon: Camera, label: 'Video' },
            { key: 'phone', icon: Phone, label: 'Phone' },
            { key: 'review', icon: CheckCircle, label: 'Review' },
          ].map((step, index) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    activeStep === step.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <step.icon size={20} />
                </div>
                <span className="text-xs mt-2 font-medium text-gray-600">{step.label}</span>
              </div>
              {index < 3 && <div className="h-1 flex-1 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {activeStep === 'document' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Upload Government ID
              </h3>
              <p className="text-gray-600 mb-6">
                Please provide a clear image or PDF of your government-issued ID (passport,
                driver's license, or national ID card)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={documentForm.documentType}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentType: e.target.value as typeof documentForm.documentType,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Document
                  </label>
                  <CloudinaryUploadWidget
                    onUploadSuccess={handleDocumentUpload}
                    onUploadError={(err) => setError(err.message)}
                    resourceType="raw"
                    buttonText="Upload ID Document"
                    disabled={loading}
                    acceptedFormats={['jpg', 'jpeg', 'png', 'pdf']}
                    maxFileSize={10000000}
                  />
                  {documentForm.documentUrl && (
                    <p className="text-xs text-green-600 mt-2">
                      Document uploaded successfully!
                    </p>
                  )}
                </div>
              </div>

              {documents.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="font-medium text-gray-900">Submitted Documents</h4>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {doc.document_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          doc.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === 'video' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Video Verification</h3>
              <p className="text-gray-600 mb-6">
                Record a short video (10-30 seconds) holding your ID next to your face and stating
                your full name
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Video
                  </label>
                  <CloudinaryUploadWidget
                    onUploadSuccess={handleVideoUpload}
                    onUploadError={(err) => setError(err.message)}
                    resourceType="video"
                    buttonText="Upload Verification Video"
                    disabled={loading}
                    acceptedFormats={['mp4', 'mov', 'avi', 'webm']}
                    maxFileSize={50000000}
                  />
                  {videoForm.videoUrl && (
                    <p className="text-xs text-green-600 mt-2">
                      Video uploaded successfully!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 'phone' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Phone Verification</h3>
              <p className="text-gray-600 mb-6">
                Verify your phone number to complete the KYC process
              </p>

              {!phoneForm.codeSent ? (
                <form onSubmit={handlePhoneUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneForm.phoneNumber}
                      onChange={(e) =>
                        setPhoneForm({ ...phoneForm, phoneNumber: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Phone size={20} />
                        Send Verification Code
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCodeVerification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={phoneForm.verificationCode}
                      onChange={(e) =>
                        setPhoneForm({ ...phoneForm, verificationCode: e.target.value })
                      }
                      placeholder="123456"
                      maxLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Verify Code
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeStep === 'review' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <AlertCircle size={48} className="text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Under Review</h3>
              <p className="text-gray-600">
                Your KYC submission is being reviewed by our admin team. This usually takes 1-2
                business days.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-left">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Document</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      getDocumentStatus() === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : getDocumentStatus() === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {getDocumentStatus()}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Video</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Submitted
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Phone</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
