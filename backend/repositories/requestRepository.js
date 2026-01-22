const db = require("../db");
const { pointFromLatLng, radiusFromDims } = require("../services/spatialService");

const listOwnerRequests = async ownerId => {
  const result = await db.query(
    `
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      sr.reviewed_by,
      sr.reviewed_at,
      sr.remarks,
      sr.submitted_at,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name
    FROM space_requests sr
    JOIN spaces s ON s.space_id = sr.space_id
    WHERE s.owner_id = $1
    ORDER BY sr.submitted_at DESC;
    `,
    [ownerId]
  );
  return result.rows;
};

const createRequest = async ({
  vendorId,
  spaceId,
  lat,
  lng,
  maxWidth,
  maxLength,
  startTime,
  endTime
}) => {
  const result = await db.query(
    `
    INSERT INTO space_requests (
      vendor_id,
      space_id,
      center,
      max_width,
      max_length,
      start_time,
      end_time,
      status
    )
    VALUES (
      $1,
      $2,
      ${pointFromLatLng(lat, lng)},
      $3,
      $4,
      $5::timestamptz,
      $6::timestamptz,
      'PENDING'::request_status
    )
    RETURNING
      request_id,
      vendor_id,
      space_id,
      max_width,
      max_length,
      start_time,
      end_time,
      status,
      submitted_at,
      ST_Y(center::geometry) AS lat,
      ST_X(center::geometry) AS lng;
    `,
    [vendorId, spaceId, maxWidth, maxLength, startTime, endTime]
  );

  return result.rows[0];
};

const checkSpatialTemporalConflicts = async ({ spaceId, lat, lng, maxWidth, maxLength, startTime, endTime }) => {
  const requestRadius = radiusFromDims(maxWidth, maxLength);
  
  const result = await db.query(
    `
    WITH req_point AS (
      SELECT ${pointFromLatLng(lat, lng)} AS g
    )
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.start_time,
      sr.end_time,
      sr.status,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      sr.max_width,
      sr.max_length
    FROM space_requests sr, req_point
    WHERE sr.space_id = $1
      AND sr.status = 'APPROVED'
      AND ST_DWithin(
        sr.center,
        req_point.g,
        $2 + (
          SELECT SQRT(POWER(max_width, 2) + POWER(max_length, 2)) / 2
          FROM space_requests sr2
          WHERE sr2.request_id = sr.request_id
        )::float
      )
      AND (
        (sr.start_time <= $3::timestamptz AND sr.end_time > $3::timestamptz)
        OR (sr.start_time < $4::timestamptz AND sr.end_time >= $4::timestamptz)
        OR (sr.start_time >= $3::timestamptz AND sr.end_time <= $4::timestamptz)
      );
    `,
    [spaceId, requestRadius, startTime, endTime]
  );
  return result.rows;
};

const listVendorRequests = async vendorId => {
  const result = await db.query(
    `
    SELECT
      sr.request_id,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      sr.status,
      sr.reviewed_by,
      sr.reviewed_at,
      sr.remarks,
      sr.submitted_at,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address
    FROM space_requests sr
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    WHERE sr.vendor_id = $1
    ORDER BY sr.submitted_at DESC;
    `,
    [vendorId]
  );
  return result.rows;
};

const listVendorPermits = async vendorId => {
  const result = await db.query(
    `
    SELECT
      p.permit_id,
      p.request_id,
      p.qr_payload,
      p.status AS permit_status,
      p.valid_from,
      p.valid_to,
      p.issued_at,
      sr.vendor_id,
      sr.space_id,
      sr.max_width,
      sr.max_length,
      sr.start_time,
      sr.end_time,
      ST_Y(sr.center::geometry) AS lat,
      ST_X(sr.center::geometry) AS lng,
      s.space_name,
      s.address
    FROM permits p
    JOIN space_requests sr ON sr.request_id = p.request_id
    LEFT JOIN spaces s ON s.space_id = sr.space_id
    WHERE sr.vendor_id = $1
    ORDER BY p.issued_at DESC;
    `,
    [vendorId]
  );
  return result.rows;
};

module.exports = {
  listOwnerRequests,
  createRequest,
  checkSpatialTemporalConflicts,
  listVendorRequests,
  listVendorPermits
};
