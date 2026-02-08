import User from "../models/user.model.js";
import axios from "axios";
import TeacherRequest from "../models/teachingrequest.model.js";

export const createteachingrequest = async (req, res) => {
  try {
    const {
      email,
      subject,
      bio,
      profilePicture,
      paymentMethod,
      portfolioLink,
    } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ message: "You don't have an account, signup first!" });

    // Validate required fields
    if (!subject || !bio || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "Subject, bio and payment method are required" });
    }

    // Check if user already has a pending request
    const existingRequest = await TeacherRequest.findOne({
      user: user._id,
      status: "pending",
    });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending teaching request" });
    }

    // Create new request
    const newRequest = new TeacherRequest({
      user: user._id, // ✅ use user found by email
      subject,
      bio,
      profilePicture,
      paymentMethod,
      portfolioLink,
    });

    await newRequest.save();

    res
      .status(201)
      .json({
        message: "Teaching request submitted successfully",
        request: newRequest,
      });
  } catch (error) {
    console.error("Error creating teaching request:", error);
    res.status(500).json({ message: "Server error while submitting request" });
  }
};

export const getteachingrequests = async (req, res) => {
  try {
    // Fetch all requests with full user info
    console.log("the user is", req.user, "role", req.user.role);
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can see requests" });

    const requests = await TeacherRequest.find()
      .populate("user") // get all user fields
      .sort({ submittedAt: -1 }); // latest first

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Error fetching teaching requests:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching teaching requests" });
  }
};

export const reviewrequest = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Only admins can review requests" });

    const { action } = req.body; // action = "approve" or "reject"
    const { id } = req.params;
    const request = await TeacherRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = action === "approve" ? "approved" : "rejected";
    request.reviewedAt = new Date();

    await request.save();

    // If approved → update user role
    if (action === "approve") {
      await User.findByIdAndUpdate(request.user, { role: "teacher" });
    }

    res.json({ message: `Request ${action}d successfully`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleterequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Only admins can delete requests" });
    const request = await TeacherRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    await TeacherRequest.findByIdAndDelete(requestId);
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting request" });
  }
};