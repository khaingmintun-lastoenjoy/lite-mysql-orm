# Lite MySQL ORM

A lightweight, easy-to-use MySQL ORM for Node.js with built-in query builder. Perfect for small to medium projects that need a simple yet powerful database layer.

## Features

- 🔧 **Simple Setup** - Easy configuration and initialization
- 📝 **Query Builder** - Fluent, chainable query interface
- 🏗️ **Model Base Class** - Extendable model system
- 🔄 **Transactions** - Full transaction support
- 📊 **Pagination** - Built-in pagination helpers
- ⚡ **Performance** - Uses mysql2 for fast performance
- 🛡️ **Type Safety** - Basic parameter escaping and SQL injection protection

## Installation

```bash
npm install lite-mysql-orm
```

## Quick Start

### 1. Initialize Database Connection

```javascript
const { ORM } = require('lite-mysql-orm');

// Initialize with your database configuration
ORM.init({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'my_database',
  connectionLimit: 10
});
```

### 2. Create Your Models

```javascript
const { BaseModel } = require('lite-mysql-orm');

// User Model
class User extends BaseModel {
  static get tableName() {
    return 'users';
  }
  
  // Custom methods
  static async findByEmail(email) {
    return await this.findOne({ email });
  }
  
  static async findActiveUsers() {
    return await this.find({ status: 'active' });
  }
}

// Product Model
class Product extends BaseModel {
  static get tableName() {
    return 'products';
  }
  
  static async findAvailable() {
    return await this.find({ stock: { $gt: 0 }, status: 'available' });
  }
}
```

### 3. Use Your Models

```javascript
async function main() {
  // Create a new user
  const newUser = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  });
  console.log('Created user:', newUser);
  
  // Find user by ID
  const user = await User.findById(1);
  console.log('Found user:', user);
  
  // Find with conditions
  const users = await User.find({ age: { $gt: 18 } });
  console.log('Adult users:', users);
  
  // Update user
  await User.update(1, { name: 'Jane Doe' });
  
  // Delete user
  await User.delete(1);
  
  // Pagination
  const pageResult = await User.paginate(1, 10, { status: 'active' });
  console.log('Page 1:', pageResult.data);
  console.log('Pagination info:', pageResult.pagination);
}
```

## API Reference

### ORM Class

#### Static Methods:

**`ORM.init(config)`**
Initialize database connection pool.
```javascript
ORM.init({
  host: 'localhost',      // default: 'localhost'
  user: 'root',           // default: 'root'
  password: '',           // default: ''
  database: 'db_name',    // required
  port: 3306,             // default: 3306
  connectionLimit: 10,    // default: 10
  timezone: 'local'       // default: 'local'
});
```

**`ORM.table(tableName)`**
Get a query builder instance for a table.
```javascript
const query = ORM.table('users');
```

**`ORM.query(sql, params)`**
Execute raw SQL query.
```javascript
const results = await ORM.query('SELECT * FROM users WHERE age > ?', [18]);
```

**`ORM.insert(table, data)`**
Insert a single record.
```javascript
const result = await ORM.insert('users', {
  name: 'John',
  email: 'john@example.com'
});
```

**`ORM.update(table, data, conditions)`**
Update records.
```javascript
const result = await ORM.update('users', 
  { name: 'Jane' }, 
  { id: 1 }
);
```

**`ORM.delete(table, conditions)`**
Delete records.
```javascript
const result = await ORM.delete('users', { id: 1 });
```

**`ORM.transaction(callback)`**
Execute operations within a transaction.
```javascript
await ORM.transaction(async (connection) => {
  await connection.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
  await connection.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
});
```

**`ORM.close()`**
Close all database connections.
```javascript
await ORM.close();
```

### Query Builder

Chainable methods for building queries:

**Basic Querying**
```javascript
const results = await ORM.table('users')
  .select(['id', 'name', 'email'])
  .where({ status: 'active' })
  .where('age', '>', 18)
  .orderBy('created_at', 'DESC')
  .limit(10)
  .find();
```

**Where Conditions**
```javascript
.query()
  .where({ status: 'active' })                    // AND condition
  .orWhere({ status: 'pending' })                 // OR condition
  .whereIn('id', [1, 2, 3])                      // IN clause
  .whereNotIn('role', ['admin', 'superadmin'])   // NOT IN clause
  .whereBetween('age', 18, 65)                   // BETWEEN
  .whereLike('name', 'john')                     // LIKE %john%
  .whereNull('deleted_at')                       // IS NULL
  .whereNotNull('email')                         // IS NOT NULL
  .whereRaw('LENGTH(name) > ?', [5])            // Raw condition
```

**Joins**
```javascript
.query()
  .select(['users.*', 'profiles.bio'])
  .leftJoin('profiles', 'users.id = profiles.user_id')
  .innerJoin('roles', 'users.role_id = roles.id')
  .find();
```

**Aggregates**
```javascript
const count = await ORM.table('users').count();
const total = await ORM.table('orders').sum('amount');
const average = await ORM.table('products').avg('price');
const maxPrice = await ORM.table('products').max('price');
const minPrice = await ORM.table('products').min('price');
```

**Pagination**
```javascript
const result = await ORM.table('users')
  .where({ active: true })
  .paginate(1, 20);  // page 1, 20 per page

// Returns: { data: [...], pagination: {...} }
```

**Pluck Values**
```javascript
const names = await ORM.table('users').pluck('name');
// ['John', 'Jane', 'Bob']

const nameMap = await ORM.table('users').pluck('name', 'id');
// { 1: 'John', 2: 'Jane', 3: 'Bob' }
```

### BaseModel

Extend this class to create your models:

**Required Override**
```javascript
class User extends BaseModel {
  static get tableName() {
    return 'users';  // REQUIRED: Your table name
  }
}
```

**Available Methods**
- `Model.findById(id)` - Find by primary key
- `Model.findOne(conditions)` - Find single record
- `Model.find(conditions)` - Find multiple records
- `Model.findAll()` - Find all records
- `Model.create(data)` - Create new record
- `Model.update(id, data)` - Update record
- `Model.delete(id)` - Delete record
- `Model.count(conditions)` - Count records
- `Model.paginate(page, perPage, conditions)` - Paginated results

**Custom Methods**
```javascript
class User extends BaseModel {
  static get tableName() {
    return 'users';
  }
  
  static async findAdmins() {
    return await this.find({ role: 'admin' });
  }
  
  static async findByEmail(email) {
    return await this.findOne({ email });
  }
  
  static async updateLastLogin(userId) {
    return await this.update(userId, {
      last_login: new Date(),
      login_count: { $inc: 1 }
    });
  }
}
```

### Helper Utilities

```javascript
const { HelperUtils } = require('lite-mysql-orm');

// Clean object (remove null/undefined)
const clean = HelperUtils.cleanObject({ a: 1, b: null, c: undefined });
// { a: 1 }

// Generate random string
const random = HelperUtils.randomString(16);

// Sleep/delay
await HelperUtils.sleep(1000); // 1 second

// Pagination helper
const pagination = HelperUtils.toPagination(100, { page: 2, limit: 20 });
```

## Advanced Examples

### Complex Queries
```javascript
// Complex where conditions
const users = await User.query()
  .where({
    status: 'active',
    age: { $gte: 18, $lte: 65 }
  })
  .whereIn('role', ['user', 'vip'])
  .whereLike('name', 'john')
  .whereNull('banned_at')
  .orderBy('created_at', 'DESC')
  .paginate(1, 20);
```

### Transactions
```javascript
// Transfer money between accounts
async function transferMoney(fromId, toId, amount) {
  return await ORM.transaction(async (connection) => {
    // Deduct from source
    await connection.query(
      'UPDATE accounts SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amount, fromId, amount]
    );
    
    // Add to destination
    await connection.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    // Record transaction
    await connection.query(
      'INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)',
      [fromId, toId, amount]
    );
    
    return { success: true, amount };
  });
}
```

### Bulk Operations
```javascript
// Bulk insert using transaction
async function bulkCreateUsers(users) {
  return await ORM.transaction(async (connection) => {
    for (const user of users) {
      await connection.query(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        [user.name, user.email]
      );
    }
  });
}
```

## Error Handling

```javascript
try {
  const user = await User.findById(999);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  console.error('Database error:', error.message);
  
  if (error.code === 'ER_NO_SUCH_TABLE') {
    console.error('Table does not exist');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('Database connection refused');
  }
}
```

## Best Practices

1. **Always initialize ORM once** at application startup
2. **Use models** for business logic encapsulation
3. **Handle errors** appropriately
4. **Close connections** when shutting down
5. **Use transactions** for multiple related operations

```javascript
// app.js - Application setup
const { ORM } = require('lite-mysql-orm');

// Initialize on startup
ORM.init({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await ORM.close();
  process.exit(0);
});
```

## Migration from Existing Projects

If you're migrating from raw mysql2 queries:

```javascript
// Before: Raw queries
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [1]);

// After: Using ORM
const user = await User.findById(1);

// Before: Complex query
const [results] = await pool.query(`
  SELECT users.*, profiles.bio 
  FROM users 
  LEFT JOIN profiles ON users.id = profiles.user_id 
  WHERE users.status = ? 
  ORDER BY users.created_at DESC 
  LIMIT 10
`, ['active']);

// After: Query Builder
const results = await ORM.table('users')
  .select(['users.*', 'profiles.bio'])
  .leftJoin('profiles', 'users.id = profiles.user_id')
  .where({ 'users.status': 'active' })
  .orderBy('users.created_at', 'DESC')
  .limit(10)
  .find();
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For bugs and feature requests, please create an issue on GitHub.

---

**Enjoy simple and efficient MySQL operations with Lite MySQL ORM!** 🚀