const { ApolloServer, gql } = require('apollo-server-express');
const KnexMigrator = require('knex-migrator');
const moment = require('moment-timezone');
const path = require('path');

const migratorConfig = {
  database: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, '..', 'db.sqlite3'),
    },
  },
  migrationPath: path.join(__dirname, '..', 'migrations'),
  currentVersion: '1.0',
};
const knex = require('knex')(migratorConfig.database);
const knexMigrator = new KnexMigrator({
  knexMigratorConfig: migratorConfig,
});

const typeDefs = gql`
  type Query {
    isDatabaseOK: MigrateResp
    graphData(from: String, to: String): GraphDataResp
  }
  type Mutation {
    init: MigrateResp
    migrate: MigrateResp
    rollback: MigrateResp
    reset: MigrateResp

    createEntry(entry: CreateEntry): EntryResp
  }
  type MigrateResp {
    ok: Boolean!
    message: String
  }

  type Entry {
    id: ID!
    happy: Int
    social: Int
    energy: Int
    notes: String
    created_at: String!
  }
  input CreateEntry {
    happy: Int!
    social: Int!
    energy: Int!
    notes: String!
  }
  type EntryResp {
    ok: Boolean!
    message: String
    entry: Entry
  }

  type GraphDataResp {
    firstEntry: Entry
    lastEntry: Entry
    entries: [Entry]
  }
`;

const createMigrationMutation = (fn, opts) => async () => {
  try {
    await knexMigrator[fn](opts);
    return { ok: true };
  } catch (err) {
    console.error(`DB ${fn} error`, err);
    return { ok: false, message: err.toString() };
  }
}

const eventColumns = ['id', 'happy', 'social', 'energy', 'notes', 'created_at'];
const sqliteFs = 'YYYY-MM-DD HH:mm:ss';

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    isDatabaseOK: async () => {
      try {
        await knexMigrator.isDatabaseOK();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: err.code };
      }
    },
    // entries: async () => {
    //   return await knex('entry').select('id', 'happy', 'social', 'energy', 'notes');
    // },
    graphData: async (root, { from, to }) => {
      const table = knex.select(...eventColumns).from('entry');
      const asc = table.clone().orderBy('created_at', 'asc');
      const desc = table.clone().orderBy('created_at', 'desc');

      const fromUtc = from && moment(from).utc();
      const toUtc = to && moment(to).utc();

      const createdAtRef = knex.raw("cast(strftime('%s', `created_at`) as integer)");
      let query = asc.clone();
      if (from && to) {
        query = query.whereBetween(createdAtRef, [fromUtc.unix(), toUtc.unix()]);
      } else if (from) {
        query = query.where(createdAtRef, '>', fromUtc.unix());
      } else if (to) {
        query = query.where(createdAtRef, '<', fromUtc.unix());
      }

      return {
        firstEntry: await asc.clone().first(),
        lastEntry: await desc.clone().first(),
        entries: await query,
      }
    },
  },
  Mutation: {
    init: createMigrationMutation('init'),
    migrate: createMigrationMutation('migrate', { init: true }),
    rollback: createMigrationMutation('rollback', { force: true }),
    reset: createMigrationMutation('reset'),

    createEntry: async (root, args) => {
      try {
        const data = await (
          knex('entry')
            .insert({
              ...args.entry,
              created_at: knex.fn.now(),
            })
            .returning(eventColumns)
         );
        return { ok: true, message: 'Entry created', entry: data[0] };
      } catch (err) {
        console.error('createEntry Error', err);
        return { ok: false, message: err.toString() };
      }
    },
  },
  Entry: {
    created_at: entry => {
      return moment.utc(entry.created_at, sqliteFs).format();
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = app => {
  server.applyMiddleware({ app });
};
