export type ICreateWorkshop = {
  workshopName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  password: string;
  description?: string;
  city: string;
  cvrNumber: string;
  ownerName: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  platformFees?: number;
};
