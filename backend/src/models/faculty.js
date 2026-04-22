import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
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
    collection: 'faculty',
  }
);

export const Faculty =
  mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
