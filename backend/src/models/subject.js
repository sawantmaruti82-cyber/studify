import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      trim: true,
      default: 'CS',
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
    semester: {
      type: Number,
      default: 5,
    },
    subjectCode: {
      type: String,
      trim: true,
      default: '',
    },
    subjectId: {
      type: String,
      trim: true,
      default: '',
    },
    subjectName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    collection: 'subjects',
  }
);

export const Subject =
  mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
