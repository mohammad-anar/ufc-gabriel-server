import { Prisma, WorkshopCategory } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";

const createWorkshopCategory = async (data: Prisma.WorkshopCategoryCreateInput): Promise<WorkshopCategory> => {
  const result = await prisma.workshopCategory.create({
    data,
    include: {
      workshop: {select: {workshopName:true, id:true, email:true, phone:true, address:true, avatar:true}},
      category: true,
    },
  });
  return result;
};

const getAllWorkshopCategories = async (
  workshopId:string
) => {
 const result = await prisma.workshopCategory.findMany({
  where: {workshopId: workshopId},
  include: {category:true, workshop:{select: {workshopName:true, id:true, email:true, phone:true, address:true, avatar:true ,}}}
 });
 return result;
};

const getWorkshopCategoryById = async (id: string): Promise<WorkshopCategory | null> => {
  const result = await prisma.workshopCategory.findUnique({
    where: { id },
    include: {
      workshop: true,
      category: true,
    },
  });
  return result;
};

const updateWorkshopCategory = async (
  id: string,
  payload: Partial<WorkshopCategory>
): Promise<WorkshopCategory | null> => {
  const result = await prisma.workshopCategory.update({
    where: { id },
    data: payload,
    include: {
      workshop: true,
      category: true,
    },
  });
  return result;
};

const deleteWorkshopCategory = async (id: string): Promise<WorkshopCategory | null> => {
  const result = await prisma.workshopCategory.delete({
    where: { id },
  });
  return result;
};

export const WorkshopCategoryService = {
  createWorkshopCategory,
  getAllWorkshopCategories,
  getWorkshopCategoryById,
  updateWorkshopCategory,
  deleteWorkshopCategory,
};
