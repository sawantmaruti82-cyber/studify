import { StudentModuleScreen } from '@/components/student-module-screen';

export default function StudentAttendanceScreen() {
  return (
    <StudentModuleScreen
      activeRoute="/student-attendance"
      title="Attendance hub"
      subtitle="Your attendance summary and subject-wise records will appear here."
      sectionLabel="Attendance"
      emptyTitle="No attendance records yet"
      emptyDescription="This page is ready for subject percentages, monthly trends, and shortage alerts."
      heroIcon="fact-check"
      accentColor="#0F5D7A"
      accentSoft="#69C8E6"
    />
  );
}
