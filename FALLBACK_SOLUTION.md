# Retired image-generation fallback

The historical image-generation and random-image reuse workflow is retired.
Its script no longer exists and must not be restored.

Never assign one provider's photograph or stock image to another provider as a
fallback. That creates an unsupported identity claim.

The current static-first contract is documented in
[IMAGE_GENERATION.md](IMAGE_GENERATION.md):

- `public_site/` is the served source of truth;
- reviewed provider artwork is an owned image or an explicitly labeled,
  checked-in non-likeness asset;
- empty, placeholder, invalid, and failed image URLs render the deterministic
  initials fallback;
- validation and deployment do not call an image-generation service.
