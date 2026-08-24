# GCC Talent Freelance Marketplace

## Overview

GCC Talent Marketplace is an online platform similar to Upwork and Fiverr. Clients publish jobs or
browse ready-made service packages, freelancers showcase their skills and submit proposals, and
both sides collaborate, deliver and pay securely through the platform. An admin team keeps the
marketplace safe and fair.

## Screenshots

## Technologies Used

- **React**

## Installation
 
Follow these steps to set up and run the React frontend locally.
 
### Prerequisites
 
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- The backend API server running (see the [backend repo](https://github.com/FnrDev/gcc-talent-backend))
### Steps
 
1. **Create a folder for your project and cd into it**
```bash
   mkdir gcc-talent-frontend
   cd gcc-talent-frontend
```
 
2. **Perform the following commands in the command line**
```bash
   git clone https://github.com/FnrDev/gcc-talent-frontend.git .
   rm -rf .git
   rm README.md
```
 
3. **Create a `.env` file with the following values**
```env
   VITE_BACK_END_SERVER_URL=http://localhost:3000
```
 
4. **run:**
```bash
   npm i
```
 
5. **run:**
```bash
   npm run dev
```
 
   The app should now be running at `http://localhost:5173`
 
---


## User Stories

### Authentication

1. **As a guest**, I want to create an account as a client or freelancer so I can use the marketplace.
2. **As a user**, I want to sign in so I can access my account and dashboard.
3. **As a user**, I want to sign out so my account remains secure.
4. **As a user**, I want to update my account information so I can keep my details current.
5. **As a user**, I want to change my password so I can keep my account secure.

### Freelancer

6. **As a freelancer**, I want to create my professional profile so clients can learn about me.
7. **As a freelancer**, I want to edit my profile so I can keep my information up to date.
8. **As a freelancer**, I want to add my skills, hourly rate, languages, and availability so clients can evaluate whether I fit their needs.
9. **As a freelancer**, I want to add portfolio items so I can showcase my previous work.
10. **As a guest or client**, I want to view a freelancer's public profile so I can evaluate their experience and reputation.

### Client

11. **As a client**, I want to create and edit my profile so freelancers can learn about me or my company.
12. **As a freelancer**, I want to view a client's information so I can understand who is offering the work.

### Jobs

13. **As a client**, I want to create a job so freelancers can apply for my work.
14. **As a client**, I want to edit my job while it is available so I can correct or update its details.
15. **As a client**, I want to close or reopen a job so I can control whether freelancers can apply.
16. **As a client**, I want to view all of my jobs and their statuses so I can manage them easily.
17. **As a guest or freelancer**, I want to browse available jobs so I can discover work opportunities.
18. **As a guest or freelancer**, I want to search, filter, and sort jobs so I can find suitable opportunities quickly.
19. **As a guest or freelancer**, I want to view a job's full details so I can decide whether it is suitable for me.

### Proposals

20. **As a freelancer**, I want to submit a proposal to an open job so the client can consider hiring me.
21. **As a freelancer**, I want to edit or withdraw a pending proposal so I can manage my applications.
22. **As a freelancer**, I want to view my proposals and their statuses so I can track my applications.
23. **As a client**, I want to view proposals submitted to my job so I can compare freelancers.
24. **As a client**, I want to shortlist a proposal so I can keep track of promising freelancers.
25. **As a client**, I want to decline a proposal so I can remove candidates I do not want to hire.
26. **As a client**, I want to accept a proposal so I can hire a freelancer and create a contract.

### Contracts & Milestones

27. **As a client or freelancer**, I want to view my contracts so I can keep track of my ongoing and completed work.
28. **As a client or freelancer**, I want to view the contract workspace so I can see milestones, deliveries, activity, and payment information.
29. **As a client**, I want to create milestones so the work and payments can be divided into clear stages.
30. **As a client**, I want to fund a milestone so the agreed payment is secured before the freelancer delivers the work.
31. **As a freelancer**, I want to submit work for a funded milestone so the client can review my delivery.
32. **As a client**, I want to request a revision so the freelancer can make changes before I approve the work.
33. **As a client**, I want to approve a milestone so the freelancer can receive payment.
34. **As a client or freelancer**, I want the contract to be completed when all milestones are approved.

### Wallet, Escrow & Payments

35. **As a user**, I want to view my wallet balance so I can see my available funds.
36. **As a client**, I want to add simulated funds to my wallet so I can pay for work.
37. **As a client**, I want milestone funds to be held in escrow so payment is protected while the work is being completed.
38. **As a freelancer**, I want approved milestone payments released to my wallet so I can receive my earnings.
39. **As a user**, I want payment transactions to be recorded so I can track money moving through my account.

### Reviews & Ratings

40. **As a client**, I want to review a freelancer after a contract ends so I can share my experience.
41. **As a freelancer**, I want to review a client after a contract ends so I can share my experience.
42. **As a guest or user**, I want to view ratings and reviews on profiles so I can judge a user's reputation.

### Admin

43. **As an admin**, I want to view platform statistics so I can monitor marketplace activity.
44. **As an admin**, I want to search and view users so I can manage marketplace accounts.
45. **As an admin**, I want to verify, suspend, unsuspend, or delete users so I can keep the marketplace safe.
46. **As an admin**, I want to manage categories so jobs and freelancers remain organised.
47. **As an admin**, I want to manage the master skills list so users can select consistent skills across the platform.

### Platform

48. **As a guest**, I want to view a landing page explaining GCC Talent so I can understand how the marketplace works.
49. **As a logged-in user**, I want to see a dashboard based on my role so I can quickly access the features relevant to me.
50. **As a user**, I want clear loading, success, empty, and error states so I always understand what is happening.
51. **As a user**, I want the marketplace to work on desktop, tablet, and mobile so I can use it from different devices.
52. **As a user**, I want to be able to switch between Arabic and English Interfeces

## Routes


## Features


## Future Enhancements


## Credits
