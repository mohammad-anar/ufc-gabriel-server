export type ICreateAccount = {
  name: string;
  email: string;
  otp: number;
};

export type IResetPassword = {
  email: string;
  otp: number;
};

export type IContact = {
  fullName: string;
  address: string;
  email: string;
  phoneNumber: string;
  message: string;
};

export type IWorkshopContact = {
  companyName: string;
  fullName: string;
  phone: string;
  additionalInfo: string;
};
