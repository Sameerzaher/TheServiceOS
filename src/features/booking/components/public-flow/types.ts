/** Mirrors bootstrap `services[]` payload (safe for client-only imports). */
export type PublicCatalogService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

export type BookingFlowStep = 1 | 2 | 3 | 4 | 5;
