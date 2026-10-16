# Leave Portal

Holiday calendar + employee leave management. No npm install needed (Node 22.13+).

    cd leave-portal
    node server.js          # http://localhost:4000

On first run an `admin` account is created and its random password is printed in the terminal
(or set `ADMIN_PASSWORD=...` before starting). Log in as admin, add employees, share their IDs and initial passwords.

**Policy** (edit `MONTHLY_QUOTA` in server.js): per month 1 casual + 2 sick, no carry-over.
Pending requests reserve balance; rejected/cancelled ones release it. Weekends (`WEEKLY_OFF`, default Sat+Sun) and
holidays are not counted as leave days. A request spanning two months is checked against each month's quota.

Env: `PORT`, `DB_FILE`, `WEEKLY_OFF` (e.g. `0` for Sunday only), `ADMIN_PASSWORD`.
Serve behind HTTPS in production (the session cookie should then also get the `Secure` flag).
