export const shorthands = undefined;

export function up(pgm) {
  pgm.addColumn('tables', {
    name: { type: 'varchar(64)' },
    last_activity_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
}

export function down(pgm) {
  pgm.dropColumn('tables', ['name', 'last_activity_at']);
}
