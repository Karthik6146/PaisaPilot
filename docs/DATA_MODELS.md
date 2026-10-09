# 📊 Data Models & Storage Schema

This document details the domain models, storage structures, and backup schemas used in PaisaPilot.

---

## 1. Domain Types (`src/types/finance.ts`)

### `Transaction`
```typescript
export interface Transaction {
  id: string;               // Unique ID: 'tx-[timestamp]-[random]'
  type: 'expense' | 'income';
  amount: number;           // Rupee amount (> 0)
  category: ExpenseCategory | IncomeCategory;
  note: string;             // Human description (e.g. 'Canteen samosa')
  date: string;             // ISO date: 'YYYY-MM-DD'
  time?: string;            // Time string: 'HH:MM'
  paymentMode: 'UPI (GPay/PhonePe)' | 'Cash' | 'Bank Transfer' | 'Card';
  tags?: string[];          // Hashtags: ['#Canteen', '#Hostel']
  createdAt: number;        // Epoch timestamp
}
```

### `LoanItem` (Udhaar Record)
```typescript
export interface LoanPayment {
  id: string;               // Unique payment ID
  amount: number;           // Amount repaid in this installment
  date: string;             // Date of payment
  note?: string;            // Optional note (e.g. 'UPI transfer')
}

export interface LoanItem {
  id: string;               // Unique ID: 'loan-[timestamp]-[random]'
  type: 'lent' | 'borrowed';// 'lent' = they owe you; 'borrowed' = you owe them
  personName: string;       // Friend's name
  personContact?: string;   // Phone or UPI ID
  originalAmount: number;   // Original loaned amount
  dateTaken: string;        // Date the loan was initiated
  dueDate: string;          // Target return date
  note: string;             // Reason/occasion
  payments: LoanPayment[];  // Array of partial installments
  isSettled: boolean;       // Settlement flag
  settledAt?: string;       // Timestamp when settled
  createdAt: number;
}
```

### `BudgetConfig`
```typescript
export interface BudgetConfig {
  monthlyTarget: number;    // Total monthly allowance target (e.g. 8000)
  categories: {
    [category: string]: number; // Category spending caps (e.g. 'Food & Mess': 3200)
  };
}
```

### `UserSettings`
```typescript
export interface UserSettings {
  userName: string;         // Student name (default: 'Student Karthik')
  currency: string;         // Currency code (default: 'INR')
  currencySymbol: string;   // Symbol (default: '₹')
  monthlyAllowance: number; // Monthly budget (default: 8000)
  soundEnabled: boolean;    // Web Audio toggle (default: true)
  geminiApiKey?: string;    // Optional Gemini API Key
}
```

---

## 2. LocalStorage Keys

All data is stored client-side in the browser:

| Key | Contents | Default Value |
| :--- | :--- | :--- |
| `pocketguard_transactions_v1` | Serialized `Transaction[]` | 8 Realistic Seed Transactions |
| `pocketguard_loans_v1` | Serialized `LoanItem[]` | 3 Seed Debts (Priya, Aman, Rohan) |
| `pocketguard_budget_v1` | Serialized `BudgetConfig` | ₹8,000 allowance with student categories |
| `pocketguard_settings_v1` | Serialized `UserSettings` | Karthik profile with sound enabled |

---

## 3. JSON Backup Format

When exporting data via **Settings $\to$ Export Backup JSON**, the file output is structured as:

```json
{
  "transactions": [ ... ],
  "loans": [ ... ],
  "budget": {
    "monthlyTarget": 8000,
    "categories": { ... }
  },
  "settings": {
    "userName": "Student Karthik",
    "currencySymbol": "₹",
    "monthlyAllowance": 8000,
    "soundEnabled": true
  },
  "exportDate": "2026-10-09T05:20:00.000Z"
}
```
This backup can be imported anytime on any browser or computer.

