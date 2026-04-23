import { Prisma } from "@prisma/client"
import { prisma } from "../../../helpers/prisma.js"

const createWorkshopOpeningHour = async (payload: Prisma.WorkshopOpeningHourCreateInput) => {
    const result = await prisma.workshopOpeningHour.create({
        data: payload
    })
    return result
}

const getWorkshopOpeningHour = async () => {
    const result = await prisma.workshopOpeningHour.findMany()
    return result
}

const getWorkshopOpeningHourById = async (id: string) => {
    const result = await prisma.workshopOpeningHour.findUnique({
        where: {
            id: id
        }
    })
    return result
}

const getWorkshopOpeningHourByWorkshopId = async (workshopId: string) => {
    const result = await prisma.workshopOpeningHour.findMany({
        where: {
            workshopId: workshopId
        }
    })
    return result
}

const updateWorkshopOpeningHour = async (id: string, payload: Prisma.WorkshopOpeningHourUpdateInput) => {
    const result = await prisma.workshopOpeningHour.update({
        where: {
            id: id
        },
        data: payload
    })
    return result
}

// make opening hour close and make opening hour and close time null 
const makeOpeningHourClose = async (id: string) => {
    const result = await prisma.workshopOpeningHour.update({
        where: {
            id: id
        },
        data: {
            isClosed: true,
            openTime: null,
            closeTime: null
        }
    })
    return result
}

const deleteWorkshopOpeningHour = async (id:string) => {
    const result = await prisma.workshopOpeningHour.delete({
        where: {
            id: id
        }
    })
    return result
}

export const WorkshopOpeningHourServices = {
    createWorkshopOpeningHour,
    getWorkshopOpeningHour,
    updateWorkshopOpeningHour,
    makeOpeningHourClose,
    deleteWorkshopOpeningHour,
    getWorkshopOpeningHourById,
    getWorkshopOpeningHourByWorkshopId,
}