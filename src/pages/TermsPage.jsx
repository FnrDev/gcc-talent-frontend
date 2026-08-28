import { Link } from 'react-router'
import LegalPage from '@/components/legal/LegalPage'
import LegalContactLink from '@/components/legal/LegalContactLink'

const sections = [
  {
    id: 'scope',
    title: 'About these terms',
    content: <>
      <p>GCC Talents (“we”, “us”, or “our”) is a marketplace based in the Kingdom of Bahrain where clients and freelancers can find each other and manage work. These Terms of Service govern your use of our website, accounts, and marketplace services.</p>
      <p>By creating an account or using the service, you agree to these terms. If you do not agree, do not create an account or use the service. Our <Link to="/privacy">Privacy Policy</Link> explains how personal information is handled; it is not consent to optional data processing. Questions about these terms can be sent to <LegalContactLink />.</p>
    </>,
  },
  {
    id: 'accounts',
    title: 'Eligibility and your account',
    content: <>
      <p>You must have full legal capacity to agree to these terms and enter engagements under the laws that apply to you. The service is not intended for children. If you act for a company or another person, you must have authority to bind them and any permissions required to carry out the work.</p>
      <ul>
        <li>Provide accurate account and profile information, and keep it current.</li>
        <li>Protect your password and verification or recovery links. Do not impersonate someone or use another person’s account without authorization.</li>
        <li>Use your account only for activities you are authorized to carry out, including any required professional permissions.</li>
        <li>Take reasonable steps to address suspected unauthorized access, including changing your password when appropriate and notifying us at <LegalContactLink />.</li>
      </ul>
    </>,
  },
  {
    id: 'marketplace',
    title: 'How the marketplace works',
    content: <>
      <p>Clients describe work and choose whom to engage. Freelancers decide which opportunities to pursue and what services to offer. Each party is responsible for evaluating the other party and the proposed work.</p>
      <p>Profiles, reviews, verification indicators, sample listings, and promotional descriptions are not guarantees of qualifications, work quality, earnings, availability, or a successful engagement. Check information that matters to your decision.</p>
      <p>Clients and freelancers agree their services directly with each other. GCC Talents provides marketplace and coordination tools; it is not a party to an engagement unless separately agreed in writing. Using the platform does not, by itself, create employment, agency, or partnership with GCC Talents or replace the legal obligations that apply to the work.</p>
      <p>Use the features actually available in your account. Descriptions of planned features or examples do not guarantee their availability.</p>
    </>,
  },
  {
    id: 'engagements',
    title: 'Jobs, proposals, and delivery',
    content: <>
      <p>Before starting work, the client and freelancer should clearly agree on the scope, deliverables, schedule, price and currency, milestones, revision limits, approval criteria, confidentiality, and ownership of the finished work.</p>
      <p>Make sure job descriptions and proposals accurately describe what is being offered. Record material changes to scope or price in the agreed engagement terms rather than assuming that a message or a status change settles every issue.</p>
      <p>Deliver only material you have the right to provide. Do not include another person’s confidential information or use attachments and links in a way that violates their rights. Keep appropriate records of approvals, deliveries, and changes.</p>
    </>,
  },
  {
    id: 'payments',
    title: 'Payments, cancellations, and taxes',
    content: <>
      <p>Before accepting work, agree the amount, currency, milestones, payment timing, and any applicable fees or taxes. Internal transaction records may include calculated platform fees. A displayed amount or transaction status does not replace the parties’ agreed obligations or confirm an external charge.</p>
      <p>The platform currently records internal wallet balances and transaction history; it does not process card payments or provide an integrated bank-payout service. A wallet entry or a label such as “escrow” is not, by itself, proof that money has been received, safeguarded, or paid out. Do not rely on a balance or status alone as confirmation of settlement.</p>
      <p>Clients and freelancers should agree cancellation, revision, and refund conditions before work starts. Any amount due depends on the agreement, work performed, and applicable law. To raise a payment-record error, cancellation request, or refund concern, contact <LegalContactLink /> with the relevant job or contract reference. We can review platform records, but cannot reverse a payment made through an external service.</p>
      <p>These terms do not promise regulated escrow, payment protection, guaranteed earnings, or an automatic refund. Any future payment service will require its own disclosed provider, funding, withdrawal, fee, and refund arrangements before use. Nothing here removes a refund or other remedy required by law.</p>
      <p>Each party is responsible for understanding its own tax and invoicing obligations, subject to any duties that applicable law places on the platform.</p>
    </>,
  },
  {
    id: 'conduct',
    title: 'Acceptable use',
    content: <>
      <p>Use the marketplace lawfully and treat other people fairly. You must not:</p>
      <ul>
        <li>Commit fraud, impersonate others, misrepresent credentials, fabricate reviews, or manipulate marketplace records.</li>
        <li>Harass, threaten, unlawfully discriminate, exploit others, or offer unlawful goods or services.</li>
        <li>Infringe intellectual-property rights or publish information you have no right to share.</li>
        <li>Send malware, compromise accounts, bypass access controls, or disrupt the service.</li>
        <li>Collect other users’ personal information without authorization or use it for spam or unrelated purposes.</li>
      </ul>
      <p>Report suspected abuse, security concerns, or unlawful content to <LegalContactLink />. Include the relevant profile, listing, or contract reference and a description of the issue; do not share account passwords or unnecessary sensitive information.</p>
    </>,
  },
  {
    id: 'content',
    title: 'Your content and intellectual property',
    content: <>
      <p>You remain responsible for the profiles, listings, proposals, files, links, and reviews you submit. Only share content you own or are allowed to use, and respect any confidentiality obligations attached to it.</p>
      <p>You retain ownership of your content. By submitting it, you grant GCC Talents a non-exclusive, royalty-free permission to host, store, reproduce, and display it as needed to operate the marketplace and make it available to its intended audience. This permission does not transfer ownership of your pre-existing work or authorize unrelated advertising use.</p>
      <p>Ownership or licensing of commissioned work should be agreed between the client and freelancer in writing, including when any transfer takes effect and how third-party materials may be used. Do not assume that posting or paying for a project resolves every intellectual-property issue.</p>
    </>,
  },
  {
    id: 'privacy',
    title: 'Privacy and confidentiality',
    content: <>
      <p>The <Link to="/privacy">Privacy Policy</Link> describes the information handled by the service, its visibility, and your choices and rights. Public profiles, listings, and reviews should not be used to exchange secrets or sensitive personal information.</p>
      <p>Use information received from another user only for the authorized purpose of the engagement and in line with applicable law and any agreed confidentiality terms. External attachment links and services have their own access rules; the platform does not make a publicly shared link private.</p>
    </>,
  },
  {
    id: 'access',
    title: 'Service access and account restrictions',
    content: <>
      <p>The platform may need maintenance, change over time, or experience interruptions. We do not guarantee uninterrupted access, the continued availability of a particular feature, or access to any specific opportunity.</p>
      <p>We may remove content or restrict, suspend, or close an account where reasonably necessary to address a breach of these terms, protect users or the service, investigate misuse, or comply with the law. Where appropriate and legally permitted, we will explain the reason. Urgent safety or security issues may require action without advance notice.</p>
      <p>To request a review of a restriction or to close your account, email <LegalContactLink />. Stopping use or closing an account does not automatically cancel a separate engagement, settle outstanding amounts, or erase records that must be retained. Information retention is explained in our <Link to="/privacy#retention">Privacy Policy</Link>.</p>
    </>,
  },
  {
    id: 'disputes',
    title: 'Governing law and disputes',
    content: <>
      <p>These terms and disputes concerning your use of GCC Talents are governed by the laws of the Kingdom of Bahrain. The competent courts of the Kingdom of Bahrain have jurisdiction, subject to any mandatory rights or jurisdiction rules that apply to you.</p>
      <p>For a complaint about the platform, contact <LegalContactLink /> with the relevant details. For an engagement dispute, first raise the issue with the other party where it is safe to do so and retain records of the agreement and work. You may ask us to review relevant platform records; we do not act as a court or guarantee that the other party will agree to a resolution.</p>
      <p>Nothing in these terms excludes liability that cannot legally be excluded, removes mandatory consumer or data-protection rights, or prevents you from contacting a regulator or seeking a remedy available under applicable law.</p>
      <p>A marketplace status or balance entry does not, by itself, resolve a legal dispute or override mandatory rights.</p>
    </>,
  },
  {
    id: 'contact-updates',
    title: 'Contact details and changes',
    content: <>
      <p><strong>Contact:</strong> GCC Talents, Kingdom of Bahrain. For support, complaints, or questions about these terms, email <LegalContactLink />.</p>
      <p>We may update these terms when our service or legal requirements change. The date at the top identifies the latest version. Material changes will be communicated through the service or an appropriate contact channel, with any notice or acceptance required by law.</p>
      <p>Changes do not automatically rewrite an existing engagement between a client and freelancer or remove rights that have already arisen. If you do not agree to updated terms, stop using the service and contact us about account closure and any outstanding commitments.</p>
    </>,
  },
]

function TermsPage() {
  return <LegalPage path="/terms" title="Terms of Service" description="The terms for using GCC Talents, working together, and understanding your responsibilities on the marketplace." sections={sections} />
}

export default TermsPage
