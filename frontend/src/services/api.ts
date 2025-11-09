export type Mode = 'EUR' | 'USD';

export interface RateResponse {
  real_rate: number;
  fixed_rate: number | null;
  effective_rate: number;
  last_updated: string;
}

export interface ConversionItem {
  real_rate: number;
  input_amount: number;
  input_ccy: Mode;
  output_amount: number;
  output_ccy: Mode;
  fixed_rate_used: number | null;
  deactivated_fixed_due_to_2pct: boolean;
  at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchRate(): Promise<RateResponse> {
  const r = await fetch(`${API_BASE_URL}/rate`);
  if (!r.ok) throw new Error('Failed to fetch rate');
  return r.json();
}

export async function convert(amount: number, mode: Mode): Promise<ConversionItem> {
  const r = await fetch(`${API_BASE_URL}/convert?amount=${encodeURIComponent(amount)}&mode=${mode}`);
  if (!r.ok) throw new Error('Failed to convert');
  return r.json();
}

export async function fixRate(rate: number) {
  const r = await fetch(`${API_BASE_URL}/fix-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate }),
  });
  if (!r.ok) throw new Error('Failed to fix rate');
  return r.json();
}

export async function clearFixedRate() {
  const r = await fetch(`${API_BASE_URL}/fix-rate`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to clear fixed rate');
  return r.json();
}

export async function fetchHistory(): Promise<ConversionItem[]> {
  const r = await fetch(`${API_BASE_URL}/history`);
  if (!r.ok) throw new Error('Failed to fetch history');
  return r.json();
}
