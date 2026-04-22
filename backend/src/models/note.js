import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const noteSchema = new mongoose.Schema(
  {
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    facultyId: {
      type: String,
      trim: true,
      default: '',
    },
    facultyName: {
      type: String,
      trim: true,
      default: '',
    },
    fileType: {
      type: String,
      trim: true,
      default: '',
    },
    fileId: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    semester: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    subjectId: {
      type: String,
      trim: true,
      index: true,
      required: true,
    },
    subjectName: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'notes',
  }
);

export const Note =
  mongoose.models.Note || mongoose.model('Note', noteSchema);
