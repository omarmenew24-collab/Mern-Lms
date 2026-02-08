import Submission from "../models/submission.model.js";
import { uploadFile } from "../lib/cloudinaryupload.js";

export const uploadfile = async (req, res) => {
  try {
    const { taskId, studentId } = req.body; // now works
    const fileUrl = await uploadFile(req.file.path);

    // Create submission in DB
    const submission = await Submission.create({
      taskId,
      studentId,
      fileUrl,
      submittedAt: new Date(),
    });

    res.json({ message: "Upload successful!", url: fileUrl, submission });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
}