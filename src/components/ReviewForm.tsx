import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasCompletedRental, setHasCompletedRental] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkCompletedRental();
  }, [productId]);

  const checkCompletedRental = async () => {
    setIsChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasCompletedRental(false);
        return;
      }

      const { data, error } = await supabase
        .from('rentals')
        .select('id')
        .eq('product_id', productId)
        .eq('renter_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      setHasCompletedRental(!!data);
    } catch (err) {
      console.error('Failed to check rental status:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to leave a review');
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('reviews')
        .insert([
          {
            product_id: productId,
            reviewer_id: user.id,
            rating,
            comment: comment.trim(),
          },
        ]);

      if (insertError) {
        if (insertError.message.includes('violates row level security')) {
          setError('You can only review products you have rented');
        } else {
          setError(insertError.message);
        }
      } else {
        setSuccess(true);
        setRating(0);
        setComment('');
        setTimeout(() => setSuccess(false), 3000);
        onReviewSubmitted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 bg-white text-center">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-6 bg-white">
      {!hasCompletedRental && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          <p className="font-medium">You can only review products you have completed renting</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              disabled={!hasCompletedRental}
              className={`transition-colors ${
                !hasCompletedRental ? 'cursor-not-allowed opacity-50' : ''
              } ${
                star <= rating ? 'text-amber-400' : 'text-gray-300'
              }`}
            >
              <Star
                size={28}
                fill={star <= rating ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Your Review
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={hasCompletedRental ? "Share your experience with this product..." : "Complete a rental to write a review"}
          rows={4}
          className="resize-none"
          disabled={!hasCompletedRental}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Review submitted successfully!
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !hasCompletedRental}
        className="w-full"
      >
        {!hasCompletedRental ? 'Complete a Rental to Review' : isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
