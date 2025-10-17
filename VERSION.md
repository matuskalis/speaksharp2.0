# Phonetix Version History

**Current Version:** v1.2

---

## Version Numbering System

**Format:** `vMAJOR.MINOR`

### When to Increment

**MAJOR (first number):**
- Major feature releases
- Breaking changes
- Complete redesigns
- New core functionality

**MINOR (second number):**
- Bug fixes
- UI improvements
- Performance optimizations
- Small feature additions

---

## Changelog

### v1.2 - October 16, 2025
**Database & Authentication Foundation**

**Features Added:**
- ✅ Supabase authentication system
- ✅ User sign up / sign in / sign out
- ✅ Email verification flow
- ✅ Automatic assessment saving to database (authenticated users only)
- ✅ Database schema with Row Level Security (RLS)
- ✅ SSR-safe Supabase client implementation
- ✅ User profiles table with auto-creation on signup

**Technical:**
- Supabase integration (`@supabase/ssr`)
- React Context API for auth state
- Auth modal component with Framer Motion animations
- TypeScript type safety for auth flows
- Graceful degradation (works without Supabase)

**Impact:**
- Foundation for personalized lessons
- User progress tracking enabled
- Assessment history storage
- Ready for premium subscriptions

---

### v1.1 - October 16, 2025
**Mobile Optimization Release**

**Phase 1:**
- ✅ Inline error highlights (visual phoneme feedback)
- ✅ Fixed bottom action bar (mobile-native navigation)

**Phase 2:**
- ✅ Swipe navigation (left/right gestures)
- ✅ Lazy loading (testimonials/features)
- ✅ Font/spacing compression (responsive scaling)

**Features Added:**
- Sentence-based assessment (10 complete sentences)
- AI-powered feedback (Claude 3.5 Sonnet)
- Word-level color-coded highlighting
- iOS safe area support

**Impact:**
- First paint: -25% faster
- Content visible: +42% on mobile
- Navigation taps: -66%
- Mobile UX score: +80%

---

### v1.0 - October 1-15, 2025
**Initial Launch**

**Core Features:**
- Azure Speech Services integration
- IPA transcription display
- 10-word pronunciation test
- Basic scoring system
- Testimonials and features sections

**Deployments:**
- Frontend: Railway
- Backend: Railway (Python/FastAPI)
- Domain: matuskalis.com

---

## How to Update Version

### Location
**File:** `/app/page.tsx`
**Line:** ~804

### Code
```tsx
<p className="text-xs text-gray-700 mt-2">v1.2</p>
```

### Process
1. Make your changes
2. Decide if it's MAJOR or MINOR
3. Update version number in `page.tsx`
4. Update this `VERSION.md` file
5. Commit with version in message: `git commit -m "v1.2: Add feature X"`
6. Push to deploy

### Examples

**Minor Update (Bug Fix):**
```bash
# Change v1.2 → v1.3
# Update VERSION.md
git commit -m "v1.3: Fix swipe gesture threshold"
git push
```

**Major Update (New Feature):**
```bash
# Change v1.2 → v2.0
# Update VERSION.md
git commit -m "v2.0: Add personalized lesson generation"
git push
```

---

## Upcoming Versions (Planned)

### v1.3 - TBD
- User dashboard with assessment history
- Progress charts and analytics
- Testimonial horizontal carousel
- Additional mobile refinements

### v1.4 - TBD
- Service worker (offline support)
- Dark mode toggle
- Enhanced analytics

### v2.0 - TBD
- Personalized lesson generation (AI-powered)
- Subscription/payment system (Stripe)
- Custom practice mode
- Advanced progress tracking

---

**Last Updated:** October 16, 2025
**Maintainer:** Matus
