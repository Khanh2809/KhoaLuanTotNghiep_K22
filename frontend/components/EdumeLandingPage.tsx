import EdumeFooter from './EdumeFooter';
import EdumeMainContent from './EdumeMainContent';
import EdumeNavbar from './EdumeNavbar';

/**
 * Full landing page (self-contained) if you want to render standalone.
 * Now delegates to individual navbar, content, and footer components.
 */
export default function EdumeLandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] px-4 flex justify-center">
      <div className="w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-100">
        <EdumeNavbar />
        <EdumeMainContent />
        <EdumeFooter />
      </div>
    </div>
  );
}

export { EdumeNavbar, EdumeMainContent, EdumeFooter };
