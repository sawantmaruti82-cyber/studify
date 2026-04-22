import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    assignedToAll: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdByFacultyId: {
      type: String,
      trim: true,
      default: '',
    },
    createdByFacultyName: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
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
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    status: {
      type: String,
      trim: true,
      default: 'pending',
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
    targetScope: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'assignments',
  }
);

export const Assignment =
  mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
