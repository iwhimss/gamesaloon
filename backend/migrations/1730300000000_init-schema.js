export const shorthands = undefined;

export function up(pgm) {
  pgm.createTable('users', {
    id: 'id',
    username: { type: 'varchar(64)', notNull: true },
    password_hash: { type: 'varchar(255)' },
    is_guest: { type: 'boolean', notNull: true, default: true },
    avatar: { type: 'varchar(64)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('tables', {
    id: 'id',
    code: { type: 'varchar(12)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)' },
    host_user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    game_type: { type: 'varchar(32)', notNull: true },
    status: { type: 'varchar(16)', notNull: true, default: 'bekleniyor' },
    max_players: { type: 'integer', notNull: true, default: 4 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    closed_at: { type: 'timestamptz' },
  });

  pgm.createTable('table_players', {
    table_id: { type: 'integer', notNull: true, references: 'tables', onDelete: 'CASCADE' },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    seat_no: { type: 'integer', notNull: true },
    joined_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    left_at: { type: 'timestamptz' },
  });
  pgm.addConstraint('table_players', 'table_players_pkey', {
    primaryKey: ['table_id', 'user_id'],
  });

  pgm.createTable('game_sessions', {
    id: 'id',
    table_id: { type: 'integer', notNull: true, references: 'tables', onDelete: 'CASCADE' },
    game_type: { type: 'varchar(32)', notNull: true },
    started_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    ended_at: { type: 'timestamptz' },
    result_json: { type: 'jsonb' },
  });

  pgm.createTable('score_history', {
    id: 'id',
    game_session_id: { type: 'integer', notNull: true, references: 'game_sessions', onDelete: 'CASCADE' },
    user_id: { type: 'integer', notNull: true, references: 'users', onDelete: 'CASCADE' },
    score: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
}

export function down(pgm) {
  pgm.dropTable('score_history');
  pgm.dropTable('game_sessions');
  pgm.dropTable('table_players');
  pgm.dropTable('tables');
  pgm.dropTable('users');
}
