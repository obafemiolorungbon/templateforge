# Email UI Rules

Generated MJML must feel designed, not merely wrapped text.

## Foundation

- Use a single-column layout by default.
- Use `mj-section`, `mj-column`, `mj-text`, `mj-button`, `mj-divider`, and simple `mj-spacer` where helpful.
- Keep styles email-client-safe and inline-friendly.
- Use restrained background panels, borders, and spacing to create hierarchy.
- Use readable type sizes: body copy around 14px to 16px, line-height around 1.5 to 1.7.
- Keep body width comfortable and mobile-friendly.

## Structure

Prefer this order when it fits:

1. Context or status line.
2. Clear headline or first sentence.
3. Short body explanation.
4. Detail panel or key-value summary when data matters.
5. Primary CTA button when there is an action.
6. Support or next-step note.

Do not include the product header or compliance footer if reusable components are provided.

## CTA Design

- Use `mj-button` for real primary actions.
- Give the button enough top and bottom spacing.
- Use clear button text matching the copy.
- Use `href="{{cta_url}}"` or the most appropriate URL variable.
- If no action exists, do not force a button.

## Visual Restraint

- Transactional emails should feel trustworthy, not promotional.
- Lifecycle emails may use warmer sections but should still be lean.
- Marketing emails may use richer layouts, but avoid landing-page bloat.
- Avoid decorative blobs, gradients, fake badges, excessive cards, and busy multi-column layouts.

## Detail Panels

Use a subtle panel or divider for important data:

- receipts
- invoices
- payment failures
- OTP/security details
- account alerts
- appointment or event details

The panel should make scanning easier, not decorate the email.

