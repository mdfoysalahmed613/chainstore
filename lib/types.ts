export type Template = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string | null;
  price: number;
  category: string;
  preview_image_url: string | null;
  demo_url: string | null;
  download_url: string;
  tech_stack: string[];
  features: string[];
  hotpay_item_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  template_id: string;
  transaction_id: string | null;
  memo: string | null;
  payment_status: string;
  amount: number;
  currency: string;
  purchased_at: string;
};

export type PurchaseWithTemplate = Purchase & {
  templates: Template;
};
