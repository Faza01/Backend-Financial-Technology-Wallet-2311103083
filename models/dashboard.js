const { pool } = require('../config/database');

const Dashboard = {
    // mendapatkan ringkasan data untuk dashboard admin
    getSummary: async () => {
        const [[userCount]] = await pool.execute('SELECT COUNT(*) as total_users FROM users');
        const [[walletSummary]] = await pool.execute(`
        SELECT COUNT(*) as total_wallets, COALESCE(SUM(balance), 0) as total_balance
        FROM wallets
        `);
        const [[transactionCount]] = await pool.execute('SELECT COUNT(*) as total_transactions FROM transactions');

        const [transactionsByStatus] = await pool.execute(`
        SELECT status, COUNT(*) as total
        FROM transactions
        GROUP BY status
        `);

        const [transactionsByType] = await pool.execute(`
        SELECT transaction_type, COUNT(*) as total
        FROM transactions
        GROUP BY transaction_type
        `);

        const [latestTransactions] = await pool.execute(`
        SELECT t.*, w.wallet_number as sender_wallet_number, u.name as sender_name,
                rw.wallet_number as recipient_wallet_number
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        JOIN users u ON w.user_id = u.id
        LEFT JOIN wallets rw ON t.recipient_wallet_id = rw.id
        ORDER BY t.created_at DESC
        LIMIT 5
        `);

        return {
        total_users: userCount.total_users,
        total_wallets: walletSummary.total_wallets,
        total_balance: walletSummary.total_balance,
        total_transactions: transactionCount.total_transactions,
        transactions_by_status: transactionsByStatus,
        transactions_by_type: transactionsByType,
        latest_transactions: latestTransactions,
        };
    },
};

module.exports = Dashboard;
