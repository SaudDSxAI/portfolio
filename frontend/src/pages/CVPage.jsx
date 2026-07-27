import BackButton from '../components/ui/BackButton';

const CV_PATH = '/cv/Saud-Ahmad-CV.pdf';

export default function CVPage() {
  return (
    <div className="relative min-h-screen py-24 sm:py-28 px-4 sm:px-6">
      <BackButton to="/" label="Back home" />

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-black tracking-tight">
              Saud Ahmad — CV
            </h1>
            <p className="text-sm text-zinc-600 mt-1">
              View it below, or grab a copy for yourself.
            </p>
          </div>

          <a
            href={CV_PATH}
            download="Saud-Ahmad-CV.pdf"
            className="group flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex-shrink-0"
          >
            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download CV
          </a>
        </div>

        <div className="rounded-2xl border border-black/10 overflow-hidden shadow-lg shadow-black/5 bg-white">
          <object data={CV_PATH} type="application/pdf" className="w-full" style={{ height: '80vh' }}>
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-6">
              <p className="text-sm text-zinc-600">
                Your browser can't preview PDFs inline here.
              </p>
              <a
                href={CV_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary-700 hover:text-primary-900 underline underline-offset-2"
              >
                Open the CV in a new tab instead
              </a>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
}
