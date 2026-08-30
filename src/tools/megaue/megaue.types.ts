export interface OrderLocatorResponse {
  orderId: number;
  value: string;
  eventName: string;
  status: string;
  locators: string[];
}

export interface RequestCancelCodeResponse {
  message: string;
  maskedEmail: string;
}

export interface MegaueErrorResponse {
  detail?: string;
  title?: string;
  status?: number;
}
