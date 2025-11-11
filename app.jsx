/*
README: "Interrogazioni" app (React)

Cosa c'è qui
- Single-file React component (default export) pronto per Netlify (build con Vite / Create React App / Netlify).
- Usa Supabase come storage (free tier).
- Funzioni: creare/entrare in un sondaggio di date per le interrogazioni, vedere la lista ordinata per data (chi ha la data più "vecchia" esce prima), modificare/cancellare la propria voce, esportare CSV, marcare come interrogato.

Setup rapido (Supabase + Netlify)
1) Crea un progetto gratis su https://supabase.com -> ottieni URL e ANON KEY.
2) In Supabase SQL (Query editor) crea la tabella `entries` con questa query:

CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

(Se il tuo progetto non ha l'extension pgcrypto, usa uuid_generate_v4() o crea id come text.)

3) Nella dashboard di Supabase abilita le Row Level Security (RLS) o disabilitala per test. Per semplicità usa policy pubblica in sviluppo o aggiungi rule later.

4) Deploy su Netlify
- Crea un nuovo sito -> collegalo al tuo repo (es. GitHub).
- Aggiungi le variables d'ambiente nel pannello Site settings -> Environment:
  REACT_APP_SUPABASE_URL = <il tuo supabase url>
  REACT_APP_SUPABASE_ANON_KEY = <il tuo anon key>

5) Build command: `npm run build` e publish dir: `dist` o `build` a seconda del bundler.

Nota sulla sicurezza: usare la anon key espone i dati a chiunque se non imposti correttamente le Row Level Security di Supabase. Per una versione "classe" è meglio limitare le policy e aggiungere un piccolo Netlify Function come proxy autenticato.

----- APP (React) -----
*/

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function InterrogazioniApp() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchEntries();
    // simple realtime subscription (Supabase Realtime must be enabled)
    const subscription = supabase
      .channel("public:entries")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, payload => {
        fetchEntries();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "entries" }, payload => {
        fetchEntries();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "entries" }, payload => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) console.error(error);
    else setEntries(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !date) return alert("Inserisci nome e data");
    if (editing) {
      const { error } = await supabase.from("entries").update({ name, date, note }).eq("id", editing);
      if (error) return console.error(error);
      setEditing(null);
    } else {
      const { error } = await supabase.from("entries").insert([{ name, date, note }]);
      if (error) return console.error(error);
    }
    setName("");
    setDate("");
    setNote("");
    fetchEntries();
  }

  async function handleEdit(ent) {
    setEditing(ent.id);
    setName(ent.name);
    setDate(ent.date?.slice(0, 10) || "");
    setNote(ent.note || "");
  }

  async function handleDelete(id) {
    if (!confirm("Sei sicuro di eliminare questa voce?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) console.error(error);
    fetchEntries();
  }

  async function markDone(id) {
    // opzione: rimuovere l'elemento o spostarlo in una tabella "storico"; qui lo eliminiamo
    if (!confirm("Segnare come interrogato e rimuovere?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) console.error(error);
    fetchEntries();
  }

  function exportCSV() {
    const header = ["name", "date", "note", "created_at"];
    const rows = entries.map(r => [r.name, r.date, (r.note || ""), r.created_at]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interrogazioni_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const next = entries.length ? entries[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Interrogazioni (ordine per data)</h1>

        <form onSubmit={handleSubmit} className="grid gap-2 grid-cols-1 md:grid-cols-4 items-end mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="Es. Mario Rossi" />
          </div>
          <div>
            <label className="block text-sm">Data</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm">Nota</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border rounded" placeholder="opzionale" />
          </div>

          <div className="md:col-span-4 flex gap-2 mt-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? "Salva modifica" : "Aggiungi"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setName(""); setDate(""); setNote(""); }} className="px-4 py-2 border rounded">Annulla</button>}
            <button type="button" onClick={() => { setName(""); setDate(""); setNote(""); setEditing(null); }} className="px-4 py-2 border rounded">Nuova voce</button>
            <button type="button" onClick={exportCSV} className="ml-auto px-4 py-2 border rounded">Esporta CSV</button>
          </div>
        </form>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Prossimo</h2>
          {loading ? <div>Caricamento…</div> : (next ? (
            <div className="p-3 bg-gray-100 rounded">{next.name} — <strong>{next.date?.slice(0,10)}</strong> {next.note ? `(${next.note})` : ""}</div>
          ) : <div className="text-gray-500">Nessuna voce</div>)}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Tutti (ordinati per data)</h2>
          <div className="space-y-2 max-h-80 overflow-auto">
            {entries.map(ent => (
              <div key={ent.id} className="p-3 border rounded flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">{ent.name} <span className="text-sm text-gray-500">— {ent.date?.slice(0,10)}</span></div>
                  {ent.note && <div className="text-sm text-gray-600">{ent.note}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(ent)} className="px-2 py-1 border rounded text-sm">Modifica</button>
                  <button onClick={() => markDone(ent.id)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Interrogato</button>
                  <button onClick={() => handleDelete(ent.id)} className="px-2 py-1 border rounded text-sm">Elimina</button>
                </div>
              </div>
            ))}
            {entries.length === 0 && <div className="text-gray-500">Nessuna voce ancora.</div>}
          </div>
        </div>

        <footer className="mt-4 text-xs text-gray-500">Suggerimento: chiedi ai compagni di inserire solo giorno/mese/anno corretti. Per privacy, evita informazioni sensibili.</footer>
      </div>
    </div>
  );
}
