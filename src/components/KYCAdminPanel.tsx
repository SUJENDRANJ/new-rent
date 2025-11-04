import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { MediaViewer, InlineMediaPreview } from './MediaViewer';

type KYCSubmission = {
  user: any;
  documents: any[];
};

export const KYCAdminPanel = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mediaViewerUrl, setMediaViewerUrl] = useState<string | null>(null);
  const [mediaViewerTitle, setMediaViewerTitle] = useState<string>('');

  useEffect(() => {
    fetchKYCSubmissions();
  }, []);

  const fetchKYCSubmissions = async () => {
    setLoading(true);

    const { data: documentsData, error: documentsError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (documentsError) {
      console.error('Error fetching KYC submissions:', documentsError);
      setLoading(false);
      return;
    }

    const submissionsData: KYCSubmission[] = [];

    for (const doc of documentsData || []) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', doc.user_id)
        .maybeSingle();

      submissionsData.push({
        user: userData,
        documents: [doc],
      });
    }

    setSubmissions(submissionsData);
    setLoading(false);
  };

  const handleReview = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleApproveKYC = async () => {
    if (!selectedSubmission || !selectedSubmission.documents[0]) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await Promise.all([
        supabase
          .from('users')
          .update({ is_kyc_verified: true })
          .eq('id', selectedSubmission.user.id),
        supabase
          .from('kyc_submissions')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq('id', selectedSubmission.documents[0].id),
      ]);

      setShowModal(false);
      setSelectedSubmission(null);
      setAdminNotes('');
      await fetchKYCSubmissions();
    } catch (err) {
      console.error('Error approving KYC:', err);
      alert('Failed to approve KYC');
    }
  };

  const handleRejectKYC = async () => {
    if (!selectedSubmission || !selectedSubmission.documents[0]) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('kyc_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', selectedSubmission.documents[0].id);

      setShowModal(false);
      setSelectedSubmission(null);
      setRejectionReason('');
      setAdminNotes('');
      await fetchKYCSubmissions();
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      alert('Failed to reject KYC');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Rejected</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">KYC Submissions</h3>
          <p className="text-gray-600 mt-1">Review and approve host verification requests</p>
        </div>
        <div className="text-sm text-gray-600">
          {submissions.length} pending
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">No KYC submissions to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.user?.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {submission.user?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {submission.user?.full_name || 'N/A'}
                    </h4>
                    <p className="text-sm text-gray-600">{submission.user?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {formatDate(submission.documents[0]?.submitted_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(submission.documents[0]?.status || 'pending')}
                  <button
                    onClick={() => handleReview(submission)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Review
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Document</span>
                  </div>
                  {submission.documents.length > 0 ? (
                    <div className="text-xs text-gray-600">
                      {submission.documents[0].document_type.replace('_', ' ')}
                      <br />
                      {getStatusBadge(submission.documents[0].status)}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not submitted</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Review KYC Submission</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSubmission(null);
                  setRejectionReason('');
                  setAdminNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedSubmission.user?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedSubmission.user?.full_name || 'N/A'}
                    </h4>
                    <p className="text-gray-600">{selectedSubmission.user?.email}</p>
                    <p className="text-sm text-gray-500">
                      Phone: {selectedSubmission.user?.phone_number || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3">Documents</h4>
                <div className="grid grid-cols-1 gap-4">
                  {selectedSubmission.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <InlineMediaPreview
                        url={doc.document_url}
                        onClick={() => {
                          setMediaViewerUrl(doc.document_url);
                          setMediaViewerTitle(`${doc.document_type.replace('_', ' ')} - ${selectedSubmission.user?.full_name}`);
                        }}
                        className="h-48 w-full"
                      />
                      <div className="p-3">
                        <p className="font-medium text-gray-900 text-sm">
                          {doc.document_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {formatDate(doc.submitted_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this verification..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a reason if rejecting this submission..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRejectKYC}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <XCircle size={20} />
                  Reject KYC
                </button>
                <button
                  onClick={handleApproveKYC}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mediaViewerUrl && (
        <MediaViewer
          url={mediaViewerUrl}
          title={mediaViewerTitle}
          onClose={() => {
            setMediaViewerUrl(null);
            setMediaViewerTitle('');
          }}
        />
      )}
    </div>
  );
};
