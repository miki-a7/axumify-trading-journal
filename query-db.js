const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qggoeykojofbsywtbaah.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function queryDatabase() {
  try {
    console.log('📊 AXUMIFY DATABASE TABLES\n');
    console.log('='.repeat(60) + '\n');

    // Get all trades
    const { data: trades, error: tradesError } = await supabase
      .from('Trade')
      .select('id, date, instrument, direction, pnl, result');

    if (tradesError) throw tradesError;
    console.log(`✅ TRADES: ${trades.length} records`);
    if (trades.length > 0) {
      console.log(JSON.stringify(trades.slice(0, 2), null, 2));
    }
    console.log('\n');

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email, name');

    if (usersError) throw usersError;
    console.log(`✅ USERS: ${users.length} records`);
    if (users.length > 0) {
      console.log(JSON.stringify(users, null, 2));
    }
    console.log('\n');

    // Get all backtests
    const { data: backtests, error: backtestsError } = await supabase
      .from('BacktestTrade')
      .select('id, date, instrument, result, pnl');

    if (backtestsError) throw backtestsError;
    console.log(`✅ BACKTEST TRADES: ${backtests.length} records`);
    if (backtests.length > 0) {
      console.log(JSON.stringify(backtests.slice(0, 2), null, 2));
    }
    console.log('\n');

    // Get all goals
    const { data: goals, error: goalsError } = await supabase
      .from('Goal')
      .select('id, title, targetValue, currentValue, deadline');

    if (goalsError) throw goalsError;
    console.log(`✅ GOALS: ${goals.length} records`);
    if (goals.length > 0) {
      console.log(JSON.stringify(goals, null, 2));
    }
    console.log('\n');

    // Get all prop accounts
    const { data: propAccounts, error: propError } = await supabase
      .from('PropAccount')
      .select('id, firmName, accountSize, currentBalance, status');

    if (propError) throw propError;
    console.log(`✅ PROP ACCOUNTS: ${propAccounts.length} records`);
    if (propAccounts.length > 0) {
      console.log(JSON.stringify(propAccounts, null, 2));
    }
    console.log('\n');

    console.log('='.repeat(60));
    console.log('\n🎉 Database query completed successfully!');

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
  }
}

queryDatabase();
