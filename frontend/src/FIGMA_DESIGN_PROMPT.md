# Figma Make Design Prompt for PACKSMART

## Design Request

Create a modern B2B SaaS quotation form section with editable company details fields for a professional packaging intelligence application.

---

## Design Specifications

### Layout
- **Two-column grid layout** for desktop (stacks to single column on mobile)
- Clean, spacious design with professional aesthetics
- Soft blue and teal gradient accents throughout

---

### Left Column: User Company Details Section

**Title Area:**
- Main heading: "PACKSMART" (large, bold, green color #16a34a)
- Subtitle: "Vision-Calibrated Packaging Intelligence" (small, gray text)
- Section label: "Your Company Details:" (medium weight, gray)

**Input Fields (4 fields, stacked vertically):**

1. **Company Name Input**
   - Placeholder text: "Company Name"
   - Style: White background, light gray border, rounded corners (8px)
   - Height: 40px
   - Focus state: Blue border highlight

2. **Company Address Textarea**
   - Placeholder text: "Company Address"  
   - Style: White background, light gray border, rounded corners (8px)
   - Height: 64px (2 rows)
   - Focus state: Blue border highlight

3. **Phone Number Input**
   - Placeholder text: "Phone Number"
   - Style: White background, light gray border, rounded corners (8px)
   - Height: 40px
   - Focus state: Blue border highlight

4. **Email Address Input**
   - Placeholder text: "Email Address"
   - Style: White background, light gray border, rounded corners (8px)
   - Height: 40px
   - Focus state: Blue border highlight

**Spacing:**
- 12px gap between input fields
- 24px margin below title area before input fields

---

### Right Column: Quote Details Section

**"[Price Quote]" Heading:**
- Text: "[Price Quote]" 
- Style: Large, bold, pink/rose color (#f9a8d4)
- Aligned to the right
- 16px margin bottom

**Amber Details Box:**
- Background: Soft amber (#fef3c7)
- Border radius: 8px
- Padding: 16px
- Contains 3 rows:
  - **DATE:** [Dynamic date display]
  - **Quotation #:** [Auto-generated ID]
  - **Customer ID:** [Auto-generated]
- Text style: Semi-bold labels (gray), regular values (black)
- 8px gap between rows

**Orange Info Box (below amber box):**
- Background: Soft orange (#fed7aa)
- Border radius: 8px  
- Padding: 12px
- Contains 2 rows:
  - **Quotation valid until:** [Date + 10 days]
  - **Prepared by:** PACKSMART AI System
- Text style: Italic labels (gray), regular values (black)
- 8px margin top from previous box

---

## Color Palette

### Primary Colors
- **Green (Brand):** #16a34a
- **Blue (Accent):** #2563eb
- **Teal (Accent):** #0d9488

### Background Colors
- **Amber Box:** #fef3c7
- **Orange Box:** #fed7aa
- **White:** #ffffff
- **Light Gray:** #f9fafb

### Text Colors
- **Primary Text:** #111827
- **Secondary Text:** #6b7280
- **Pink Heading:** #f9a8d4

### Border Colors
- **Default:** #d1d5db
- **Focus:** #2563eb

---

## Typography

### Font Family
- System fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Font Sizes
- **Main heading (PACKSMART):** 30px, bold
- **Subtitle:** 14px, regular
- **Section label:** 14px, semi-bold
- **[Price Quote] heading:** 30px, bold
- **Input placeholders:** 14px, regular
- **Box labels:** 14px, semi-bold
- **Box values:** 14px, regular

---

## Spacing & Measurements

### Card/Container
- Max width: 1200px
- Padding: 32px (desktop), 16px (mobile)
- Border: 2px solid #e5e7eb
- Border radius: 0 (top), 0 (bottom) - rectangular with sharp corners for top/bottom
- Background: White

### Grid Gap
- Desktop: 32px between columns
- Mobile: 24px (stacked)

### Input Fields
- Height: 40px (single line), 64px (textarea)
- Padding: 12px 16px
- Border: 1px solid #d1d5db
- Border radius: 8px

---

## Responsive Behavior

### Desktop (>768px)
- Two-column grid
- Full width inputs
- Horizontal spacing between columns

### Mobile (<768px)
- Single column stack
- Left column (company details) first
- Right column (quote details) second
- Full width elements
- Maintained padding and spacing ratios

---

## Interactive States

### Input Fields
- **Default:** Light gray border, white background
- **Hover:** Slightly darker border
- **Focus:** Blue border (#2563eb), blue outline glow
- **Filled:** Dark text on white

### Visual Hierarchy
1. Main heading (PACKSMART) - most prominent
2. [Price Quote] heading - secondary prominence  
3. Input fields and detail boxes - tertiary
4. Placeholder text - lowest prominence

---

## Design Notes

- Maintain clean, professional B2B aesthetic
- Use soft shadows sparingly (optional: box-shadow: 0 1px 3px rgba(0,0,0,0.1))
- Ensure high contrast for accessibility (WCAG AA minimum)
- Keep consistent spacing rhythm (multiples of 4px)
- Round all corners to 8px except main card
- Focus on presentation-ready quality for investor demos

---

## File Format Request

Please deliver as:
- Figma component (responsive)
- Export as React/TSX code compatible with Tailwind CSS
- Include all interactive states
- Maintain semantic HTML structure

---

## Usage Context

This form section will be embedded in Step 6 of a 6-step packaging intelligence workflow. It appears at the top of a professional quotation document where users can input their company details before downloading or printing the quote.

The design should feel cohesive with:
- Clean SaaS interfaces (like Stripe, Notion, Linear)
- Professional invoicing tools (like QuickBooks, FreshBooks)
- Modern B2B platforms with soft gradients and spacious layouts
