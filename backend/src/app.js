import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import { Readable } from 'node:stream';

import { env } from './config/env.js';
import { Assignment } from './models/assignment.js';
import { Faculty } from './models/faculty.js';
import { Note } from './models/note.js';
import { Student } from './models/student.js';
import { Subject } from './models/subject.js';
import { Timetable } from './models/timetable.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = new Set(['student', 'faculty']);
const roleModels = {
  student: Student,
  faculty: Faculty,
};
const NOTES_BUCKET_NAME = 'subject_notes';
const notesUpload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

function normalizeCorsOrigin(corsOrigin) {
  if (!corsOrigin || corsOrigin === '*') {
    return true;
  }

  return corsOrigin.split(',').map((origin) => origin.trim());
}

function serializeUser(user, role) {
  return {
    id: user.id,
    fullName: user.fullName || user.name || 'User',
    email: user.email,
    role,
    department: env.departmentSlug,
  };
}

function getNotesBucket() {
  if (!mongoose.connection.db) {
    throw new Error('Database connection is not ready.');
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: NOTES_BUCKET_NAME,
  });
}

async function uploadBufferToNotesBucket(file, metadata = {}) {
  const bucket = getNotesBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata,
    });

    Readable.from(file.buffer)
      .pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve(uploadStream.id.toString());
      });
  });
}

function buildNoteAttachments(note) {
  const attachments = Array.isArray(note?.attachments)
    ? note.attachments.filter((attachment) => attachment?.fileUrl || attachment?.fileId)
    : [];

  if (attachments.length) {
    return attachments;
  }

  if (note?.fileUrl || note?.fileId || note?.fileName) {
    return [
      {
        fileId: note.fileId || '',
        fileName: note.fileName || '',
        fileSize: note.fileSize || 0,
        fileType: note.fileType || '',
        fileUrl: note.fileUrl || '',
      },
    ];
  }

  return [];
}

async function passwordMatches(user, password) {
  if (!user?.password) {
    return false;
  }

  if (user.password === password) {
    return true;
  }

  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
    return bcrypt.compare(password, user.password);
  }

  return false;
}

const app = express();

app.use(cors({ origin: normalizeCorsOrigin(env.corsOrigin) }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.get('/api/faculty/overview', async (_req, res) => {
  try {
    const studentCount = await Student.countDocuments();

    return res.json({
      success: true,
      studentCount,
    });
  } catch (error) {
    console.error('Faculty overview fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load the faculty overview right now.',
    });
  }
});

app.get('/api/timetable', async (req, res) => {
  try {
    const requestedDay = req.query?.day?.trim();
    const filter = requestedDay ? { day: requestedDay } : {};
    const timetable = await Timetable.find(filter, {
      day: 1,
      subjectId: 1,
      subjectName: 1,
      facultyId: 1,
      startTime: 1,
      endTime: 1,
      room: 1,
    }).lean();

    return res.json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Timetable fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load the timetable right now.',
    });
  }
});

app.get('/api/subjects', async (_req, res) => {
  try {
    const subjects = await Subject.find(
      { department: 'CS', semester: 5 },
      {
        department: 1,
        facultyId: 1,
        facultyName: 1,
        semester: 1,
        subjectCode: 1,
        subjectId: 1,
        subjectName: 1,
      }
    )
      .sort({ subjectCode: 1 })
      .lean();

    return res.json({
      success: true,
      subjects,
    });
  } catch (error) {
    console.error('Subjects fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load classroom subjects right now.',
    });
  }
});

app.get('/api/classroom/item/:assignmentId', async (req, res) => {
  try {
    const assignmentId = req.params?.assignmentId?.trim();

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid assignment id is required.',
      });
    }

    const assignment = await Assignment.findById(assignmentId, {
      assignedToAll: 1,
      createdAt: 1,
      createdByFacultyName: 1,
      description: 1,
      dueDate: 1,
      facultyId: 1,
      facultyName: 1,
      semester: 1,
      status: 1,
      subjectId: 1,
      subjectName: 1,
      targetScope: 1,
      title: 1,
      updatedAt: 1,
    }).lean();

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'This assignment was not found.',
      });
    }

    const subject = assignment.subjectId
      ? await Subject.findOne(
          { subjectId: assignment.subjectId },
          {
            department: 1,
            facultyId: 1,
            facultyName: 1,
            semester: 1,
            subjectCode: 1,
            subjectId: 1,
            subjectName: 1,
          }
        ).lean()
      : null;

    return res.json({
      success: true,
      assignment,
      subject,
    });
  } catch (error) {
    console.error('Single assignment fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load this assignment right now.',
    });
  }
});

app.get('/api/classroom/:subjectId', async (req, res) => {
  try {
    const subjectId = req.params?.subjectId?.trim();

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject id is required.',
      });
    }

    const subject = await Subject.findOne(
      { subjectId },
      {
        department: 1,
        facultyId: 1,
        facultyName: 1,
        semester: 1,
        subjectCode: 1,
        subjectId: 1,
        subjectName: 1,
      }
    ).lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject classroom was not found.',
      });
    }

    const assignments = await Assignment.find(
      { subjectId },
      {
        assignedToAll: 1,
        createdAt: 1,
        createdByFacultyName: 1,
        description: 1,
        dueDate: 1,
        facultyName: 1,
        status: 1,
        subjectId: 1,
        subjectName: 1,
        title: 1,
      }
    )
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      assignments,
      subject,
    });
  } catch (error) {
    console.error('Classroom fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load this classroom right now.',
    });
  }
});

app.get('/api/notes/feed', async (_req, res) => {
  try {
    const notes = await Note.find(
      { semester: 5 },
      {
        attachments: 1,
        facultyId: 1,
        facultyName: 1,
        fileId: 1,
        fileName: 1,
        fileSize: 1,
        fileType: 1,
        fileUrl: 1,
        semester: 1,
        subjectId: 1,
        subjectName: 1,
        title: 1,
        uploadedAt: 1,
      }
    )
      .sort({ uploadedAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      notes: notes.map((note) => ({
        ...note,
        attachments: buildNoteAttachments(note),
      })),
    });
  } catch (error) {
    console.error('Notes feed fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load the note notification feed right now.',
    });
  }
});

app.get('/api/notes/subjects', async (_req, res) => {
  try {
    const subjects = await Subject.find(
      { department: 'CS', semester: 5 },
      {
        department: 1,
        facultyId: 1,
        facultyName: 1,
        semester: 1,
        subjectCode: 1,
        subjectId: 1,
        subjectName: 1,
      }
    )
      .sort({ subjectCode: 1 })
      .lean();

    const notes = await Note.find({}, { subjectId: 1 }).lean();
    const noteCountBySubject = notes.reduce((accumulator, note) => {
      if (!note.subjectId) {
        return accumulator;
      }

      accumulator[note.subjectId] = (accumulator[note.subjectId] || 0) + 1;
      return accumulator;
    }, {});

    const subjectsWithCounts = subjects.map((subject) => ({
      ...subject,
      noteCount: noteCountBySubject[subject.subjectId] || 0,
    }));

    return res.json({
      success: true,
      subjects: subjectsWithCounts,
    });
  } catch (error) {
    console.error('Notes subjects fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load notes subjects right now.',
    });
  }
});

app.get('/api/notes/file/:fileId', async (req, res) => {
  try {
    const rawFileId = req.params?.fileId?.trim();

    if (!rawFileId || !mongoose.Types.ObjectId.isValid(rawFileId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid file id is required.',
      });
    }

    const fileId = new mongoose.Types.ObjectId(rawFileId);
    const filesCollection = mongoose.connection.db.collection(`${NOTES_BUCKET_NAME}.files`);
    const fileDocument = await filesCollection.findOne({ _id: fileId });

    if (!fileDocument) {
      return res.status(404).json({
        success: false,
        message: 'Requested note file was not found.',
      });
    }

    res.setHeader('Content-Type', fileDocument.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileDocument.filename || 'note-file')}"`);

    const downloadStream = getNotesBucket().openDownloadStream(fileId);

    downloadStream.on('error', (error) => {
      console.error('Note file download failed:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Unable to download this note file right now.',
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Note file route failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch this note file right now.',
    });
  }
});

app.post('/api/notes/upload', notesUpload.array('files', 10), async (req, res) => {
  try {
    const title = req.body?.title?.trim();
    const description = req.body?.description?.trim() || '';
    const subjectId = req.body?.subjectId?.trim();
    const facultyName = req.body?.facultyName?.trim() || '';
    const facultyId = req.body?.facultyId?.trim() || '';
    const files = Array.isArray(req.files) ? req.files : [];

    if (!subjectId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Subject id and note title are required.',
      });
    }

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one file is required for note upload.',
      });
    }

    const subject = await Subject.findOne(
      { subjectId },
      {
        facultyId: 1,
        facultyName: 1,
        semester: 1,
        subjectCode: 1,
        subjectId: 1,
        subjectName: 1,
      }
    ).lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject was not found for this upload.',
      });
    }

    const metadata = {
      facultyId: facultyId || subject.facultyId || '',
      facultyName: facultyName || subject.facultyName || '',
      subjectId,
      subjectName: subject.subjectName || '',
      title,
      uploadedAt: new Date().toISOString(),
    };

    const attachments = [];

    for (const file of files) {
      const storedFileId = await uploadBufferToNotesBucket(file, metadata);

      attachments.push({
        fileId: storedFileId,
        fileName: file.originalname || '',
        fileSize: file.size || 0,
        fileType: file.mimetype || '',
        fileUrl: `/api/notes/file/${storedFileId}`,
      });
    }

    const primaryAttachment = attachments[0] || {};

    const note = await Note.create({
      attachments,
      description,
      facultyId: facultyId || subject.facultyId || '',
      facultyName: facultyName || subject.facultyName || '',
      fileId: primaryAttachment.fileId || '',
      fileName: primaryAttachment.fileName || '',
      fileSize: primaryAttachment.fileSize || 0,
      fileType: primaryAttachment.fileType || '',
      fileUrl: primaryAttachment.fileUrl || '',
      semester: subject.semester || '',
      subjectId,
      subjectName: subject.subjectName || '',
      title,
      uploadedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Note uploaded successfully.',
      note: {
        ...note.toObject(),
        attachments: buildNoteAttachments(note),
      },
    });
  } catch (error) {
    console.error('Note upload failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to upload this note right now.',
    });
  }
});

app.patch('/api/notes/:noteId', notesUpload.array('files', 10), async (req, res) => {
  try {
    const noteId = req.params?.noteId?.trim();
    const title = req.body?.title?.trim();
    const description = req.body?.description?.trim() || '';
    const files = Array.isArray(req.files) ? req.files : [];
    const rawRemoveAttachmentIds = req.body?.removeAttachmentIds;
    const removeAttachmentIds = (() => {
      if (!rawRemoveAttachmentIds) {
        return [];
      }

      if (Array.isArray(rawRemoveAttachmentIds)) {
        return rawRemoveAttachmentIds.map((item) => `${item}`.trim()).filter(Boolean);
      }

      if (typeof rawRemoveAttachmentIds === 'string') {
        try {
          const parsedValue = JSON.parse(rawRemoveAttachmentIds);

          if (Array.isArray(parsedValue)) {
            return parsedValue.map((item) => `${item}`.trim()).filter(Boolean);
          }
        } catch {
          return rawRemoveAttachmentIds
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }

      return [];
    })();

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid note id is required.',
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'A note title is required.',
      });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'This note was not found.',
      });
    }

    let attachments = buildNoteAttachments(note);

    if (removeAttachmentIds.length) {
      const removableIds = new Set(removeAttachmentIds);

      for (const attachment of attachments) {
        if (attachment?.fileId && removableIds.has(attachment.fileId) && mongoose.Types.ObjectId.isValid(attachment.fileId)) {
          try {
            await getNotesBucket().delete(new mongoose.Types.ObjectId(attachment.fileId));
          } catch (error) {
            console.error('GridFS attachment delete failed during note update:', error);
          }
        }
      }

      attachments = attachments.filter((attachment) => !attachment?.fileId || !removableIds.has(attachment.fileId));
    }

    if (files.length) {
      const metadata = {
        facultyId: note.facultyId || '',
        facultyName: note.facultyName || '',
        subjectId: note.subjectId || '',
        subjectName: note.subjectName || '',
        title,
        uploadedAt: new Date().toISOString(),
      };

      for (const file of files) {
        const storedFileId = await uploadBufferToNotesBucket(file, metadata);

        attachments.push({
          fileId: storedFileId,
          fileName: file.originalname || '',
          fileSize: file.size || 0,
          fileType: file.mimetype || '',
          fileUrl: `/api/notes/file/${storedFileId}`,
        });
      }
    }

    const primaryAttachment = attachments[0] || {};

    note.attachments = attachments;
    note.description = description;
    note.fileId = primaryAttachment.fileId || '';
    note.fileName = primaryAttachment.fileName || '';
    note.fileSize = primaryAttachment.fileSize || 0;
    note.fileType = primaryAttachment.fileType || '';
    note.fileUrl = primaryAttachment.fileUrl || '';
    note.title = title;

    await note.save();

    return res.json({
      success: true,
      message:
        files.length && removeAttachmentIds.length
          ? 'Note updated, files added, and selected attachments removed successfully.'
          : files.length
            ? 'Note updated and files added successfully.'
            : removeAttachmentIds.length
              ? 'Note updated and selected attachments removed successfully.'
              : 'Note updated successfully.',
      note: {
        ...note.toObject(),
        attachments: buildNoteAttachments(note),
      },
    });
  } catch (error) {
    console.error('Note update failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update this note right now.',
    });
  }
});

app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const noteId = req.params?.noteId?.trim();

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid note id is required.',
      });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'This note was not found.',
      });
    }

    const attachments = buildNoteAttachments(note);

    for (const attachment of attachments) {
      if (attachment?.fileId && mongoose.Types.ObjectId.isValid(attachment.fileId)) {
        try {
          await getNotesBucket().delete(new mongoose.Types.ObjectId(attachment.fileId));
        } catch (error) {
          console.error('GridFS note delete failed:', error);
        }
      }
    }

    await note.deleteOne();

    return res.json({
      success: true,
      message: 'Note deleted successfully.',
    });
  } catch (error) {
    console.error('Note delete failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete this note right now.',
    });
  }
});
app.get('/api/notes/item/:noteId', async (req, res) => {
  try {
    const noteId = req.params?.noteId?.trim();

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid note id is required.',
      });
    }

    const note = await Note.findById(noteId, {
      attachments: 1,
      description: 1,
      facultyId: 1,
      facultyName: 1,
      fileId: 1,
      fileName: 1,
      fileSize: 1,
      fileType: 1,
      fileUrl: 1,
      semester: 1,
      subjectId: 1,
      subjectName: 1,
      title: 1,
      uploadedAt: 1,
    }).lean();

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'This note was not found.',
      });
    }

    const subject = note.subjectId
      ? await Subject.findOne(
          { subjectId: note.subjectId },
          {
            department: 1,
            facultyId: 1,
            facultyName: 1,
            semester: 1,
            subjectCode: 1,
            subjectId: 1,
            subjectName: 1,
          }
        ).lean()
      : null;

    return res.json({
      success: true,
      note: {
        ...note,
        attachments: buildNoteAttachments(note),
      },
      subject,
    });
  } catch (error) {
    console.error('Single note fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load this note right now.',
    });
  }
});
app.get('/api/notes/:subjectId', async (req, res) => {
  try {
    const subjectId = req.params?.subjectId?.trim();

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject id is required.',
      });
    }

    const subject = await Subject.findOne(
      { subjectId },
      {
        department: 1,
        facultyId: 1,
        facultyName: 1,
        semester: 1,
        subjectCode: 1,
        subjectId: 1,
        subjectName: 1,
      }
    ).lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject notes were not found.',
      });
    }

    const notes = await Note.find(
      { subjectId },
      {
        attachments: 1,
        description: 1,
        facultyId: 1,
        facultyName: 1,
        fileId: 1,
        fileName: 1,
        fileSize: 1,
        fileType: 1,
        fileUrl: 1,
        semester: 1,
        subjectId: 1,
        subjectName: 1,
        title: 1,
        uploadedAt: 1,
      }
    )
      .sort({ uploadedAt: -1 })
      .lean();

    return res.json({
      success: true,
      notes: notes.map((note) => ({
        ...note,
        attachments: buildNoteAttachments(note),
      })),
      subject,
    });
  } catch (error) {
    console.error('Notes fetch failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load notes for this subject right now.',
    });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const role = req.body?.role;
    const currentPassword = req.body?.currentPassword?.trim();
    const newPassword = req.body?.newPassword?.trim();

    if (!email || !role || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, role, current password, and new password are required.',
      });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either student or faculty.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password.',
      });
    }

    const AccountModel = roleModels[role];
    const user = await AccountModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
      });
    }

    const validPassword = await passwordMatches(user, currentPassword);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    console.error('Password change failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update the password right now.',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    const role = req.body?.role;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.',
      });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either student or faculty.',
      });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const AccountModel = roleModels[role];
    const user = await AccountModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account was found for these login details.',
      });
    }

    const validPassword = await passwordMatches(user, password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password.',
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role,
        department: env.departmentSlug,
      },
      env.jwtSecret,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: serializeUser(user, role),
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while logging in.',
    });
  }
});

export default app;







