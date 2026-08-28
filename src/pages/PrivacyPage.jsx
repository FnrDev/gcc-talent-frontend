import { Link } from 'react-router'
import LegalPage from '@/components/legal/LegalPage'
import LegalContactLink from '@/components/legal/LegalContactLink'

const sections = [
  {
    id: 'about',
    title: 'About this policy',
    content: <>
      <p>GCC Talents (“we”, “us”, or “our”) is a marketplace based in the Kingdom of Bahrain that connects clients and freelancers. This Privacy Policy explains how we handle personal information when you browse the website, create an account, use marketplace services, or contact us.</p>
      <p>GCC Talents is responsible for the handling of information described here. You can reach us at <LegalContactLink />. Read this policy alongside our <Link to="/terms">Terms of Service</Link>. Other users and external websites are responsible for their own use of information.</p>
    </>,
  },
  {
    id: 'information',
    title: 'Information the service handles',
    content: <>
      <ul>
        <li><strong>Account details:</strong> your name, email address, account role, account status, verification information, and sign-in or recovery records. Passwords are stored as hashes, not as readable passwords.</li>
        <li><strong>Profile information:</strong> information you add, such as an avatar, location, biography, skills, languages, availability, rates, portfolio links, or company details.</li>
        <li><strong>Marketplace activity:</strong> jobs, budgets, proposals, delivery estimates, contract terms, milestones, delivery and revision notes, attachment links, ratings, and reviews.</li>
        <li><strong>Financial records:</strong> internal wallet balances and ledger entries, including amounts, currencies, references, and transaction status. The platform does not currently collect bank-card details or process card payments.</li>
        <li><strong>Security and service records:</strong> sign-in times and audit records of selected actions, including account or resource identifiers, request paths, IP addresses, and timestamps.</li>
        <li><strong>Support correspondence:</strong> your email address and the information you choose to include when contacting us, such as account, privacy, or engagement questions.</li>
      </ul>
      <p>Account registration requires your name, email address, password, and account type. Without these details, we cannot create an account. Additional profile information is optional unless a feature asks for it to complete your request.</p>
      <p>Other users may provide information about you through an engagement or a review. Avoid including identity documents, sensitive personal information, or another person’s private details in public content.</p>
    </>,
  },
  {
    id: 'use',
    title: 'How information is used',
    content: <>
      <p>We use information to provide and support the marketplace, including to:</p>
      <ul>
        <li>Create accounts, authenticate requests, verify email addresses, and handle password recovery.</li>
        <li>Display profiles and listings, exchange proposals, and record agreed work and delivery activity.</li>
        <li>Maintain balances, transaction history, ratings, and contract records.</li>
        <li>Send account-verification, password-reset, and password-change emails.</li>
        <li>Administer accounts and investigate suspicious activity using access controls and audit records.</li>
        <li>Respond to support and privacy requests, address complaints, and meet applicable legal obligations.</li>
      </ul>
      <p>Our grounds for processing depend on the purpose: providing an account and requested services is necessary for our agreement with you; security and abuse prevention support legitimate interests where permitted and not overridden by your rights; and required records or disclosures may be necessary to meet legal obligations. Where consent is required, we ask for it separately. Reading this policy is not consent to optional processing.</p>
    </>,
  },
  {
    id: 'sharing',
    title: 'Visibility and sharing',
    content: <>
      <p><strong>Public content.</strong> Public profiles may include your name, avatar, location, skills, portfolio, ratings, verification status, and activity counters, including earnings or spending totals. Open, visible jobs and published reviews can also be viewed publicly. Public reviews include the reviewer’s name, avatar, and role, as well as the related contract’s title and status. Public profile responses exclude your email address.</p>
      <p><strong>Engagement participants.</strong> Proposals are available to their author and the relevant job owner. Contract information and associated transaction records are available to the contract participants and administrators. A link you attach may be accessible outside the platform according to the destination’s own permissions.</p>
      <p><strong>Administration and service providers.</strong> Authorized administrators can access account, contract, and transaction information for platform administration and support. Infrastructure providers handle information needed to host and store service data. We use Resend to deliver account emails, which can include your email address, display name, and verification or recovery link.</p>
      <p><strong>Legal requirements.</strong> Information may be disclosed to a competent authority where required by applicable law or a valid legal order.</p>
    </>,
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    content: <>
      <p>We use the following browser storage for account access and interface state:</p>
      <p className="text-xs sm:hidden">Scroll horizontally in the table to see every column.</p>
      <div role="region" aria-label="Browser storage details" tabIndex={0} className="overflow-x-auto rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm leading-6">
          <caption className="sr-only">Browser storage, purpose, and duration</caption>
          <thead className="bg-muted/50 text-foreground">
            <tr><th scope="col" className="p-3 font-medium">Storage</th><th scope="col" className="p-3 font-medium">Purpose</th><th scope="col" className="p-3 font-medium">Duration</th></tr>
          </thead>
          <tbody className="divide-y">
            <tr><th scope="row" className="p-3 align-top font-medium text-foreground">Account token<br /><span className="font-normal text-muted-foreground">Local storage</span></th><td className="p-3 align-top">Authenticates your requests.</td><td className="p-3 align-top">Removed on sign-out, an invalid-session response, or when you clear site data. The server also limits token validity.</td></tr>
            <tr><th scope="row" className="p-3 align-top font-medium text-foreground">Refresh token<br /><span className="font-normal text-muted-foreground">HTTP-only cookie</span></th><td className="p-3 align-top">Supports session renewal where the deployment and browser allow it.</td><td className="p-3 align-top">Up to seven days. Signing out of this web app does not currently clear this separate server cookie.</td></tr>
            <tr><th scope="row" className="p-3 align-top font-medium text-foreground">Sidebar state<br /><span className="font-normal text-muted-foreground">Cookie</span></th><td className="p-3 align-top">Stores the selected admin-sidebar state.</td><td className="p-3 align-top">Seven days from the most recent change.</td></tr>
          </tbody>
        </table>
      </div>
      <p>You can remove cookies and local storage through your browser’s site-data settings. Doing so can sign you out or reset preferences; it does not delete your account or server records.</p>
      <p>The web application does not use advertising or analytics trackers. If we introduce optional tracking, we will explain its purpose and provide any choices or consent controls required by applicable law before using it.</p>
    </>,
  },
  {
    id: 'retention',
    title: 'Retention and account deletion',
    content: <>
      <p>Retention depends on the information and why it is needed. Relevant considerations include whether your account is active, whether an engagement or payment record is still needed, applicable record-keeping obligations, unresolved disputes, and security investigations.</p>
      <p>Account, marketplace, and security audit records do not expire automatically. Audit records can retain account or resource identifiers even after an account or listing is removed.</p>
      <p>To request account closure, access to your information, or deletion, email <LegalContactLink />. These requests are handled through support, not a self-service erasure or export tool. We may need to verify your identity and review records connected to active work or other users.</p>
      <p>Closing an account does not automatically erase every related record. Contract and transaction history, records needed for legal claims or obligations, and relevant security audit records may need to be retained. Where a request cannot be fully carried out, we will explain the reason and any available next steps, subject to applicable law.</p>
    </>,
  },
  {
    id: 'security-transfers',
    title: 'Security and processing locations',
    content: <>
      <p>The application uses password hashing, authenticated requests, role-based access controls, and security audit records. These measures do not guarantee that every account, device, attachment link, or communication is secure. Keep your credentials private and use caution when sharing files or following external links.</p>
      <p>Our marketplace is based in Bahrain, but service providers and users you engage with may be in other countries. Do not assume that information is stored or accessed only in Bahrain. Transfers of personal information outside Bahrain are subject to applicable legal requirements. Contact <LegalContactLink /> for information about processing locations and arrangements relevant to your data.</p>
    </>,
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    content: <>
      <p>Under Bahrain’s Personal Data Protection Law (Law No. 30 of 2018), you may, subject to its conditions:</p>
      <ul>
        <li>Ask whether we process your personal information and request access to it.</li>
        <li>Request correction, blocking, or erasure of information where the legal conditions apply.</li>
        <li>Object to direct marketing and to certain other processing.</li>
        <li>Withdraw consent where processing relies on your consent.</li>
      </ul>
      <p>Send requests to <LegalContactLink />. Include enough information to identify your account and describe your request, but do not email your password. Identity checks may be needed to protect your information. We will respond in accordance with applicable legal requirements.</p>
      <p>You may also complain to Bahrain’s Personal Data Protection Authority. The <a href="https://www.bahrain.bh/wps/portal/en/BNP/ExploreBahrain/SecureDataTransfer" target="_blank" rel="noopener noreferrer">Bahrain National Portal’s data protection guidance<span className="sr-only"> (opens in a new tab)</span></a> provides further information about the law and authority. Contacting us does not limit your right to approach the authority.</p>
      <p>You can choose what optional information to put in a profile or listing and manage browser storage locally. Do not submit information you do not want others to see in a public profile, job, portfolio, or review.</p>
    </>,
  },
  {
    id: 'contact-updates',
    title: 'Contact details and updates',
    content: <>
      <p><strong>Contact:</strong> GCC Talents, Kingdom of Bahrain. For privacy questions, account requests, or concerns about information shared on the service, email <LegalContactLink />.</p>
      <p>The marketplace is intended for people with the legal capacity to enter professional engagements, not for children. If you believe a child has provided information without appropriate authorization, contact us so we can review it and take appropriate action.</p>
      <p>We may update this policy as the service or legal requirements change. The date at the top shows the latest revision. We will provide additional notice or seek consent when required by applicable law.</p>
    </>,
  },
]

function PrivacyPage() {
  return <LegalPage path="/privacy" title="Privacy Policy" description="How we handle your information, where it is shared, and how to exercise your privacy rights." sections={sections} />
}

export default PrivacyPage
