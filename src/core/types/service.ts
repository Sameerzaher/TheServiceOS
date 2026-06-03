/** Bookable service offering (generic: any industry). */
export interface Service {
  name: string;
  /** Length of the service in minutes. */
  duration: number;
  /** Price in the business’s configured currency (major units unless you standardize otherwise). */
  price: number;
}
