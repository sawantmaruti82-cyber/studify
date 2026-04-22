import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'students',
  }
);

export const Student =
  mongoose.models.Student || mongoose.model('Student', studentSchema);
