import Link from 'next/link';

const footerColumns = [
  { title: 'Product', links: ['Overview', 'Pricing', 'Security', 'Integrations'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
  { title: 'Help', links: ['Support', 'Documentation', 'Status', 'FAQs'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Licenses'] },
];

export default function EdumeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-6 py-10 md:px-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr,1.4fr]">
        <div className="space-y-3">
          <div className="text-lg font-bold text-slate-900">edume</div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
              4.9/5
            </span>
            <span>Rated 4.5 on Trustpilot</span>
          </div>
          <p className="text-sm text-slate-600">
            Unified learning platform to connect students, teachers and families with clear progress
            tracking.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>(c) {new Date().getFullYear()} edume. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-slate-800">
            Privacy
          </Link>
          <Link href="#" className="hover:text-slate-800">
            Terms
          </Link>
          <Link href="#" className="hover:text-slate-800">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="space-y-2 text-sm text-slate-600">
        {links.map((link) => (
          <li key={link}>
            <Link href="#" className="hover:text-slate-900">
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
