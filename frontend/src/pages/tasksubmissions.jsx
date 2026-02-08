import { useState } from "react";
import { useParams } from "react-router-dom";
import { useGradeSubmission, useGetSubmissionsByTask } from "../api/task";
import toast from "react-hot-toast";

export const TaskSubmissions = () => {
  const { taskId } = useParams(); // only taskId
  const { submissions, isLoading, isErrorsubmission } = useGetSubmissionsByTask(taskId);
  const [grades, setGrades] = useState({}); // grade per student

  const { GradeMySubmission, isPending, isError } = useGradeSubmission(taskId);

  if (isLoading) {
    return <p className="text-gray-500">Loading submissions...</p>;
  }

  if (!submissions || submissions.length === 0) {
    return <p className="text-gray-500">No submissions found for this task.</p>;
  }

  const handleGrade = async (submission) => {
    const inputGrade = grades[submission._id];
    // Use the typed grade, or fall back to the existing submission grade if not changed
    const gradeToSubmit = inputGrade !== undefined ? inputGrade : submission.grade;

    if (gradeToSubmit === "" || gradeToSubmit === undefined || gradeToSubmit === null) {
      alert("Please enter a grade first");
      toast.error("Please enter a grade first");
      return;
    }

    try {
      await GradeMySubmission({
        studentId: submission.studentId._id,
        grade: Number(gradeToSubmit),
      });

      alert("Grade submitted successfully ✅");
      toast.success("Grade submitted successfully");

      // clear the local input after grading
      setGrades((prev) => ({ ...prev, [submission._id]: "" }));
    } catch (error) {
      console.error(error);
      alert("Failed to submit grade ❌");
      toast.error("Failed to submit grade");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Task Submissions</h2>

      <table className="w-full border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border-b">Student</th>
            <th className="p-3 border-b">Status</th>
            <th className="p-3 border-b">Submitted On</th>
            <th className="p-3 border-b">Current Grade</th>
            <th className="p-3 border-b">Download</th>
            <th className="p-3 border-b">New Grade</th>
            <th className="p-3 border-b">Action</th>
          </tr>
        </thead>

        <tbody>
          {submissions.map((submission) => (
            <tr key={submission._id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{submission.studentId?.name || "Unknown"}</td>

              <td className="p-3 border-b">
                {submission.status === "submitted" ? (
                  <span className="text-green-600 font-medium">✅ Submitted</span>
                ) : submission.status === "late" ? (
                  <span className="text-red-600 font-medium">❌ Late</span>
                ) : (
                  <span className="text-gray-600">⏳ Pending</span>
                )}
              </td>

              <td className="p-3 border-b">
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : "-"}
              </td>

              <td className="p-3 border-b">{submission.grade ?? "—"}</td>

              <td className="p-3 border-b">
                <a href={submission.fileUrl} download className="text-blue-600 hover:underline">
                  Download
                </a>
              </td>

              <td className="p-3 border-b">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 - 100"
                  className="border px-2 py-1 rounded w-24"
                  value={grades[submission._id] ?? submission.grade ?? ""}
                  onChange={(e) =>
                    setGrades({
                      ...grades,
                      [submission._id]: e.target.value,
                    })
                  }
                />
              </td>

              <td className="p-3 border-b">
                <button
                  className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => handleGrade(submission)}
                >
                  {isPending
                    ? "Grading..."
                    : submission.grade !== null
                    ? "Update Grade"
                    : "Grade"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isError && <p className="text-red-500 mt-3">Error grading submission</p>}
      {isErrorsubmission && <p className="text-red-500 mt-3">Error fetching submissions</p>}
    </div>
  );
};
