import { StudentModuleScreen } from '@/components/student-module-screen';

export default function StudentNoticesScreen() {
  return (
    <StudentModuleScreen
      title="Notices board"
      subtitle="Department circulars, class updates, and official student notices will appear here."
      sectionLabel="Notices"
      emptyTitle="No notices yet"
      emptyDescription="This screen is ready for department announcements, timetable updates, and urgent circulars."
      heroIcon="campaign"
      accentColor="#8A4A12"
      accentSoft="#F3BE7A"
    />
  );
}
