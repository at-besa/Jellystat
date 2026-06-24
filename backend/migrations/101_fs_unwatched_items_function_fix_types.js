exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP FUNCTION IF EXISTS public.fs_unwatched_items(text, text);

CREATE OR REPLACE FUNCTION public.fs_unwatched_items(
    itemtype text,
    libraryid text DEFAULT NULL)
    RETURNS TABLE(
        "Id" text,
        "Name" text,
        "Type" text,
        "ParentId" text,
        "PrimaryImageHash" text,
        "DateCreated" timestamp with time zone,
        "PremiereDate" timestamp with time zone
    )
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT
          i."Id",
          i."Name",
          i."Type",
          i."ParentId",
          i."PrimaryImageHash",
          i."DateCreated",
          i."PremiereDate"
        FROM jf_library_items i
        WHERE
          i."Type" = itemtype
          AND i.archived = false
          AND (libraryid IS NULL OR i."ParentId" = libraryid)
          AND NOT EXISTS (
            SELECT 1 FROM jf_playback_activity a
            WHERE a."NowPlayingItemId" = i."Id"
          )
        ORDER BY i."DateCreated" DESC;
    END;
$BODY$;

ALTER FUNCTION public.fs_unwatched_items(text, text)
    OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP FUNCTION IF EXISTS public.fs_unwatched_items(text, text);
    `);
  } catch (error) {
    console.error(error);
  }
};
