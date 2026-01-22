const db = require("../db");
const { pointFromLatLng } = require("../services/spatialService");

const createSpace = async ({
  ownerId,
  spaceName,
  address,
  lat,
  lng,
  allowedRadius
}) => {
  const result = await db.query(
    `
    INSERT INTO spaces (
      owner_id,
      space_name,
      address,
      center,
      allowed_radius
    )
    VALUES (
      $1,
      $2,
      $3,
      ${pointFromLatLng(lat, lng)},
      $4
    )
    RETURNING
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at;
    `,
    [ownerId, spaceName, address, allowedRadius]
  );

  return result.rows[0];
};

const listByOwner = async ownerId => {
  const result = await db.query(
    `
    SELECT
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at
    FROM spaces
    WHERE owner_id = $1
    ORDER BY created_at DESC;
    `,
    [ownerId]
  );
  return result.rows;
};

const findById = async spaceId => {
  const result = await db.query(
    `
    SELECT
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at
    FROM spaces
    WHERE space_id = $1;
    `,
    [spaceId]
  );
  return result.rows[0] || null;
};

const listPublic = async () => {
  // All spaces are now public by default (removed space_type enum)
  const result = await db.query(
    `
    SELECT
      space_id,
      owner_id,
      space_name,
      address,
      allowed_radius,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng,
      created_at
    FROM spaces
    ORDER BY created_at DESC;
    `
  );
  return result.rows;
};

module.exports = {
  createSpace,
  listByOwner,
  findById,
  listPublic
};
