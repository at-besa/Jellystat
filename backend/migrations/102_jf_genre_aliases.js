exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      CREATE TABLE IF NOT EXISTS jf_genre_aliases (
        alias     text PRIMARY KEY,
        canonical text NOT NULL
      );

      INSERT INTO jf_genre_aliases (alias, canonical) VALUES
        ('Krimi',             'Crime'),
        ('Action & Adventure','Action'),
        ('Sci-Fi & Fantasy',  'Science Fiction'),
        ('Sci-fi & Fantasy',  'Science Fiction'),
        ('Aktion',            'Action'),
        ('Abenteuer',         'Adventure'),
        ('Animationsfilm',    'Animation'),
        ('Komödie',           'Comedy'),
        ('Liebesfilm',        'Romance'),
        ('Romantik',          'Romance'),
        ('Dokumentarfilm',    'Documentary'),
        ('Historienfilm',     'History'),
        ('Zeichentrick',      'Animation'),
        ('Kids',              'Kids & Family'),
        ('Children',          'Kids & Family'),
        ('Familia',           'Kids & Family')
      ON CONFLICT DO NOTHING;

      ALTER TABLE jf_genre_aliases OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`DROP TABLE IF EXISTS jf_genre_aliases;`);
  } catch (error) {
    console.error(error);
  }
};
