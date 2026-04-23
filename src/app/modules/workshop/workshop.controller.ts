import catchAsync from "../../shared/catchAsync.js";
import { getSingleFilePath } from "../../shared/getFilePath.js";
import config from "../../../config/index.js";
import { Request, Response } from "express";
import { WorkshopService } from "./workshop.services.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

const createWorkshop = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const image = getSingleFilePath(req.files, "image") as string;
  const url = `${config.backend_url}`.concat(image);

  if (image) {
    payload.avatar = url;
  }

  // service will handle hashing of the plain password
  const result = await WorkshopService.createWorkshop(payload);

  sendResponse(res, {
    success: true,
    message: "Workshop created",
    statusCode: 201,
    data: result,
  });
});

const getAllWorkshops = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "role",
    "isVerified",
    "approvalStatus",
    "searchTerm",
  ]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await WorkshopService.getAllWorkshops(filters, options);

  sendResponse(res, {
    success: true,
    message: "Workshops retrieve successfully",
    statusCode: 200,
    data: result,
  });
});

const getWorkshopById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WorkshopService.getWorkshopById(id);

  sendResponse(res, {
    success: true,
    message: "Workshop retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

// me ==============
const getMe = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const result = await WorkshopService.getMe(email as string);

  sendResponse(res, {
    success: true,
    message: "Workshop data retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const updateWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const image = getSingleFilePath(req.files, "image") as string;

  if (image) {
    const url = `${config.backend_url}${image}`;
    payload.avatar = url; // 👈 using avatar field
  }

  const result = await WorkshopService.updateWorkshop(id, payload);

  sendResponse(res, {
    success: true,
    message: "Workshop updated successfully",
    statusCode: 200,
    data: result,
  });
});

const updatePlatformFees = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { platformFees } = req.body;

  const result = await WorkshopService.updatePlatformFees(id, platformFees);

  sendResponse(res, {
    success: true,
    message: "Platform fees updated successfully",
    statusCode: 200,
    data: result,
  });
});

const approveWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.updateWorkshop(id, {
    approvalStatus: "APPROVED",
  });

  sendResponse(res, {
    success: true,
    message: "Workshop approved successfully",
    statusCode: 200,
    data: result,
  });
});
const rejectWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.updateWorkshop(id, {
    approvalStatus: "REJECTED",
  });

  sendResponse(res, {
    success: true,
    message: "Workshop rejected successfully",
    statusCode: 200,
    data: result,
  });
});
const suspendWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.updateWorkshop(id, {
    approvalStatus: "SUSPENDED",
  });

  sendResponse(res, {
    success: true,
    message: "Workshop suspended successfully",
    statusCode: 200,
    data: result,
  });
});

const unsuspendWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await WorkshopService.updateWorkshop(id, {
    approvalStatus: "APPROVED",
  });

  sendResponse(res, {
    success: true,
    message: "Workshop unsuspend successfully",
    statusCode: 200,
    data: result,
  });
});

const deleteWorkshop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await WorkshopService.deleteWorkshop(id);

  sendResponse(res, {
    success: true,
    message: "Workshop deleted successfully",
    statusCode: 200,
    data: result,
  });
});

const loginWorkshop = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await WorkshopService.loginWorkshop(payload);

  sendResponse(res, {
    success: true,
    message: "Workshop logged in successfully",
    statusCode: 200,
    data: result,
  });
});

const verifyWorkshop = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await WorkshopService.verifyWorkshop(payload);

  sendResponse(res, {
    success: true,
    message: "Workshop verified successfully",
    statusCode: 200,
    data: result,
  });
});

const resendWorkshopOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await WorkshopService.resendWorkshopOTP(email);

  sendResponse(res, {
    success: true,
    message: "OTP resent successfully",
    statusCode: 200,
    data: result,
  });
});

const forgetWorkshopPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await WorkshopService.forgetWorkshopPassword(email);

    sendResponse(res, {
      success: true,
      message: "Password reset email sent successfully",
      statusCode: 200,
      data: result,
    });
  },
);

const resetWorkshopPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.user; // workshop JWT payload
    const { password } = req.body;
    console.log("from reset pass workshop", email, password);

    const result = await WorkshopService.resetWorkshopPassword(email, password);

    sendResponse(res, {
      success: true,
      message: "Password reset successfully",
      statusCode: 200,
      data: result,
    });
  },
);

const changeWorkshopPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;

    const result = await WorkshopService.changeWorkshopPassword(
      email,
      newPassword,
      oldPassword,
    );

    sendResponse(res, {
      success: true,
      message: "Password changed successfully",
      statusCode: 200,
      data: result,
    });
  },
);
const getNearbyJobs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const result = await WorkshopService.getNearbyJobs({
    workshopId: id,
    search: req.query.search as string | undefined,
    category: req.query.category as string | undefined,
    sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  sendResponse(res, {
    success: true,
    message: "Nearby jobs retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
const getReviewsByWorkshopId = catchAsync(
  async (req: Request, res: Response) => {
    const { workshopId } = req.params;

    const result = await WorkshopService.getReviewsByWorkshopId(workshopId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Workshop reviews retrieved successfully",
      data: result,
    });
  },
);

const getBookingsByWorkshopId = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await WorkshopService.getBookingsByWorkshopId(id);

    sendResponse(res, {
      success: true,
      message: "Booking retrieved successfully",
      statusCode: 200,
      data: result,
    });
  },
);

export const WorkshopController = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  getMe,
  updateWorkshop,
  approveWorkshop,
  rejectWorkshop,
  suspendWorkshop,
  unsuspendWorkshop,
  deleteWorkshop,
  loginWorkshop,
  verifyWorkshop,
  resendWorkshopOTP,
  forgetWorkshopPassword,
  resetWorkshopPassword,
  changeWorkshopPassword,
  getNearbyJobs,
  getReviewsByWorkshopId,
  getBookingsByWorkshopId,
  updatePlatformFees,
};
