import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Search, Star, Flag, Trash2, Eye, MessageSquare, AlertCircle } from 'lucide-react';

interface Rating {
  id: number;
  trip_id: number;
  rater_name: string;
  rater_type: string;
  rated_name: string;
  rated_type: string;
  rating: number;
  review: string | null;
  is_flagged: boolean;
  flagged_reason: string | null;
  flagged_at: string | null;
  created_at: string;
}

interface RatingStats {
  total_ratings: number;
  average_rating: number;
  flagged_reviews: number;
  reviews_today: number;
}

interface UserRatingSummary {
  user_id: number;
  user_name: string;
  user_type: string;
  ratings_given: {
    total: number;
    average: number;
  };
  ratings_received: {
    total: number;
    average: number;
  };
  flagged_count: number;
}

export default function Ratings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFlagged, setFilterFlagged] = useState<string>('all');
  const [selectedRatingId, setSelectedRatingId] = useState<number | null>(null);
  const [showUserSummaryModal, setShowUserSummaryModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserType] = useState<string>('rider');
  const queryClient = useQueryClient();

  const { data: ratings, isLoading } = useQuery<Rating[]>({
    queryKey: ['ratings', filterType, filterFlagged, searchTerm],
    queryFn: async () => {
      const response = await apiClient.get('/admin/ratings', {
        params: {
          rater_type: filterType !== 'all' ? filterType : undefined,
          flagged: filterFlagged !== 'all' ? (filterFlagged === 'flagged' ? 'true' : 'false') : undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data.data || [];
    },
  });

  const { data: stats } = useQuery<RatingStats>({
    queryKey: ['rating-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/ratings/stats');
      return response.data;
    },
  });

  const { data: selectedRating } = useQuery<Rating>({
    queryKey: ['rating', selectedRatingId],
    enabled: !!selectedRatingId,
    queryFn: async () => {
      const response = await apiClient.get(`/admin/ratings/${selectedRatingId}`);
      return response.data;
    },
  });

  const { data: userSummary } = useQuery<UserRatingSummary>({
    queryKey: ['user-rating-summary', selectedUserId, selectedUserType],
    enabled: !!selectedUserId && showUserSummaryModal,
    queryFn: async () => {
      const response = await apiClient.get('/admin/ratings/user-summary', {
        params: {
          user_id: selectedUserId,
          user_type: selectedUserType,
        },
      });
      return response.data;
    },
  });

  const flagMutation = useMutation({
    mutationFn: async ({ ratingId, reason }: { ratingId: number; reason: string }) => {
      await apiClient.put(`/admin/ratings/${ratingId}/flag`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rating', selectedRatingId] });
    },
  });

  const unflagMutation = useMutation({
    mutationFn: async (ratingId: number) => {
      await apiClient.put(`/admin/ratings/${ratingId}/unflag`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rating', selectedRatingId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ratingId: number) => {
      await apiClient.delete(`/admin/ratings/${ratingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      queryClient.invalidateQueries({ queryKey: ['rating-stats'] });
      setSelectedRatingId(null);
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-[#FFB800] fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
        <p className="mt-1 text-sm text-gray-600">Moderate ratings, flag inappropriate content, and manage reviews</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ratings</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_ratings || 0}</p>
              </div>
              <Star className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'} ⭐
                </p>
              </div>
              <Star className="h-8 w-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.flagged_reviews || 0}</p>
              </div>
              <Flag className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reviews Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.reviews_today || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#7ED957]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by rater or rated user name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="rider">Rider Reviews</option>
              <option value="driver">Driver Reviews</option>
            </select>
            <select
              value={filterFlagged}
              onChange={(e) => setFilterFlagged(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7ED957] focus:border-transparent"
            >
              <option value="all">All Reviews</option>
              <option value="flagged">Flagged Only</option>
              <option value="unflagged">Unflagged Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Reviews List</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7ED957]"></div>
            </div>
          ) : ratings && ratings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ratings.map((rating: Rating) => (
                    <tr key={rating.id} className={`hover:bg-gray-50 ${rating.is_flagged ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{rating.rater_name}</div>
                          <div className="text-xs text-gray-500 capitalize">({rating.rater_type})</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{rating.rated_name}</div>
                          <div className="text-xs text-gray-500 capitalize">({rating.rated_type})</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(rating.rating)}
                        <div className="text-sm text-gray-600 mt-1">{rating.rating.toFixed(1)}/5.0</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {rating.review ? (
                          <p className="text-sm text-gray-700 truncate">{rating.review}</p>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No review text</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rating.is_flagged ? (
                          <div className="flex items-center text-red-600">
                            <Flag className="h-4 w-4 mr-1 fill-current" />
                            <span className="text-xs font-medium">Flagged</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Normal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedRatingId(rating.id)}
                          className="text-[#7ED957] hover:text-[#6BC845]"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!rating.is_flagged ? (
                          <button
                            onClick={() => {
                              const reason = prompt('Enter reason for flagging this review:');
                              if (reason) {
                                flagMutation.mutate({ ratingId: rating.id, reason });
                              }
                            }}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <Flag className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => unflagMutation.mutate(rating.id)}
                            className="text-[#7ED957] hover:text-[#6BC845]"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                              deleteMutation.mutate(rating.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No ratings found</div>
          )}
        </CardContent>
      </Card>

      {/* Rating Detail Modal */}
      {selectedRatingId && selectedRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Rating Details</h2>
                  <p className="text-gray-600">Trip #{selectedRating.trip_id}</p>
                </div>
                <button
                  onClick={() => setSelectedRatingId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Rating Details */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Reviewer</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedRating.rater_name}</p>
                        <p className="text-sm text-gray-500 capitalize">({selectedRating.rater_type})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Reviewed</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedRating.rated_name}</p>
                        <p className="text-sm text-gray-500 capitalize">({selectedRating.rated_type})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Rating</p>
                    <div className="flex items-center space-x-3">
                      {renderStars(selectedRating.rating)}
                      <span className="text-2xl font-bold text-gray-900">
                        {selectedRating.rating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedRating.review && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-2">Review</p>
                      <p className="text-gray-900">{selectedRating.review}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedRating.is_flagged && (
                  <Card className="border-l-4 border-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Flag className="h-5 w-5 text-red-500 mr-3 mt-0.5 fill-current" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Flagged Review</p>
                          <p className="text-sm text-red-700">
                            <strong>Reason:</strong> {selectedRating.flagged_reason}
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            Flagged on: {selectedRating.flagged_at ? new Date(selectedRating.flagged_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-gray-900">{new Date(selectedRating.created_at).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                {!selectedRating.is_flagged ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const reason = prompt('Enter reason for flagging this review:');
                      if (reason) {
                        flagMutation.mutate({ ratingId: selectedRating.id, reason });
                      }
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Review
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => unflagMutation.mutate(selectedRating.id)}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Unflag Review
                  </Button>
                )}
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                      deleteMutation.mutate(selectedRating.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Rating Summary Modal */}
      {showUserSummaryModal && userSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{userSummary.user_name}</h2>
                  <p className="text-gray-600 capitalize">{userSummary.user_type}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserSummaryModal(false);
                    setSelectedUserId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* User Rating Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Ratings Given</p>
                    <p className="text-3xl font-bold text-gray-900">{userSummary.ratings_given.total}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Avg: ⭐ {userSummary.ratings_given.average.toFixed(1)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Ratings Received</p>
                    <p className="text-3xl font-bold text-gray-900">{userSummary.ratings_received.total}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Avg: ⭐ {userSummary.ratings_received.average.toFixed(1)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {userSummary.flagged_count > 0 && (
                <Card className="border-l-4 border-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Flag className="h-5 w-5 text-red-500 mr-3 fill-current" />
                      <div>
                        <p className="font-semibold text-red-900">
                          {userSummary.flagged_count} Flagged Review(s)
                        </p>
                        <p className="text-sm text-red-700">This user has flagged reviews that require attention</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowUserSummaryModal(false);
                    setSelectedUserId(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
