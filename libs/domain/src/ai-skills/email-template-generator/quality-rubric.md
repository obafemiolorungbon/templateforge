# Quality Rubric

Silently judge the generated template before returning it.

## Copy Quality

- Clarity: the reader knows why they received the email within two lines.
- Specificity: the copy reflects the use case, product, audience, and variables.
- CTA strength: the next action is direct and low-friction.
- Emotional fit: the tone matches the reader's situation.
- Reusability: variables are clean and the template can be reused safely.

## UI Quality

- Hierarchy: the MJML has clear sections and scan paths.
- Spacing: padding is intentional and not cramped.
- Typography: sizes and line-height are readable.
- CTA treatment: action emails use a visible button with appropriate spacing.
- Data design: details are grouped in panels or dividers when useful.
- Restraint: transactional emails do not look like marketing pages.

## Failure Conditions

Rewrite internally before returning if:

- the email could apply to any product
- the MJML is one flat text block
- the CTA is vague
- the plain text does not match the MJML
- variables are referenced without contracts or samples
- the body recreates provided reusable header/footer content

