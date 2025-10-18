# Stripe Setup Guide

This guide explains how to set up Stripe payments for Phonetix.

## Prerequisites

1. Create a Stripe account at https://stripe.com
2. Complete your business profile in Stripe Dashboard
3. Get your API keys from https://dashboard.stripe.com/test/apikeys

## Step 1: Add Environment Variables

Add these to your Railway environment variables:

### Stripe Keys
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Supabase Service Key
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get this from Supabase Dashboard → Settings → API → service_role key (NOT the anon key!)

## Step 2: Create Subscriptions Table

Run this SQL in your Supabase SQL Editor:

```sql
-- The SQL is in: supabase-subscriptions-schema.sql
```

Or copy/paste the contents of `supabase-subscriptions-schema.sql`

## Step 3: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhook`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook secret and add it to Railway as `STRIPE_WEBHOOK_SECRET`

## Step 4: Test Payment Flow

### Test with Stripe Test Cards

Use these test card numbers in Stripe checkout:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Card declined:**
- Card: `4000 0000 0000 0002`

### Testing Checklist

1. ✅ Sign in to Phonetix
2. ✅ Click "Start Learning" or "Go Professional" on /pricing
3. ✅ Complete Stripe checkout with test card
4. ✅ Verify redirect to /success page
5. ✅ Check Supabase subscriptions table has new row
6. ✅ Verify subscription status is "active"
7. ✅ Test webhook by checking Stripe Dashboard → Webhooks → Events

## Step 5: Go Live (When Ready)

### Switch to Production Mode

1. In Stripe Dashboard, toggle to "Live mode"
2. Get your live API keys
3. Update Railway environment variables with live keys:
   - `STRIPE_SECRET_KEY=sk_live_xxxxx`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx`
4. Create new live webhook endpoint
5. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

### Important: Before Going Live

- [ ] Complete Stripe business profile
- [ ] Add terms of service
- [ ] Add privacy policy
- [ ] Add refund policy
- [ ] Set up proper error handling
- [ ] Test cancellation flow
- [ ] Test refund flow
- [ ] Set up customer emails
- [ ] Configure billing portal

## Pricing Configuration

Current prices are hardcoded in `/app/api/checkout/route.ts`:

```typescript
const prices = {
  'Learner': { amount: 1999, name: 'Phonetix Learner' }, // $19.99
  'Professional': { amount: 4999, name: 'Phonetix Professional' } // $49.99
};
```

### Alternative: Use Stripe Products

Instead of dynamic prices, you can create Products in Stripe Dashboard and use price IDs:

1. Go to Stripe Dashboard → Products
2. Create "Phonetix Learner" product with $19.99/month price
3. Create "Phonetix Professional" product with $49.99/month price
4. Update code to use price IDs:

```typescript
const priceIds = {
  'Learner': 'price_xxxxxxxxxxxxx',
  'Professional': 'price_xxxxxxxxxxxxx'
};

const session = await stripe.checkout.sessions.create({
  line_items: [{ price: priceIds[tier], quantity: 1 }],
  // ...
});
```

## Subscription Features

### Access Control (To Be Implemented)

Currently, all logged-in users can access lessons. To add paywall:

1. Import subscription helper in lessons page:
```typescript
import { getUserTier } from '@/lib/subscription';
```

2. Check user tier:
```typescript
const [userTier, setUserTier] = useState<'Free' | 'Learner' | 'Professional'>('Free');

useEffect(() => {
  const checkSubscription = async () => {
    if (user) {
      const tier = await getUserTier(user.id);
      setUserTier(tier);
    }
  };
  checkSubscription();
}, [user]);
```

3. Show paywall for free users:
```typescript
if (userTier === 'Free') {
  return <PaywallComponent />;
}
```

### Subscription Status Display

Show user's current tier in Dashboard by fetching from subscriptions table.

## Troubleshooting

### Webhook not working

- Check webhook secret is correct
- Verify webhook URL is accessible
- Check Stripe Dashboard → Webhooks → Recent events for errors

### Payment not updating database

- Check Railway logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the anon key)
- Check Supabase table exists and RLS policies allow upserts

### Checkout session creation fails

- Verify `STRIPE_SECRET_KEY` is set
- Check Railway logs for specific error
- Ensure user is signed in

## Support

For issues:
1. Check Railway logs
2. Check Stripe Dashboard → Developers → Events
3. Check Supabase logs

## Next Steps

After Stripe is working:

1. Add customer portal for managing subscriptions
2. Add email receipts
3. Add usage tracking (optional)
4. Implement Native Fluency mode for Professional tier
5. Add subscription expiry warnings
6. Handle failed payments
