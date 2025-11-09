import React, { useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'EUR' | 'USD';

type RateResponse = {
  real_rate: number;
  fixed_rate?: number | null;
  effective_rate: number;
  last_updated: string;
};

type HistoryRow = {
  real_rate: number;
  fixed_rate_used?: number | null;
  input_amount: number;
  input_ccy: Mode;
  output_amount: number;
  output_ccy: Mode;
  deactivated_fixed_due_to_2pct?: boolean;
  at: string; // ISO string, sert aussi de clé stable
};

const API = import.meta.env.VITE_API_URL?.toString().trim();

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
const rndWalk = (prev: number) => clamp(prev + (Math.random() * 0.1 - 0.05), 0.9, 1.3);

export default function FxConverter() {
  const [mode, setMode] = useState<Mode>('EUR');
  const [amount, setAmount] = useState<string>('');
  const [realRate, setRealRate] = useState<number>(1.1);

  // --- FIXE: texte tapé (accepte "," et ".")
  const [fixedRateInput, setFixedRateInput] = useState<string>('');
  const [fixedActive, setFixedActive] = useState<boolean>(false);

  const [backendUp, setBackendUp] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  // Nombre dérivé du texte (1,12 ou 1.12) -> number | null
  const fixedRateNum = useMemo(() => {
    const s = fixedRateInput.trim();
    if (!s) return null;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [fixedRateInput]);

  const effectiveRate = useMemo(
    () => (fixedActive && fixedRateNum ? fixedRateNum : realRate),
    [fixedActive, fixedRateNum, realRate]
  );

  // Polling toutes les 3s: essaie l'API /rate sinon random walk local
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        if (API) {
          const r = await fetch(`${API}/rate`, { cache: 'no-store' });
          if (!r.ok) throw new Error('bad status');
          const data: RateResponse = await r.json();
          if (!cancelled) {
            setBackendUp(true);
            setRealRate(data.real_rate);
          }
        } else {
          throw new Error('no api');
        }
      } catch {
        if (!cancelled) {
          setBackendUp(false);
          setRealRate(prev => rndWalk(prev));
        }
      }
    };

    tick();
    const id = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Auto OFF du fixe si écart > 2% avec le taux réel
  useEffect(() => {
    if (fixedActive && fixedRateNum) {
      const diff = Math.abs(fixedRateNum - realRate) / realRate;
      if (diff > 0.02) setFixedActive(false);
    }
  }, [realRate, fixedActive, fixedRateNum]);

  // Conversion réactive (et continuité)
  const output = useMemo(() => {
    const a = Number(amount);
    if (!isFinite(a)) return '';
    return mode === 'EUR'
      ? (a * effectiveRate).toFixed(2)
      : (a / effectiveRate).toFixed(2);
  }, [amount, mode, effectiveRate]);

  // Historique (5 derniers)
  const lastSnapshot = useRef<string>('');
  useEffect(() => {
    const a = Number(amount);
    if (!amount || !isFinite(a)) return;

    const snapshot = `${mode}|${a}|${realRate}|${fixedActive ? fixedRateNum ?? '' : ''}|${output}`;
    if (snapshot === lastSnapshot.current) return;
    lastSnapshot.current = snapshot;

    const row: HistoryRow = {
      real_rate: Number(realRate.toFixed(6)),
      fixed_rate_used: fixedActive ? fixedRateNum ?? null : null,
      input_amount: a,
      input_ccy: mode,
      output_amount: Number(output),
      output_ccy: mode === 'EUR' ? 'USD' : 'EUR',
      deactivated_fixed_due_to_2pct: false,
      at: new Date().toISOString(),
    };
    setHistory(h => [row, ...h].slice(0, 5));
  }, [amount, mode, realRate, fixedActive, fixedRateNum, output]);

  // Bascule EUR↔USD en conservant la continuité (l’ancienne sortie devient la nouvelle entrée)
  const toggleMode = () => {
    const newInput = output || '';
    setMode(m => (m === 'EUR' ? 'USD' : 'EUR'));
    setAmount(newInput);
  };

  // Helpers UI
  const parseAmount = (v: string) =>
    v.replace(',', '.').replace(/[^\d.]/g, '');

  // Activer/désactiver le fixe (pré-remplit avec le taux réel si vide)
  const onToggleFixed = () => {
    if (!fixedActive && !fixedRateNum) setFixedRateInput(String(realRate));
    setFixedActive(x => !x);
  };

  return (
    <div>
      <header className="header">
        <h1>EUR ⇄ USD</h1>
        <div className="rate">
          Taux réel:&nbsp;<strong>{realRate.toFixed(4)}</strong>
          <span className={`pill ${backendUp ? 'ok' : 'warn'}`}>
            {backendUp ? 'API' : 'Local'}
          </span>
          {fixedActive && fixedRateNum && (
            <span className="pill fixed">Fixe: {fixedRateNum}</span>
          )}
        </div>
      </header>

      <section className="row">
        <input
          className="input"
          inputMode="decimal"
          placeholder={mode === 'EUR' ? 'Montant en EUR' : 'Montant en USD'}
          value={amount}
          onChange={e => setAmount(parseAmount(e.target.value))}
        />
        <button className="btn secondary" onClick={toggleMode}>
          Basculer en {mode === 'EUR' ? 'USD' : 'EUR'}
        </button>
        <div style={{alignSelf:'center', fontWeight:600}}>
          = {output} {mode === 'EUR' ? 'USD' : 'EUR'}
        </div>
      </section>

      <section className="row">
        <input
          type="text"
          className="input"
          inputMode="decimal"
          placeholder="Taux fixe (ex: 1,12 ou 1.12)"
          value={fixedRateInput}
          onChange={(e) =>
            setFixedRateInput(e.target.value.replace(/[^\d.,]/g, '')) // garde chiffres, , et .
          }
          onBlur={() => setFixedRateInput(v => v.replace(',', '.'))} // normalise au blur
        />
        <button className="btn" onClick={onToggleFixed}>
          {fixedActive ? 'Désactiver' : 'Activer'} le taux fixe
        </button>
        {fixedActive && fixedRateNum && Math.abs(fixedRateNum - realRate) / realRate > 0.02 && (
          <span style={{alignSelf:'center'}} className="warn-text">
            Écart &gt; 2%: le fixe sera coupé automatiquement
          </span>
        )}
      </section>

      <section>
        <h2>Historique (5)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quand</th>
                <th style={{textAlign:'right'}}>Entrée</th>
                <th>Taux réel</th>
                <th>Taux fixe</th>
                <th style={{textAlign:'right'}}>Sortie</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center', opacity:.7}}>—</td></tr>
              )}
              {history.map(h => (
                <tr key={h.at}>
                  <td>{new Date(h.at).toLocaleTimeString()}</td>
                  <td style={{textAlign:'right'}}>{h.input_amount} {h.input_ccy}</td>
                  <td>{h.real_rate.toFixed(4)}</td>
                  <td>{h.fixed_rate_used ?? '—'}</td>
                  <td style={{textAlign:'right'}}>{h.output_amount} {h.output_ccy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
