# 📅 Interrogazioni Classe - Dashboard

[Italiano 🇮🇹](#italiano) | [English 🇬🇧](#english)

---

## Italiano <a name="italiano"></a>

### 📝 Descrizione
**Interrogazioni Classe** è una dashboard web moderna progettata per aiutare gli studenti e i rappresentanti di classe a tenere traccia delle interrogazioni scolastiche. L'applicazione permette di registrare le date delle interrogazioni, monitorare chi non viene interrogato da molto tempo e gestire le materie scolastiche.

### ✨ Funzionalità Principali
- **Gestione Studenti**: Aggiungi, modifica e rimuovi studenti dalla lista.
- **Tracciamento Date**: Calcolo automatico dei giorni trascorsi dall'ultima interrogazione.
- **Conteggio Voti**: 🎓 Traccia il numero di interrogazioni già sostenute per ogni studente.
- **Prioritizzazione Intelligente**: Gli studenti vengono ordinati automaticamente priorizzando chi ha meno voti e, a parità di voti, chi non viene interrogato da più tempo.
- **Interfaccia Ottimizzata**:
  - ✨ **Azioni Rapide**: Pulsante "Check" per segnare rapidamente un'interrogazione (aggiorna data e voti).
  - 🔄 **Aggiornamento Istantaneo**: UI ottimista per un feedback immediato.
- **Sistema di Alert**:
  - 🟢 **Verde**: Interrogato recentemente (< 14 giorni).
  - 🟠 **Arancione**: Attenzione (> 14 giorni).
  - 🔴 **Rosso**: Urgente (> 30 giorni).
  - ⚠️ **Giallo**: Data mancante.
- **Gestione Materie**: Crea e personalizza materie con colori specifici.
- **Statistiche**: Visualizza il numero totale di studenti, interrogazioni urgenti e materie attive.
- **Dark Mode**: Supporto completo per il tema scuro (automatico o manuale).
- **Responsive**: Funziona perfettamente su desktop, tablet e smartphone.

### 🛠️ Tecnologie Utilizzate
- **Frontend**: HTML5, JavaScript (Modulare), Tailwind CSS (Build locale).
- **Build Tool**: Vite.
- **Icone**: Lucide Icons (Ottimizzate).
- **Backend**: API Serverless (Vercel Functions).
- **Database**: Neon (PostgreSQL).

### 🚀 Installazione e Avvio Locale
1. **Clona la repository**:
   ```bash
   git clone https://github.com/damianir750/Date-interrogazioni.git
   cd Date-interrogazioni
   ```

2. **Configura le variabili d'ambiente**:
   Crea un file `.env` nella root del progetto con la stringa di connessione al database:
   ```env
   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
   ```

3. **Avvia il server di sviluppo** (richiede Vercel CLI o un ambiente Node.js compatibile):
   ```bash
   npm install
   npm start
   ```
(se non fosse abbastanza chiaro questo codice è generato dall'ai)
---

## English <a name="english"></a>

### 📝 Description
**Interrogazioni Classe** (Class Interrogations) is a modern web dashboard designed to help students and class representatives track oral exams and interrogations. The application allows you to record dates, monitor students who haven't been tested in a while, and manage school subjects.

### ✨ Key Features
- **Student Management**: Add, edit, and remove students from the list.
- **Date Tracking**: Automatically calculates days since the last interrogation.
- **Grade Counting**: 🎓 Tracks the number of interrogations for each student.
- **Smart Prioritization**: Automatically sorts students by prioritizing those with fewer grades, then by longest time since last interrogation.
- **Optimized Interface**:
  - ✨ **Quick Actions**: "Check" button to instantly log an interrogation (updates date & grades).
  - 🔄 **Instant Updates**: Optimistic UI for immediate feedback.
- **Alert System**:
  - 🟢 **Green**: Recently tested (< 14 days).
  - 🟠 **Orange**: Warning (> 14 days).
  - 🔴 **Red**: Urgent (> 30 days).
  - ⚠️ **Yellow**: Missing date.
- **Subject Management**: Create and customize subjects with specific colors.
- **Statistics**: View total students, urgent cases, and active subjects.
- **Dark Mode**: Full support for dark theme (automatic or manual).
- **Responsive**: Works perfectly on desktop, tablets, and smartphones.

### 🛠️ Tech Stack
- **Frontend**: HTML5, JavaScript (Modular), Tailwind CSS (Local Build).
- **Build Tool**: Vite.
- **Icons**: Lucide Icons (Optimized).
- **Backend**: Serverless API (Vercel Functions).
- **Database**: Neon (PostgreSQL).

### 🚀 Setup and Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/damianir750/Date-interrogazioni.git
   cd Date-interrogazioni
   ```

2. **Configure environment variables**:
   Create a `.env` file in the project root with your database connection string:
   ```env
   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
   ```

3. **Start the development server** (requires Vercel CLI or a compatible Node.js environment):
   ```bash
   npm install
   npm start
   ```
(if this wasn't clear enough this code is ai generated)
