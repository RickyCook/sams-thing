module.exports = {
  up: async opts => {
    const { connection } = opts;
    return connection.schema.createTable('entry', table => {
      table.increments();
      table.integer('happy');
      table.integer('social');
      table.integer('energy');
      table.text('notes');
      table.timestamp('created_at').defaultTo(connection.fn.now()).index();
    });
  },
  down: async opts => {
    const { connection } = opts;
    if (await connection.schema.hasTable('entry')) {
      return connection.schema.dropTable('entry');
    } else {
      console.error('No entry table');
    }
  },
}
