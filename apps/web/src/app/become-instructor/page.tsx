import { redirect } from 'next/navigation';

/** Legacy student-apply route — instructor signup is now a dedicated register flow. */
export default function BecomeInstructorRedirect() {
  redirect('/register/instructor');
}
