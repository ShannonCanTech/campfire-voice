import React, { useState } from 'react';
import { ContentReporter, type ReportReason } from '../utils/validation.js';
import { useAppContext } from '../context/AppContext.js';
import { useToast } from './ToastContainer.js';

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'message' | 'chatroom';
  contentPreview?: string;
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentId,
  contentType,
  contentPreview,
}) => {
  const { state } = useAppContext();
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportReasons: Array<{ value: ReportReason; label: string; description: string }> = [
    {
      value: 'spam',
      label: 'Spam',
      description: 'Repetitive, unwanted, or promotional content'
    },
    {
      value: 'harassment',
      label: 'Harassment',
      description: 'Bullying, threats, or targeted harassment'
    },
    {
      value: 'inappropriate',
      label: 'Inappropriate Content',
      description: 'Offensive, explicit, or inappropriate material'
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Other violations of community guidelines'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason || !state.user) {
      return;
    }

    try {
      setSubmitting(true);
      
      const report = ContentReporter.createReport(
        contentId,
        contentType,
        selectedReason,
        state.user.id,
        description.trim() || undefined
      );

      const validation = ContentReporter.validateReport(report);
      if (!validation.isValid) {
        toast.showError('Invalid Report', validation.error);
        return;
      }

      // In a real app, you'd send this to your moderation system
      console.log('Content report submitted:', report);
      
      toast.showSuccess(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review this report.'
      );
      
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.showError('Failed to Submit Report', 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Report {contentType === 'message' ? 'Message' : 'Chat Room'}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Content Preview */}
            {contentPreview && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600 mb-1">Reporting:</p>
                <p className="text-sm text-gray-900 line-clamp-3">{contentPreview}</p>
              </div>
            )}

            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Why are you reporting this content? *
              </label>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value as ReportReason)}
                      className="mt-1 text-red-500 focus:ring-red-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{reason.label}</div>
                      <div className="text-sm text-gray-500">{reason.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context that might help us understand the issue..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-sm text-gray-500">{description.length}/500 characters</p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Please report responsibly</p>
                  <p>False reports may result in restrictions on your account.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || submitting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
