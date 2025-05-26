export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
  user_businesses?: UserBusiness[];
}

export interface UserBusiness {
  id: number;
  user_id: number;
  business_id: number;
  is_owner: boolean;
  is_admin: boolean;
  permissions: string[];
  created_at: string;
}

export interface Business {
  id: number;
  name: string;
  is_active: boolean;
}
