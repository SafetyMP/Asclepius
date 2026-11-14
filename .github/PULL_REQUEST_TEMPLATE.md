## Problem and result

<!-- Describe who was affected, the concrete friction, and the resulting behavior.
Link an issue when relevant. Include synthetic before/after images for visual changes. -->

## Verification

<!-- List commands actually run and observed results; state omitted checks and why.
For web changes, include journey switching, referral ownership/status, keyboard
navigation, responsive layout, and Pages subpath checks as applicable. -->

## Checklist

- [ ] The change supports the stakeholder journeys or the local teaching core.
- [ ] `npm run gate` passed; web changes also passed the documented web checks.
- [ ] Changed behavior has meaningful regression coverage, where applicable.
- [ ] Synthetic-only data, `NOT_FOR_CLINICAL_USE`, and DDI limitations are preserved.
- [ ] Validation and handoff claims stay within the documented teaching subset.
- [ ] Architecture, strict types, accessibility, and existing user context are preserved.
- [ ] Documentation and agent guidance reflect changed behavior; an ADR records any architectural decision change.
- [ ] No secrets, real patient data, databases, dependencies, or generated builds are staged.

<!-- These checks support review; they do not establish clinical validation or
measured usability. If a checkbox does not apply, explain it above. -->

## Security

For an undisclosed vulnerability, follow
[SECURITY.md](https://github.com/SafetyMP/Asclepius/blob/main/SECURITY.md) before
opening a public pull request.
