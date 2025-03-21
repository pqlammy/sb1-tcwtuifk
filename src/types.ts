import { User } from '@supabase/supabase-js';

export type Contribution = {
  id: string;
  user_id: string;
  amount: number;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  gennervogt_id: string;
  paid: boolean;
  created_at: string;
};

export type ContributionWithUser = Contribution & {
  user: Pick<User, 'email'>;
  gennervogt?: Pick<User, 'email'>;
};

export type LoginLog = {
  id: string;
  user_id: string;
  ip_address: string;
  success: boolean;
  created_at: string;
};