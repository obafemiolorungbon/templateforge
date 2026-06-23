# Examples

## Bad Receipt Pattern

Copy:

"We are excited to let you know your transaction has been completed successfully. Unlock the power of seamless payments with our platform."

Why it fails:

- Promotional tone for a transactional receipt.
- Vague value claims.
- No useful transaction detail.
- No clear scanning structure.

## Better Receipt Pattern

Copy:

"Your wallet top-up is complete. {{amount}} has been added to your balance. You can view the receipt from your dashboard."

MJML shape:

```xml
<mj-section padding="24px 32px">
  <mj-column>
    <mj-text font-size="13px" color="#71717A">Payment receipt</mj-text>
    <mj-text font-size="20px" font-weight="700" line-height="1.35">Your wallet top-up is complete</mj-text>
    <mj-text font-size="15px" line-height="1.6">Hi {{first_name}}, {{amount}} has been added to your balance.</mj-text>
  </mj-column>
</mj-section>
<mj-section padding="0 32px 20px">
  <mj-column background-color="#F8FAF3" border="1px solid #E5E7DD" border-radius="12px" padding="16px">
    <mj-text font-size="13px" line-height="1.7">Reference: {{reference}}</mj-text>
    <mj-text font-size="13px" line-height="1.7">Amount: {{amount}}</mj-text>
  </mj-column>
</mj-section>
<mj-section padding="0 32px 28px">
  <mj-column>
    <mj-button href="{{dashboard_url}}">View receipt</mj-button>
  </mj-column>
</mj-section>
```

## Better Password Reset Pattern

Copy:

"Use this link to reset your password. If you did not request this, you can ignore this email."

Why it works:

- Calm security tone.
- No marketing language.
- Clear action.
- Clear fallback for accidental requests.

