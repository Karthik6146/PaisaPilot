# 🧮 Open-Source Inspired Calculators Guide

PaisaPilot includes 4 specialized calculators designed specifically for student workflows. Each tool solves a distinct real-world student scenario.

---

## 1. Soulver & Numi-Style Smart Note Calculator ([`SmartNoteCalc.tsx`](file:///d:/Karthik%20Shakyawar/Project%20-%202/src/components/Calculator/SmartNoteCalc.tsx))

Inspired by open-source projects like **NoteCalc** and **SoulCalc**, this tool turns your scratchpad into an intelligent real-time evaluator.

### How It Works:
1. Type human sentences containing math expressions:
   ```text
   Mess bill advance = 2400
   Jio 5G recharge = 299
   Chai and bun 15 * 25
   Assignment printing 45 * 1.5
   Emergency medicine = 200
   ```
2. The right-hand column parses each line in real-time, extracting mathematical operators and displaying the computed total.
3. **1-Click Ledger Transfer**: Beside every line result, click **"+ Expense"** to automatically populate your transaction ledger!
4. **Preloaded Templates**:
   - *College Month Essentials*
   - *Weekend Outing Split*
   - *Exam Prep Stationery*

---

## 2. Tactile Student Keypad ([`TactileCalculator.tsx`](file:///d:/Karthik%20Shakyawar/Project%20-%202/src/components/Calculator/TactileCalculator.tsx))

A sleek, tactile on-screen calculator engineered with pleasant audio haptics and student quick-math shortcuts.

### Key Features:
- **Calculation Tape**: Click the clock/history icon to expand a rolling ledger of your recent equations.
- **Student Quick Modifiers**:
  - `-10% Off`: Instant discount calculation.
  - `+5% GST` / `+18% GST`: Add canteen or restaurant tax with one tap.
  - `½ Split` / `⅓ Split`: Quick bill halves or thirds.
- **Direct Ledger Transfer**:
  - **"+ Expense"**: Push the current calculation to new expense outflow.
  - **"+ Income"**: Push to incoming pocket money.
  - **"+ Udhaar"**: Convert directly into a debt/loan record.

---

## 3. Student Canteen & Bill Splitter ([`BillSplitter.tsx`](file:///d:/Karthik%20Shakyawar/Project%20-%202/src/components/Calculator/BillSplitter.tsx))

Inspired by tools like **Split-the-Check**, this tool eliminates awkward group payment calculations after meals and parties.

### How It Works:
1. Enter the total bill (e.g. ₹600 for a canteen dinner).
2. Enter the occasion title.
3. Add friend names (e.g., *Aman*, *Priya*, *Rohan*).
4. The system calculates:
   - Your share: ₹150
   - Friends' shares: ₹150 each
5. Click **"Auto-Add 3 Shares to Udhaar (Lent)"**:
   - Automatically generates 3 separate debt entries in your Udhaar Hub.
   - Sets a 3-day target due date.
   - Pre-configures 1-click WhatsApp reminders for each friend!

---

## 4. "What-If" Expense Impact Simulator ([`WhatIfSimulator.tsx`](file:///d:/Karthik%20Shakyawar/Project%20-%202/src/components/Calculator/WhatIfSimulator.tsx))

Helps you make guilt-free decisions before spending money on impulsive desires.

### Questions It Answers:
- *"Can I afford this ₹450 Zomato biryani delivery?"*
- *"If I buy this ₹1,200 hoodie, what will my daily budget be for the next 15 days?"*

### Simulation Metrics:
- **Current Daily Allowance vs. Post-Purchase Daily Allowance**
- **Drop per Day**: Shows exactly how much less you can spend each day.
- **Risk Assessment**:
  - 🟢 **Affordable**: Minimal impact (< ₹20/day drop).
  - 🟡 **Tight Squeeze**: Noticeable impact (cut back on canteen snacks).
  - 🔴 **High Risk / Broke Alert**: Leaves you with < ₹100/day.

