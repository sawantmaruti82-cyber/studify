import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      trim: true,
    },
    subjectId: {
      type: String,
      trim: true,
      default: '',
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    facultyId: {
      type: String,
      trim: true,
      default: '',
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    collection: 'timetable',
  }
);

export const Timetable =
  mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
