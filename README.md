# ChainStore

A modern template marketplace built with Next.js and powered by cryptocurrency payments through [HOT Pay](https://hot-labs.org). Browse, purchase, and instantly download production-ready web templates using crypto on the NEAR blockchain.

Built for the **NEAR Protocol Hackathon**, sponsored by **HOT Pay** ($3,000 prize track).

## Features

- **Crypto Payments via HOT Pay** -- Purchase templates with cryptocurrency on the NEAR blockchain. Secure, fast, and decentralized.
- **Template Marketplace** -- Browse a curated catalog of production-ready templates with category filtering, previews, and detailed descriptions.
- **Instant Download** -- Get immediate download access after payment confirmation. No delays, no intermediaries.
- **User Dashboard** -- Track purchases, view spending stats, and re-download templates anytime.
- **Real-time Payment Status** -- Polling + webhook architecture for reliable payment confirmation from the NEAR network.
- **Authentication** -- Google OAuth and email/password sign-up via Supabase Auth.
- **Dark/Light Theme** -- Full theme support with system preference detection.
- **Responsive Design** -- Optimized for desktop, tablet, and mobile screens.

## Tech Stack

| Layer           | Technology                                                                      |
| --------------- | ------------------------------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router, React 19)                         |
| Language        | TypeScript                                                                      |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS)                      |
| Payments        | [HOT Pay](https://hot-labs.org) (NEAR blockchain)                               |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Deployment      | [Vercel](https://vercel.com)                                                    |

## Architecture

```
User -> Next.js App -> Supabase (Auth + DB)
                    -> HOT Pay API (Payments)
                    -> HotPay Webhook -> Supabase (Update purchase status)
```

### Payment Flow

1. User selects a template and clicks "Buy with Crypto"
2. App creates a purchase record (status: `pending`) with a unique memo (UUID)
3. User is redirected to the HOT Pay payment page
4. User completes the crypto payment on NEAR
5. HOT Pay sends a webhook to `/api/hotpay/webhook` confirming the transaction
6. The payment status page polls `/api/orders/verify` every 3 seconds
7. Once confirmed, the purchase is marked `completed` and the user can download

### Database Schema

- **templates** -- Product catalog (name, slug, price, preview image, download URL, tech stack, features)
- **purchases** -- Purchase records linked to users and templates (memo, payment status, transaction ID)

Row-Level Security (RLS) is enabled on all tables. Users can only view their own purchases.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project
- A [HOT Pay](https://hot-labs.org) partner account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chainstore.git
cd chainstore

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the database migrations
# Copy and execute the SQL from .github/prompts/all.sql in your Supabase SQL editor

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable                               | Description                                        |
| -------------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Your app's public URL (for webhooks and redirects) |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public/anon key                           |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase service role key (server-side only)       |
| `NEXT_PUBLIC_HOTPAY_BASE_URL`          | HOT Pay payment gateway URL                        |
| `NEXT_PUBLIC_HOTPAY_ITEM_ID`           | HOT Pay catalog item ID                            |
| `HOTPAY_API_TOKEN`                     | HOT Pay API token for payment verification         |

## Project Structure

```
chainstore/
├── app/
│   ├── page.tsx                  # Home page (hero, features, featured templates)
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Theme variables and Tailwind config
│   ├── store/
│   │   ├── page.tsx              # Template catalog with category filters
│   │   └── [slug]/page.tsx       # Template detail page
│   ├── auth/
│   │   ├── login/page.tsx        # Login/signup page
│   │   └── callback/route.ts     # OAuth callback handler
│   ├── dashboard/page.tsx        # User dashboard
│   ├── purchases/page.tsx        # Purchase history
│   ├── payment/status/page.tsx   # Real-time payment status polling
│   └── api/
│       ├── orders/
│       │   ├── route.ts          # Create order + generate payment URL
│       │   └── verify/route.ts   # Verify payment status
│       └── hotpay/
│           └── webhook/route.ts  # HOT Pay webhook handler
├── components/
│   ├── auth-provider.tsx         # Auth context provider
│   ├── navbar.tsx                # Navigation bar with theme toggle
│   ├── hero-buttons.tsx          # Auth-aware hero CTA buttons
│   ├── theme-provider.tsx        # Theme provider (light/dark)
│   ├── theme-toggle.tsx          # Theme toggle button
│   ├── template-card.tsx         # Template card component
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Utility functions
└── public/
    └── logo.png                  # Brand logo
```

## HOT Pay Integration

ChainStore integrates with HOT Pay for cryptocurrency payments on the NEAR blockchain. Key integration points:

- **Payment URL Generation** (`/api/orders`) -- Creates a payment URL with the template price, a unique memo, webhook URL, and redirect URL.
- **Webhook Handler** (`/api/hotpay/webhook`) -- Receives payment confirmations from HOT Pay, updates purchase status, and stores the NEAR transaction ID.
- **Payment Verification** (`/api/orders/verify`) -- Polls the HOT Pay API as a fallback mechanism to verify payment status.

The memo (UUID) is the primary key linking the payment on HOT Pay to the purchase record in the database.

## Deployment

Deploy to Vercel with one click:

```bash
# Build for production
pnpm build

# Or deploy via Vercel CLI
vercel --prod
```

Make sure to configure all environment variables in your Vercel project settings.

## License

MIT
