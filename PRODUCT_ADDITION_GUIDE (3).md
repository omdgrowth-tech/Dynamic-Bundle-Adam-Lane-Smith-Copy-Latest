# Guide: Adding a New Product to the System

## Overview

This guide walks you through the complete process of adding a new product to the Adam Lane Smith Bundle Builder system. The system includes a frontend bundle builder and two payment flows (Stripe and PayPal), each with secure validation layers.

### Important Note About the Products Table

**The `products` database table is OPTIONAL.** The system works as follows:
- **Frontend:** Displays products from hardcoded data in `src/data/products.ts` 
- **Backend Validation:** Uses hardcoded `PRODUCT_CATALOG` arrays in edge functions
- **Database:** Only used for storing `product_id` foreign key references in `order_items`

**You only need to update 3 locations:** Frontend file + 2 backend functions. The database table is optional and only maintained for foreign key relationships, not for display or validation.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Testing Your Changes](#testing-your-changes)
5. [Troubleshooting](#troubleshooting)

---

## System Architecture Overview

The product system has several interconnected components:

### Frontend
- **`src/data/products.ts`** - Main product catalog with all product definitions
- **`src/types/bundle.ts`** - TypeScript type definitions for products
- **`src/components/BundleBuilderRefactored.tsx`** - Main bundle builder UI
- **`src/components/bundle/ProductCard.tsx`** - Individual product card component
- **`src/assets/images/`** - Product images and thumbnails

### Backend (Supabase Edge Functions)
- **`supabase/functions/create-paypal-order-secure/`** - PayPal payment creation with validation
- **`supabase/functions/create-order-payment-secure/`** - Stripe payment creation with validation
- **`supabase/functions/create-paypal-order/`** - ⚠️ DEPRECATED (non-secure version)
- **`supabase/functions/create-order-payment/`** - ⚠️ DEPRECATED (non-secure version)

### Database
- **`products`** table - Optional: Only used for product_id foreign key relationships in order_items (NOT used by frontend or validation)
- **`orders`** table - Stores order information
- **`order_items`** table - Stores individual line items in orders

### Key Security Features
The "secure" versions of the payment functions include:
- Hardcoded product catalogs that validate against client-submitted data
- Discount validation logic to prevent price manipulation
- Tier validation to ensure proper bundle discounts
- Gift eligibility validation

---

## Prerequisites

Before adding a new product, ensure you have:

1. **Development environment set up:**
   - Node.js and npm/bun installed
   - Supabase CLI installed
   - Local development server running

2. **Product details:**
   - SKU (unique identifier, e.g., `COURSE_NEW_PRODUCT`)
   - Title
   - Description/Summary
   - Price (MSRP in dollars)
   - Product type (`course`, `group_coaching`, `assessment`, `addon`, or `consultation`)
   - Product link (URL to product page, or `#` if none)
   - Sort order (determines display order)

3. **Images:**
   - Main product image (preferably `.webp` format for performance)
   - Mini/thumbnail image for cart display (typically `.png`)
   - Recommended sizes: Main (varies), Mini (small square thumbnail)

---

## Step-by-Step Guide

### Step 1: Add Product Images

1. **Add main product image:**
   ```bash
   # Place your main image in:
   src/assets/images/your-product-name.webp
   ```

2. **Add mini/thumbnail image:**
   ```bash
   # Place your thumbnail in:
   src/assets/images/mini/your-product-name-mini.png
   ```

**Example:**
```
src/assets/images/my-new-course.webp
src/assets/images/mini/my-new-course-mini.png
```

### Step 2: Update Frontend Product Catalog

**File:** `src/data/products.ts`

#### 2.1: Import the images at the top of the file

```typescript
// Add to Product Images section (around line 10)
import myNewCourseImg from "@/assets/images/my-new-course.webp";

// Add to Mini Images section (around line 25)
import myNewCourseMini from "@/assets/images/mini/my-new-course-mini.png";
```

#### 2.2: Add to MINI_IMAGE_MAP

```typescript
// Add to MINI_IMAGE_MAP object (around line 32)
export const MINI_IMAGE_MAP: Record<string, string> = {
  // ... existing entries ...
  "MY_NEW_COURSE": myNewCourseMini,  // Add this line
};
```

#### 2.3: Add product definition to sampleProducts array

```typescript
// Add to sampleProducts array (around line 47)
export const sampleProducts: readonly Product[] = [
  // ... existing products ...
  
  {
    sku: "MY_NEW_COURSE",
    title: "My New Amazing Course",
    link: "https://adamlanesmith.com/product/my-new-course/",
    type: "course", // or "addon", "assessment", "group_coaching", "consultation"
    summary: "A comprehensive course that teaches...",
    msrp: 597, // Price in dollars
    imageUrl: myNewCourseImg,
    countsTowardThreshold: true, // true for courses/assessments, false for addons
    giftEligible: false, // true only for addons
    sortOrder: 25 // Determines display order (lower = shown first)
  },
];
```

**Important Notes:**
- **SKU:** Must be unique and in UPPERCASE_WITH_UNDERSCORES format
- **Type:** Choose from: `course`, `group_coaching`, `assessment`, `addon`, `consultation`
- **countsTowardThreshold:** Set to `true` for main products (courses, assessments, coaching), `false` for addons
- **giftEligible:** Only set to `true` for addons that can be selected as free gifts
- **sortOrder:** Lower numbers appear first in the catalog

### Step 3: Update PayPal Secure Function

**File:** `supabase/functions/create-paypal-order-secure/index.ts`

#### 3.1: Add product to PRODUCT_CATALOG

Find the `PRODUCT_CATALOG` array (around line 25) and add your product:

```typescript
const PRODUCT_CATALOG: readonly Product[] = [
  // ... existing products ...
  
  {
    sku: "MY_NEW_COURSE",
    title: "My New Amazing Course",
    type: "course",
    msrp: 597,
    countsTowardThreshold: true,
    giftEligible: false,
  },
];
```

**⚠️ Critical:** The values here MUST match exactly with what you defined in `src/data/products.ts`:
- Same SKU
- Same title
- Same type
- Same msrp (in dollars)
- Same countsTowardThreshold
- Same giftEligible

**Why?** This hardcoded catalog is used for server-side validation to prevent price manipulation attacks.

### Step 4: Update Stripe Secure Function

**File:** `supabase/functions/create-order-payment-secure/index.ts`

#### 4.1: Add product to PRODUCT_CATALOG

Find the `PRODUCT_CATALOG` array (around line 28) and add your product with the EXACT same values:

```typescript
const PRODUCT_CATALOG: readonly Product[] = [
  // ... existing products ...
  
  {
    sku: "MY_NEW_COURSE",
    title: "My New Amazing Course",
    type: "course",
    msrp: 597,
    countsTowardThreshold: true,
    giftEligible: false,
  },
];
```

### Step 5: Add Product to Database (OPTIONAL)

**⚠️ Important Note:** The `products` table is **optional** and only used for database foreign key relationships. The frontend displays products from `src/data/products.ts` and the backend validates using hardcoded `PRODUCT_CATALOG` arrays. You can skip this step if you don't need product_id references in order_items.

If you want to maintain the products table for database consistency:

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Table Editor > `products` table
3. Click "Insert row"
4. Fill in the following fields:
   ```
   sku: MY_NEW_COURSE
   title: My New Amazing Course
   description: A comprehensive course that teaches...
   price_cents: 59700 (price in cents: $597.00 = 59700)
   type: course
   active: true
   sort_order: 25
   ```
5. Click "Save"

#### Option B: Using SQL Migration

Create a new migration file:

```bash
cd supabase
supabase migration new add_my_new_course_product
```

Add the SQL insert statement:

```sql
-- Add new product (optional - for database relationships only)
INSERT INTO public.products (sku, title, description, price_cents, type, active, sort_order)
VALUES (
  'MY_NEW_COURSE',
  'My New Amazing Course',
  'A comprehensive course that teaches...',
  59700, -- Price in cents ($597.00)
  'course',
  true,
  25
);
```

Apply the migration:

```bash
supabase db push
```

---

## Product Types and Their Characteristics

### Course (`type: "course"`)
- Main educational content
- Counts toward bundle tiers
- Not gift-eligible
- Examples: "How to Love an Avoidant Man", "The Attachment Bootcamp"

### Group Coaching (`type: "group_coaching"`)
- High-value coaching programs
- Counts toward bundle tiers
- Not gift-eligible
- Example: "Group Coaching - 6 Month Membership"

### Assessment (`type: "assessment"`)
- Personal or couples assessments
- Counts toward bundle tiers
- Not gift-eligible
- Examples: "Attachment Assessment - Singles", "Attachment Assessment - Couples"

### Addon (`type: "addon"`)
- Supplementary materials
- Does NOT count toward bundle tiers
- CAN be gift-eligible
- Examples: "30 Conversation Cards", "Four Attachment Style Guides"

### Consultation (`type: "consultation"`)
- One-on-one sessions
- Counts toward bundle tiers
- Not gift-eligible
- Example: "50-min Private Consultation"

---

## Bundle Tier System

The system has three tiers based on the number of qualifying products (courses, assessments, coaching, consultations):

| Tier | Min Products | Discount | Scope | Free Gifts |
|------|-------------|----------|-------|------------|
| 1    | 1           | 0%       | Entire cart | 0 |
| 2    | 2           | 10%      | Entire cart | 0 |
| 3    | 3+          | 20%      | Entire cart | 1 |

**Note:** 
- Addons do NOT count toward tier thresholds
- One-Time Offer (OTO) items are excluded from tier calculations
- Discounts apply to the entire cart when tier is reached

---

## Special Cases

### One-Time Offer (OTO) Products

The `breakthrough-call` product has special handling:
- Shows in OTO modal, not main catalog
- Has custom OTO pricing (50% off: $403 discount for $397 final price)
- Counts toward bundle tiers when added via OTO
- Excluded from tier calculation when determining bundle discounts

If adding a new OTO product:
1. Add to product catalog with `sortOrder` that hides it
2. Update `BundleBuilderRefactored.tsx` to handle OTO logic
3. Update validation functions in secure payment functions
4. Add custom OTO discount logic if different from 50%

### Gift-Eligible Products

Only addons should be gift-eligible:
```typescript
{
  type: "addon",
  giftEligible: true, // Only set true for addons
  countsTowardThreshold: false, // Always false for addons
}
```

---

## Testing Your Changes

### 1. Frontend Testing

```bash
# Start development server
npm run dev
# or
bun run dev
```

**Test checklist:**
- [ ] Product appears in the catalog
- [ ] Product image loads correctly
- [ ] Product title and description are correct
- [ ] Price displays correctly
- [ ] "Add to Bundle" button works
- [ ] Product appears in cart with correct mini image
- [ ] Cart totals calculate correctly
- [ ] Bundle tier discounts apply correctly
- [ ] If addon: "Gift-eligible" badge shows
- [ ] If addon: "Add as gift" button works

### 2. Backend Testing (PayPal)

```bash
# Test PayPal secure function locally
supabase functions serve create-paypal-order-secure --env-file supabase/.env.local
```

Test cart validation by creating a test order:
```javascript
// Example test payload
{
  "cartLines": [
    {
      "sku": "MY_NEW_COURSE",
      "title": "My New Amazing Course",
      "msrp": 597,
      "discount": 0,
      "net": 597,
      "type": "course",
      "isGift": false
    }
  ],
  "customer": {
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  },
  "totals": {
    "subtotal": 597,
    "discount": 0,
    "total": 597
  }
}
```

**Expected results:**
- [ ] Order creates successfully
- [ ] No validation errors
- [ ] PayPal order ID returned
- [ ] Order appears in database with correct amounts

### 3. Backend Testing (Stripe)

```bash
# Test Stripe secure function locally
supabase functions serve create-order-payment-secure --env-file supabase/.env.local
```

Use the same test payload as PayPal test.

**Expected results:**
- [ ] Payment intent creates successfully
- [ ] No validation errors
- [ ] Stripe client secret returned
- [ ] Order appears in database with correct amounts

### 4. Database Verification (Optional)

If you added the product to the database, check that it was added correctly:

```sql
-- Query the products table
SELECT * FROM products WHERE sku = 'MY_NEW_COURSE';
```

Expected result:
```
id: [uuid]
sku: MY_NEW_COURSE
title: My New Amazing Course
price_cents: 59700
type: course
active: true
```

**Note:** This is optional since the database is not used by the frontend or validation logic.

---

## Common Mistakes to Avoid

### ❌ Mistake #1: Inconsistent Data Across Files
```typescript
// WRONG: Different prices in different files
// products.ts
msrp: 597

// create-paypal-order-secure/index.ts
msrp: 597

// create-order-payment-secure/index.ts
msrp: 500  // ❌ WRONG! Doesn't match
```

✅ **Solution:** Always use the EXACT same values across all three code locations:
1. `src/data/products.ts`
2. `supabase/functions/create-paypal-order-secure/index.ts`
3. `supabase/functions/create-order-payment-secure/index.ts`

(Database `products` table is optional)

### ❌ Mistake #2: Wrong SKU Format
```typescript
// WRONG
sku: "my-new-course"
sku: "myNewCourse"

// CORRECT
sku: "MY_NEW_COURSE"
```

### ❌ Mistake #3: Wrong Type Configuration
```typescript
// WRONG: Addon that counts toward threshold
{
  type: "addon",
  countsTowardThreshold: true,  // ❌ Addons should be false
  giftEligible: true
}

// CORRECT
{
  type: "addon",
  countsTowardThreshold: false,
  giftEligible: true
}
```

### ❌ Mistake #4: Forgetting Mini Image
```typescript
// products.ts has the product, but forgot to add to MINI_IMAGE_MAP
export const MINI_IMAGE_MAP: Record<string, string> = {
  // ... missing "MY_NEW_COURSE": myNewCourseMini
};
```

Result: Cart will not display the thumbnail image correctly.

### ❌ Mistake #5: Wrong Price Format in Database (If Using Database)
```typescript
// WRONG: Price in dollars in database
price_cents: 597  // ❌ This is $5.97, not $597

// CORRECT: Price in cents
price_cents: 59700  // ✅ This is $597.00
```

**Note:** This only applies if you're maintaining the products table (which is optional).

---

## Validation Logic in Secure Functions

Understanding how validation works helps you troubleshoot issues:

### Price Validation Flow

1. **Client submits order** with cart lines including:
   - SKU
   - Title
   - MSRP (client-calculated)
   - Discount (client-calculated)
   - Net price (client-calculated)

2. **Server validates** against hardcoded catalog:
   - ✓ SKU exists in `PRODUCT_CATALOG`
   - ✓ MSRP matches catalog
   - ✓ Discount calculation is correct based on tier
   - ✓ Net price = MSRP - Discount
   - ✓ Gift eligibility is correct
   - ✓ Gift count is within allowed limit

3. **If validation passes:** Order proceeds to payment provider
4. **If validation fails:** Returns error and order is rejected

### Example Validation Code (from create-paypal-order-secure)

```typescript
// Step 1: Validate SKU exists
const product = PRODUCT_CATALOG.find(p => p.sku === line.sku);
if (!product) {
  return { valid: false, error: "Invalid product in cart" };
}

// Step 2: Validate MSRP matches (unless it's a gift)
if (!line.isGift && Math.abs(product.msrp - line.msrp) > 0.01) {
  return { valid: false, error: "Invalid pricing detected" };
}

// Step 3: Calculate expected discount based on tier
const tier = getTier(courseCount);
const percentOff = tier?.percentOff ?? 0;
const eligible = scope === "entire_cart" ? true : isCourse(product.type);
const expectedDiscount = eligible ? (percentOff / 100) * product.msrp : 0;

// Step 4: Validate discount matches expected
if (Math.abs(expectedDiscount - line.discount) > 0.02) {
  return { valid: false, error: "Invalid discount calculation" };
}
```

---

## Troubleshooting

### Issue: Product doesn't appear in frontend catalog

**Possible causes:**
1. Image import path is wrong
2. SKU is duplicated
3. `sortOrder` is very high
4. TypeScript build error (check console)

**Solutions:**
1. Verify image files exist at the paths you imported
2. Search for duplicate SKUs: `grep -r "MY_NEW_COURSE" src/`
3. Check browser console for errors
4. Run `npm run build` to check for TypeScript errors

### Issue: "Invalid pricing detected" error during checkout

**Possible causes:**
1. MSRP in frontend doesn't match backend catalog
2. SKU mismatch (case-sensitive)

**Solutions:**
1. Compare `msrp` values across all 3 code locations:
   - `src/data/products.ts`
   - `create-paypal-order-secure/index.ts`
   - `create-order-payment-secure/index.ts`
2. Verify SKU is EXACTLY the same (case-sensitive)

### Issue: Cart thumbnail doesn't show

**Possible causes:**
1. Forgot to add to `MINI_IMAGE_MAP`
2. Mini image file doesn't exist
3. SKU in `MINI_IMAGE_MAP` doesn't match product SKU

**Solutions:**
1. Add entry to `MINI_IMAGE_MAP` in `products.ts`
2. Verify file exists: `ls src/assets/images/mini/`
3. Double-check SKU spelling matches exactly

### Issue: "Too many free gifts" error

**Possible causes:**
1. Product is marked as `giftEligible: true` but shouldn't be
2. User trying to add more gifts than allowed by tier
3. Product type is not `addon` but is marked gift-eligible

**Solutions:**
1. Check `giftEligible` value in both frontend and backend catalogs
2. Only addons should be gift-eligible
3. Review tier configuration - Tier 3 allows 1 gift

### Issue: Product doesn't count toward bundle tier

**Possible causes:**
1. `countsTowardThreshold: false` when it should be `true`
2. Product type is `addon` (addons never count)
3. Product marked as OTO (`isOTO: true`)

**Solutions:**
1. Set `countsTowardThreshold: true` for courses, assessments, coaching, consultations
2. Addons should always have `countsTowardThreshold: false`
3. Check if product is being added via OTO modal

### Issue: Edge function validation fails locally but not in production

**Possible causes:**
1. Environment variables not set correctly
2. Supabase CLI version mismatch
3. Local function code out of sync with deployed version

**Solutions:**
1. Check `.env.local` file has all required variables
2. Update Supabase CLI: `npm install -g supabase`
3. Pull latest functions: `supabase functions download`

---

## Deployment Checklist

Before deploying your new product to production:

### Pre-deployment
- [ ] All images added to `src/assets/images/`
- [ ] Frontend catalog updated (`src/data/products.ts`)
- [ ] MINI_IMAGE_MAP updated
- [ ] PayPal secure function updated
- [ ] Stripe secure function updated
- [ ] Database product record created (optional)
- [ ] All values match across all 3 code locations
- [ ] Local testing completed successfully
- [ ] No TypeScript errors
- [ ] No linter warnings

### Testing
- [ ] Product displays correctly in development
- [ ] Add to cart works
- [ ] Cart calculations are correct
- [ ] Checkout flow works with PayPal (sandbox)
- [ ] Checkout flow works with Stripe (test mode)
- [ ] Bundle tier discounts apply correctly
- [ ] If addon: gift functionality works

### Deployment
- [ ] Build frontend: `npm run build`
- [ ] Deploy frontend: `vercel deploy` (or your deployment method)
- [ ] Deploy edge functions:
  ```bash
  supabase functions deploy create-paypal-order-secure
  supabase functions deploy create-order-payment-secure
  ```
- [ ] Run database migration: `supabase db push`
- [ ] Verify product appears in production
- [ ] Test end-to-end purchase in production (with test payment)

### Post-deployment
- [ ] Monitor logs for errors
- [ ] Check analytics for product views
- [ ] Verify orders are processing correctly
- [ ] Test on mobile devices
- [ ] Test on different browsers

---

## Quick Reference

### File Locations
```
Frontend:
- src/data/products.ts                    # Product catalog
- src/types/bundle.ts                     # Type definitions
- src/assets/images/                      # Product images
- src/assets/images/mini/                 # Cart thumbnails
- src/components/BundleBuilderRefactored.tsx

Backend:
- supabase/functions/create-paypal-order-secure/index.ts
- supabase/functions/create-order-payment-secure/index.ts

Database:
- products table
- orders table
- order_items table
```

### Product Type Matrix

| Type | Counts to Tier | Gift Eligible | Examples |
|------|----------------|---------------|----------|
| course | ✅ Yes | ❌ No | Courses, programs |
| group_coaching | ✅ Yes | ❌ No | Coaching memberships |
| assessment | ✅ Yes | ❌ No | Singles/couples assessments |
| consultation | ✅ Yes | ❌ No | Private calls |
| addon | ❌ No | ✅ Yes | Guides, cards, mini courses |

### Price Conversion

| Dollars | Cents (for DB) |
|---------|----------------|
| $49     | 4900           |
| $196    | 19600          |
| $497    | 49700          |
| $597    | 59700          |
| $847    | 84700          |
| $1427   | 142700         |
| $1995   | 199500         |
| $3990   | 399000         |

---

## Need Help?

If you run into issues not covered in this guide:

1. **Check the console:** Browser console often shows helpful error messages
2. **Check the logs:** Supabase function logs show validation failures
3. **Compare with existing products:** Look at how similar products are implemented
4. **Search the codebase:** Use `grep` to find where values are defined
5. **Ask for help:** Reach out to the senior developers with specific error messages

---

## Advanced Topics

### Custom OTO Pricing

If you need to add a product with custom One-Time Offer pricing (not standard 50% off):

1. Add product to all catalogs as normal
2. Update OTO validation in `create-paypal-order-secure/index.ts`:
   ```typescript
   // Around line 240
   if (isOTO) {
     if (product.sku === "breakthrough-call") {
       otoDiscount = 403;
     } else if (product.sku === "YOUR_CUSTOM_SKU") {
       otoDiscount = YOUR_CUSTOM_DISCOUNT_AMOUNT; // Add this
     } else {
       otoDiscount = round2(0.5 * product.msrp);
     }
   }
   ```
3. Make the same change in `create-order-payment-secure/index.ts`

### Modifying Tier Configuration

To change tier thresholds or discounts:

1. Update `src/types/bundle.ts` CONFIG.tiers
2. Update TIERS in `create-paypal-order-secure/index.ts`
3. Update TIERS in `create-order-payment-secure/index.ts`

**Example: Adding Tier 4**
```typescript
{
  id: 4,
  minCourses: 4,
  percentOff: 25,
  scope: "entire_cart",
  giftCount: 2
}
```

### Seasonal Products

To add a product that should only be available during certain times:

1. Add `activeFrom` and `activeUntil` dates to product definition
2. Filter in `BundleBuilderRefactored.tsx`:
   ```typescript
   const isActive = (product: Product) => {
     const now = Date.now();
     if (product.activeFrom && now < product.activeFrom) return false;
     if (product.activeUntil && now > product.activeUntil) return false;
     return true;
   };
   ```

---

**Last Updated:** October 2025
**Version:** 1.0.0

**Document Maintainer:** Development Team

