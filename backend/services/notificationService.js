const notificationRepository = require("../repositories/notificationRepository");

const createRequestApprovedNotification = async (vendorId, requestId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "REQUEST_APPROVED",
    title: "Request Approved",
    message: "Your space request has been approved by an administrator.",
    relatedRequestId: requestId
  });
};

const createRequestRejectedNotification = async (vendorId, requestId, remarks) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "REQUEST_REJECTED",
    title: "Request Rejected",
    message: remarks ? `Your space request was rejected: ${remarks}` : "Your space request has been rejected by an administrator.",
    relatedRequestId: requestId
  });
};

const createPermitIssuedNotification = async (vendorId, requestId, permitId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "PERMIT_ISSUED",
    title: "Permit Issued",
    message: "Your permit has been issued and is now valid.",
    relatedRequestId: requestId,
    relatedPermitId: permitId
  });
};

const createPermitRevokedNotification = async (vendorId, permitId) => {
  return await notificationRepository.createNotification({
    userId: vendorId,
    type: "PERMIT_REVOKED",
    title: "Permit Revoked",
    message: "Your permit has been revoked by an administrator.",
    relatedPermitId: permitId
  });
};

module.exports = {
  createRequestApprovedNotification,
  createRequestRejectedNotification,
  createPermitIssuedNotification,
  createPermitRevokedNotification,
  repository: notificationRepository
};