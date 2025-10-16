# How to Update Version Number

## Quick Reference

**Current Version:** v1.1
**Location:** `/app/page.tsx` line ~804

---

## When to Update

### MINOR version (1.1 → 1.2, 1.3, etc.)
- Bug fixes
- Small UI tweaks
- Performance improvements
- Content updates
- Minor features

### MAJOR version (1.9 → 2.0, 2.x → 3.0)
- New major features (user accounts, payments)
- Complete redesigns
- Breaking changes
- Major platform updates

---

## Step-by-Step Process

### 1. Make Your Changes
Work on your features/fixes as normal.

### 2. Update Version in Footer
**File:** `/app/page.tsx`
**Find:** `<p className="text-xs text-gray-700 mt-2">v1.1</p>`

**Example Updates:**
```tsx
// Minor update (bug fix)
<p className="text-xs text-gray-700 mt-2">v1.2</p>

// Major update (new feature)
<p className="text-xs text-gray-700 mt-2">v2.0</p>
```

### 3. Update VERSION.md
**File:** `/VERSION.md`

**Add new entry at top of Changelog:**
```markdown
### v1.2 - October 20, 2025
**Description of Update**

**Changes:**
- Fixed swipe gesture bug on Android
- Improved font scaling on tablets
- Optimized lazy loading delay

**Impact:**
- Bug fixes: 3
- Performance: +5%
```

**Update "Current Version" at top:**
```markdown
**Current Version:** v1.2
```

### 4. Commit and Push
```bash
git add app/page.tsx VERSION.md
git commit -m "v1.2: Description of changes"
git push origin phonetix-main
```

---

## Examples

### Example 1: Minor Bug Fix
```bash
# Edit page.tsx: v1.1 → v1.2
# Edit VERSION.md: Add v1.2 entry

git add app/page.tsx VERSION.md
git commit -m "v1.2: Fix swipe threshold on Samsung devices"
git push origin phonetix-main
```

### Example 2: Major Feature Release
```bash
# Edit page.tsx: v1.9 → v2.0
# Edit VERSION.md: Add v2.0 entry with detailed changelog

git add app/page.tsx VERSION.md
git commit -m "v2.0: Launch user authentication and progress tracking"
git push origin phonetix-main
```

### Example 3: Multiple Small Fixes
```bash
# Edit page.tsx: v1.2 → v1.3
# Edit VERSION.md: List all fixes

git add app/page.tsx VERSION.md
git commit -m "v1.3: Typography fixes, color adjustments, mobile padding"
git push origin phonetix-main
```

---

## Version Number Guidelines

### MAJOR.MINOR Format

**MAJOR** (1.x → 2.x):
- ✅ Added user accounts
- ✅ Launched payment system
- ✅ Complete UI redesign
- ✅ New core technology (switched from Azure to custom AI)
- ❌ Added a new button
- ❌ Fixed a bug

**MINOR** (1.1 → 1.2):
- ✅ Fixed swipe bug
- ✅ Improved performance
- ✅ Added testimonial carousel
- ✅ Updated colors
- ✅ Added version number (this update!)
- ❌ Launched user accounts (too big, should be MAJOR)

---

## Automation Tip

If you want to automate version updates, create a script:

**File:** `bump-version.sh`
```bash
#!/bin/bash
# Usage: ./bump-version.sh minor "Fixed bug X"
# or:    ./bump-version.sh major "Added feature Y"

TYPE=$1
MESSAGE=$2

if [ "$TYPE" = "minor" ]; then
  # Increment minor version
  # (requires jq or manual edit)
  echo "Bumping minor version..."
elif [ "$TYPE" = "major" ]; then
  echo "Bumping major version..."
fi

# Update files, commit, push
```

For now, manual updates are simple enough for this project.

---

## Checking Current Version

### On Website
1. Visit https://www.matuskalis.com
2. Scroll to footer
3. Look for small gray text: "v1.1"

### In Code
```bash
grep -n "text-xs text-gray-700" app/page.tsx
```

### From Git
```bash
git log --oneline | grep "^v"
```

---

## Version History Quick View

```bash
# See all version commits
git log --oneline --grep="^v[0-9]"

# See what changed in v1.1
git show 523a816
```

---

**Created:** October 16, 2025
**Current Setup:** v1.1 (Mobile optimization release)
**Next Expected:** v1.2 (Polish & refinements)
