# Eventer - Event booking made easier

## Features Overview
- **Effective state management:** Demonstrates proficient use of React Hooks (like `useState` and `useEffect`) for managing complex UI state throughout the application.
- **Component-based architecture:** The UI is modular and split into highly reusable and isolated React components.
- **Handling of asynchronous API calls:** Employs `fetch` (and libraries like SWR) to handle asynchronous data-fetching efficiently from internal API routes.
- **Error Handling and Data Validation:** Features robust data validation mechanisms on the server, gracefully handling network failures and returning descriptive error messages.
- **Basic User Authentication:** Securely manages user sign-up and login logic using JSON Web Tokens (JWT).

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or a local MongoDB instance.

### Running the App
1. **Install Dependencies:**
   Clone the repository and install the project dependencies. This project uses `pnpm`.
   ```bash
   pnpm install
   ```
2. **Environment Variables:**
   Create a `.env.local` file in the root directory. Configure your database URI and a secret key for authentication:
   ```
   MONGODB_URI=mongodb+srv://<your-username>:<your-password>@cluster0.mongodb.net/eventtickets
   JWT_SECRET=your-super-secret-key
   ```
3. **Start the Development Server:**
   ```bash
   pnpm run dev
   ```
4. **Access the application:**
   Navigate to `http://localhost:3000` to interact with the Next.js frontend. Backend API routes are available at `http://localhost:3000/api/*`.

## Assumptions & Design Decisions
- **Full-Stack Next.js:** The frontend UI and backend API routes are cohesively structured using Next.js (App Router). The backend doesn't run as a separate server but is invoked dynamically through the `/api` route endpoints.
- **Double Booking Prevention:** To avoid concurrency and double-booking issues, the system utilizes temporary seat reservations (locking seats for a configured time frame, e.g., 10 minutes) before completing the final checkout. MongoDB documents represent seat status updates transactionally, ensuring a single source of truth.
- **Styling Strategy:** Tailwind CSS is used to keep styling rapid, localized, and maintainable.
