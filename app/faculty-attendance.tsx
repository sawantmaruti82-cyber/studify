import { FacultyModuleScreen } from '@/components/faculty-module-screen';

export default function FacultyAttendanceScreen() {
  return (
    <FacultyModuleScreen
      activeRoute="/faculty-attendance"
      accentColor="#0E5A43"
      accentSoft="#CDEEDF"
      emptyDescription="Open attendance sessions, review present counts, and submit the final register for your classes from here."
      emptyTitle="Attendance tools are ready"
      heroIcon="fact-check"
      sectionLabel="Attendance"
      subtitle="Manage class-wise attendance with a clear faculty workflow."
      title="Attendance management"
    />
  );
}
