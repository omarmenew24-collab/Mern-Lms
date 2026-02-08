import React from "react";
import { useParams } from "react-router-dom";
import { useGetTeachingRequests, useReviewRequest } from "../api/teaching";

const TeachingRequest = () => {
  const { id } = useParams();
  
  // ✅ 1. Get all requests using your TanStack hook
  const { teachingRequests, isLoading: isFetching } = useGetTeachingRequests();
  
  // ✅ 2. Get the review mutation
  const { reviewrequest, isPending: isReviewing } = useReviewRequest();

  // ✅ 3. Find the specific request from the list using the ID from URL
  const teachingRequest = teachingRequests?.find((req) => req._id === id);

  const handleRequestAction = async (action) => {
    try {
      // ✅ Matches your useReviewRequest signature: mutationFn: async ({ requestId, action })
      await reviewrequest({ requestId: id, action });
      // No need for alert or manual state updates; the hook's onSuccess handles the toast 
      // and queryClient.invalidateQueries refreshes the data automatically.
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  // ✅ 4. Handle Loading States
  if (isFetching) {
    return <p className="text-center p-10">Loading request details...</p>;
  }

  if (!teachingRequest) {
    return (
      <p className="text-gray-600 p-6 text-center">
        No teaching request found.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Teaching Request Details
        </h1>

        <div className="space-y-4 text-gray-700">
          <div>
            <span className="font-semibold">👤 Name:</span> {teachingRequest.user.name}
          </div>
          <div>
            <span className="font-semibold">📧 Email:</span> {teachingRequest.user.email}
          </div>
          <div>
            <span className="font-semibold">📘 Subject:</span> {teachingRequest.subject}
          </div>
          <div>
            <span className="font-semibold">📝 Bio:</span> {teachingRequest.bio}
          </div>
          <div>
            <span className="font-semibold">💳 Payment Method:</span> {teachingRequest.paymentMethod}
          </div>
          
          {teachingRequest.portfolioLink && (
            <div>
              <span className="font-semibold">🔗 Portfolio:</span>{" "}
              <a
                href={teachingRequest.portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Portfolio
              </a>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Submitted at: {new Date(teachingRequest.submittedAt).toLocaleString()}
          </div>
          
          <div>
            <span className="font-semibold">📌 Status:</span>{" "}
            <span
              className={`px-2 py-1 rounded text-sm capitalize ${
                teachingRequest.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : teachingRequest.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {teachingRequest.status}
            </span>
          </div>
        </div>

        {/* Action Buttons: Only show if pending and not currently mutating */}
        {teachingRequest.status === "pending" && (
          <div className="flex justify-center space-x-6 mt-8">
            <button
              disabled={isReviewing}
              onClick={() => handleRequestAction("rejected")}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Reject"}
            </button>
            <button
              disabled={isReviewing}
              onClick={() => handleRequestAction("approve")}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Accept"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachingRequest;