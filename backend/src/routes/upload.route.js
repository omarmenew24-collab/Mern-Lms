import express from "express";
import multer from "multer";
import { uploadFile } from "../lib/cloudinaryupload.js";
import Submission from "../models/submission.model.js";
import { uploadfile } from "../controllers/uploadfile.controller.js";

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // temp storage

router.post("/upload", upload.single("file"), uploadfile);


export default router;
