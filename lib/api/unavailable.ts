/**
 * Marker for API calls that this backend does not implement yet.
 *
 * The frontend was written against a Laravel API with a much wider surface
 * than the FastAPI service it now talks to. Where an endpoint has no
 * counterpart, the call site keeps its signature and throws this instead of
 * quietly requesting a URL that 404s.
 *
 * Why throw rather than return empty data: an empty list renders as "you have
 * no invoices", which is a false statement about the user's account. A thrown
 * error surfaces through the existing react-query error states and says the
 * feature is not available, which is true.
 *
 * Every one of these is listed in docs/API-GAPS.md with the backend work it
 * needs. Delete the call as soon as the endpoint exists.
 */
export class FeatureUnavailableError extends Error {
  readonly feature: string;

  constructor(feature: string) {
    super(
      `"${feature}" is not available yet: the API has no endpoint for it. ` +
        `See docs/API-GAPS.md.`
    );
    this.name = "FeatureUnavailableError";
    this.feature = feature;
  }
}

/** Throws — see the class docs. `feature` is what the user sees named. */
export function unavailable(feature: string): never {
  throw new FeatureUnavailableError(feature);
}
