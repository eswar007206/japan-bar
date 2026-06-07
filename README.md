# Kanpai - Japanese Bar Management System

**Customer QR Bill Display & Real-Time Accounting System**

## 📖 What I Built & Why (Motivation)

In Japanese nightlife establishments like Izakayas, Girls Bars, or Hostess Clubs, billing can be complex due to time-based charges, service fees, and taxes. I built **Kanpai** to provide a real-time, transparent billing display system for customers. 

The goal is to improve customer trust and streamline the checkout process. By simply scanning a QR code at their table, customers can securely view their current tab, elapsed time, and potential extension costs without ever needing to flag down the staff.

## ✨ What It Does (Features)

- **Real-Time Billing Display:** Customers can see their current accounting information, including store name, table number, seating time, elapsed time, and time remaining.
- **Automatic Calculations:** Displays the current total amount including tax (10%) and service charge (20%), automatically truncated down to the nearest 10 yen.
- **Extension Preview:** Automatically displays the cost of a time extension when the remaining time is under 5 minutes.
- **Payment Methods:** Visual icons for accepted payment methods (Cash, Card, QR, Contactless).
- **Auto-Update:** The page refreshes data every 8 seconds.
- **Read-Only Interface:** Customers can only view the bill; they cannot place orders or alter data, ensuring system integrity.

## ⚠️ Note on the `.env` File

> **Why is the `.env` file in the repository?**
> You might notice that the `.env` file containing Supabase credentials is included in this repo. **This is intentional.** This is a demo project, and it points to a dummy database. I kept the `.env` file here so that reviewers and testers can easily run the demo without losing the environment configuration. Rest assured, I know better than to commit real environment variables to public repositories!

## 🔧 API Specifications

### `GET /customer/bill`
Retrieves the accounting information for the customer.

**Parameters:**
- `read_token` (string): A unique, read-only token generated per table.

**Example Response:**
```json
{
  "store_id": 1,
  "store_name": "Girls Bar Fairy Branch 1",
  "table_id": "T3",
  "table_label": "A5",
  "start_time": "2026-02-03T21:00:00+09:00",
  "elapsed_minutes": 152,
  "remaining_minutes": 8,
  "current_total": 18500,
  "show_extension_preview": true,
  "extension_preview_total": 21500,
  "accepted_payment_methods": ["cash", "card", "qr", "contactless"],
  "footer_note": "Tax & Service 20% separate",
  "last_updated": "2026-02-03T23:32:05+09:00"
}
```

## 🧮 Calculation Rules

- **Tax & Service Charge:** 
  - Consumption Tax: 10%
  - Service Charge: 20%
  - Total Multiplier: 1.20
- **Rounding:** 
  - The final display amount is **truncated to the nearest 10 yen**.
  - Formula: `Math.floor(amount / 10) * 10`
- **Extension Preview:** 
  - Triggers automatically when 5 minutes or less remain.
  - Adds the extension fee to the current total, applies tax/service charge, and truncates to the nearest 10 yen.

## 💻 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** TailwindCSS + shadcn-ui
- **Typography:** Noto Sans JP Font
- **Real-Time Data:** 8-second polling (expandable to WebSocket/SSE)
- **Database:** Supabase (Dummy data for demo purposes)

## 🚀 How to Run Locally

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## 🧪 Testing

To run the calculation logic unit tests:
```bash
npm run test
```
Tests for billing logic are located in `src/test/billing.test.ts`.
