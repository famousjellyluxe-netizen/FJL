You are an expert full-stack engineer and safe automated code editor. The repository is an ecommerce app (admin + backend + frontend). The user reports: product variant records (stored in the DB table `products_variants` / `product_variants`) are created correctly when adding products in Admin, but the client (product details page) does not display those variant sizes/colours. The user wants a careful, non-destructive fix: create a new branch, locate the root cause, confirm it with evidence, and only then propose and apply a minimal fix. Finally generate a markdown plan file `FIX_PRODUCT_VARIANTS_CLIENT.md` summarizing diagnosis, proof, and step-by-step fixes.

**Important constraints**

* Do NOT delete or rewrite unrelated code. Avoid large refactors. Keep changes minimal and isolated.
* Preserve the existing database — do not drop or migrate away from live data. If you need to modify DB data, create a reversible migration script and *document* it.
* Run tests and static checks before committing.
* If you cannot reproduce locally due to environment limits, produce precise commands and HTTP requests the developer can run and include expected outputs.

**Task steps (follow exactly)**

1. Create a new branch:

   * `git fetch origin`
   * `git checkout -b fix/product-variants-client-render`
   * Document the branch creation in the PR message.

2. Repo search & gather evidence:

   * Search (case-insensitive) for the following tokens and list file paths and relevant snippets (5 lines context):
     `product_variants`, `products_variants`, `variants`, `available_sizes`, `available_colors`, `variant_stock`, `sizeInventory`, `populate('variants')`, `JOIN products_variants`, `localStorage`, `loadProducts`, `shop-integration`, `admin.js`, `productService`, `getProduct`, `GET /api/products`, `transform`.
   * Also search for localStorage keys used for product cache (look in frontend for `localStorage.setItem` or a cache util).

3. Reproduce and trace the data flow (Admin → DB → API → Frontend → local cache):

   * Provide exact commands to create a test product via Admin API (curl + JSON body) including two variants (size + color) so reproduction is deterministic. Example payload must include `product_variants` sample.
   * Query the DB to confirm variants exist. Provide an example SQL (Postgres/MySQL) or Mongo query (show both if repo contains env hints) to inspect the `products_variants` rows or documents for the created product id. Show expected sample output.
   * Call the public API endpoint used by the product page (`GET /api/products/:id` or similar). Use curl examples to fetch that product; print the JSON response body (or show how to run the same via node/fetch). Expectation: variants and variant fields should be present in the API response. If they are missing, mark the API read layer as suspect.
   * If the API response contains variants but the client page doesn't, inspect the frontend transformation functions (e.g., `loadProducts`, `normalizeProduct`, `shop-integration.js`, React component that renders product details) and localStorage writes to identify if/where the fields are dropped/renamed/flattened.

4. Determine root cause with evidence:

   * For each of these layers (Admin write, DB storage, API read, frontend transform, local cache), produce a PASS/FAIL and a one-line reason plus evidence (example: "API response missing `variants` — curl output shown", or "localStorage entry lacks `available_sizes` — snippet from browser storage dump").
   * Only when one layer is identified as the root cause (the first layer where the data stops existing or becomes malformed) mark it as **ROOT CAUSE**. If multiple layers contribute, list them in priority order and show the critical path.

5. If root cause is confirmed, produce a minimal fix plan and apply it (if it's safe to do so):

   * Prefer changes in the code that restores data from the API response to the client (e.g., include `available_sizes`/`available_colors` in the shop integration transformation) or ensures the API returns variants when requested — whichever is minimal and safe.
   * If backend fix is necessary, change the controller/transformation to include `variants` in the product GET response, or adjust ORM/populate/joins. Keep the change to the smallest diff and add tests.
   * If frontend fix is necessary, update the transformation that writes to localStorage so it preserves `variants`, `available_sizes`, and `available_colors`. Do not change unrelated UI code.
   * Provide the exact patch/diff (git apply friendly) and run test suite.

6. Add tests:

   * Add one or more unit/integration tests that create a product with variants, then fetch via API, and assert that client-transformation code produces an object containing `variants`, `available_sizes`, and `available_colors`. Use existing test framework (detect `jest`, `mocha`, or other). If none exists, add a small script `tests/replicate-variants-issue.js` that runs the flow and logs PASS/FAIL.

7. Create `FIX_PRODUCT_VARIANTS_CLIENT.md` at repo root containing:

   * Short problem statement.
   * The complete root cause analysis with snippets and commands that reproduce the evidence.
   * The proposed minimal fix (files + exact diff).
   * Test instructions and commands used to validate the fix.
   * Deployment steps, cache invalidation instructions (localStorage migration script if needed), and rollback steps.
   * A final checklist for the reviewer before merging.

8. Commit & PR:

   * Commit minimal, focused changes to `fix/product-variants-client-render` with clear commit messages.
   * Push branch to origin.
   * Create a PR titled: `[fix] Ensure product variants are visible on client (product_variants → client cache)`.
   * PR description should include the `FIX_PRODUCT_VARIANTS_CLIENT.md` content summary and a checklist (backup DB, run tests, deploy backend first, then frontend, purge caches).
   * Do NOT merge the PR. Leave it for review.

9. If you cannot safely apply a patch (e.g., missing environment, secrets, or tests fail), do not change code. Instead produce a precise remediation script + human actionable checklist that the developer can run locally or in CI to confirm/fix the issue.

10. Output expectations for me (the developer):

    * A numbered list of files scanned and exact matches found.
    * Reproduction commands & their actual outputs (or simulated output if environment prevents execution).
    * The identified ROOT CAUSE with evidence.
    * The minimal patch (diff) and tests added.
    * Location and content summary for `FIX_PRODUCT_VARIANTS_CLIENT.md`.
    * Git branch name and PR link (if push succeeded) or exact `git` commands for the developer to run.

**If any step risks data loss or requires destructive DB operations, pause and output a safe non-destructive alternative.**
End of instructions.



Incase you need to be sure of the backend you are working with, here is the SQL for the database I am using in supabase right now.

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  password_hash character varying NOT NULL,
  role character varying NOT NULL DEFAULT 'staff'::character varying CHECK (role::text = ANY (ARRAY['owner'::character varying, 'manager'::character varying, 'staff'::character varying]::text[])),
  is_active boolean DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_name character varying NOT NULL DEFAULT 'Famous Jelly Luxe'::character varying,
  bank_name character varying NOT NULL DEFAULT 'Access Bank'::character varying,
  account_number character varying NOT NULL DEFAULT '1770816426'::character varying,
  account_type character varying NOT NULL DEFAULT 'Business Account'::character varying,
  store_email character varying NOT NULL DEFAULT 'hello@fjlclothing.shop'::character varying,
  tax_rate numeric NOT NULL DEFAULT 7.5,
  shipping_cost numeric NOT NULL DEFAULT 0,
  currency character varying NOT NULL DEFAULT 'NGN'::character varying,
  currency_symbol character varying NOT NULL DEFAULT '₦'::character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT business_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_email character varying NOT NULL,
  recipient_id uuid,
  email_type character varying NOT NULL,
  subject character varying,
  template_data jsonb,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying, 'bounced'::character varying]::text[])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  order_id uuid,
  product_id uuid,
  CONSTRAINT email_logs_pkey PRIMARY KEY (id),
  CONSTRAINT email_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT email_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  error_type character varying,
  error_message text,
  error_stack text,
  endpoint character varying,
  method character varying,
  user_id uuid,
  user_role character varying,
  status_code integer,
  request_body text,
  user_agent text,
  ip_address character varying,
  severity character varying DEFAULT 'medium'::character varying,
  metadata jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  is_subscribed boolean DEFAULT true,
  signup_source character varying DEFAULT 'homepage_modal'::character varying,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  unsubscribe_token character varying UNIQUE,
  CONSTRAINT members_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action character varying NOT NULL,
  from_value character varying,
  to_value character varying,
  reason text,
  metadata jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT order_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT order_audit_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  product_name character varying NOT NULL,
  product_sku character varying NOT NULL,
  size character varying,
  color character varying,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.order_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_type character varying NOT NULL,
  note text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT order_notes_pkey PRIMARY KEY (id),
  CONSTRAINT order_notes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL UNIQUE,
  user_id uuid,
  shipping_first_name character varying NOT NULL,
  shipping_last_name character varying NOT NULL,
  shipping_email character varying NOT NULL,
  shipping_phone character varying,
  shipping_address character varying NOT NULL,
  shipping_city character varying NOT NULL,
  shipping_state character varying NOT NULL,
  shipping_postal_code character varying NOT NULL,
  shipping_country character varying NOT NULL,
  buyer_name character varying NOT NULL,
  payment_method character varying DEFAULT 'bank_transfer'::character varying,
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  shipping_cost numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  order_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (order_status::text = ANY (ARRAY['pending'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying]::text[])),
  payment_status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'verified'::character varying, 'failed'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  stock_deducted boolean DEFAULT false,
  stock_deducted_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.product_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  color character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT product_colors_pkey PRIMARY KEY (id),
  CONSTRAINT product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_sizes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  size character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT product_sizes_pkey PRIMARY KEY (id),
  CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  size character varying NOT NULL,
  color character varying,
  stock_quantity integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sku character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  category_id uuid,
  price numeric NOT NULL,
  original_price numeric,
  image_url text,
  images ARRAY DEFAULT ARRAY[]::text[],
  total_stock integer DEFAULT 0,
  sleeve_type character varying,
  available_colors ARRAY DEFAULT ARRAY[]::text[],
  available_sizes ARRAY DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  announced_at timestamp with time zone,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.shipment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  event_type character varying NOT NULL,
  status character varying,
  location character varying,
  location_lat numeric,
  location_lng numeric,
  timestamp timestamp without time zone NOT NULL,
  description text,
  remarks text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT shipment_events_pkey PRIMARY KEY (id),
  CONSTRAINT shipment_events_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id)
);
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  tracking_number character varying UNIQUE,
  carrier character varying,
  carrier_service character varying,
  status character varying DEFAULT 'pending'::character varying,
  estimated_delivery_date date,
  actual_delivery_date date,
  origin_address text,
  destination_address text,
  weight_kg numeric,
  dimensions text,
  contents text,
  cost_amount integer,
  cost_currency character varying,
  signature_required boolean DEFAULT false,
  insurance_amount integer,
  metadata jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT shipments_pkey PRIMARY KEY (id),
  CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key character varying NOT NULL UNIQUE,
  setting_value text,
  setting_type character varying DEFAULT 'string'::character varying CHECK (setting_type::text = ANY (ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT store_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  phone character varying,
  address character varying,
  city character varying,
  state character varying,
  postal_code character varying,
  country character varying,
  is_member boolean DEFAULT false,
  order_count integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);