import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({ component: Privacy })

function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm text-slate-700">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mb-6 text-xs text-slate-400">Last updated: May 2025</p>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Controller</h2>
        <p>
          Clément Devos
          <br />
          <a href="mailto:clement.devos.pro@gmail.com" className="text-indigo-600 underline underline-offset-2">
            clement.devos.pro@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">What data is processed</h2>
        <p className="mb-3">
          When you sign in with your Bosch account, the following data is received from Bosch's
          identity server and stored in your session:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Email address</li>
          <li>Display name</li>
          <li>User identifier (subject ID)</li>
          <li>OAuth access token and refresh token</li>
        </ul>
        <p className="mt-3">
          Your eBike activity and bike profile data is fetched from the Bosch eBike Cloud API on
          your request and displayed in your browser. It is not stored on any server beyond the
          duration of the API call.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Session cookie</h2>
        <p>
          After sign-in, a single <strong>strictly necessary</strong> cookie named{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            bosch_session
          </code>{' '}
          is set on your browser. It is:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Encrypted with AES-GCM using a server-side secret</li>
          <li>
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">HttpOnly</code>{' '}
            — not accessible to JavaScript
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">SameSite</code>{' '}
            — not sent on cross-site requests
          </li>
          <li>Valid for 30 days, or until you sign out</li>
        </ul>
        <p className="mt-3">
          This cookie is required for the service to function. No consent is required under the
          ePrivacy Directive for strictly necessary cookies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          What is not collected
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No analytics or tracking</li>
          <li>No advertising</li>
          <li>No third-party cookies</li>
          <li>No data shared with third parties (other than the Bosch API calls you trigger)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Legal basis</h2>
        <p>
          Processing is based on the performance of the service you requested (Art. 6(1)(b) GDPR).
          The session data is necessary to authenticate API requests to Bosch on your behalf.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Your rights</h2>
        <p className="mb-2">
          Under GDPR you have the right to access, rectify, erase, or port your data, and to object
          to processing. To exercise these rights, contact{' '}
          <a href="mailto:clement.devos.pro@gmail.com" className="text-indigo-600 underline underline-offset-2">
            clement.devos.pro@gmail.com
          </a>
          .
        </p>
        <p>
          Signing out deletes the session cookie and all associated data from the server
          immediately. You can also revoke this app's access to your Bosch account at any time via{' '}
          <a
            href="https://flow.bosch-ebike.com/data-act"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline underline-offset-2"
          >
            Bosch app permissions
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Contact</h2>
        <p>
          Questions or complaints:{' '}
          <a href="mailto:clement.devos.pro@gmail.com" className="text-indigo-600 underline underline-offset-2">
            clement.devos.pro@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
