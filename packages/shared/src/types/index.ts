import type { RegionValue } from '../constants/regions';

export type { RegionValue };

export type ListingType   = 'RENT' | 'SALE';
export type PropertyType  = 'HOUSE' | 'APARTMENT' | 'LAND' | 'COMMERCIAL';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'RENTED' | 'INACTIVE' | 'UNDER_REVIEW';
export type Role          = 'BUYER' | 'SELLER' | 'AGENT' | 'ADMIN';

export interface User {
  id:             string;
  name:           string;
  email?:         string;
  phone:          string;
  whatsappPhone?: string;
  role:           Role;
  isVerified:     boolean;
  profilePicture?: string;
  createdAt:      string;
}

export interface ListingImage {
  id:    string;
  url:   string;
  order: number;
}

export interface Listing {
  id:               string;
  title:            string;
  description:      string;
  priceMga:         number;
  priceUsdSnapshot?: number;
  listingType:      ListingType;
  propertyType:     PropertyType;
  status:           ListingStatus;
  bedrooms?:        number;
  bathrooms?:       number;
  areaSqm?:         number;
  addressFreeform:  string;
  city:             string;
  region:           RegionValue;
  latitude:         number;
  longitude:        number;
  whatsappContact?: string;
  reportCount:      number;
  owner:            Pick<User, 'id' | 'name' | 'isVerified' | 'role' | 'profilePicture'>;
  images:           ListingImage[];
  createdAt:        string;
  updatedAt:        string;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}
