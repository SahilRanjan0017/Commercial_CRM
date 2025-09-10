# Supabase `auth.users` Table Schema

This file provides the basic SQL schema for the main table used by Supabase Authentication to store user data. You do not need to create this table manually; Supabase creates and manages it for you.

## `auth.users` Table

This table stores the core information for each user in your application.

```sql
CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone character varying(15) DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change character varying(15) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

### Key Columns:

*   **`id`**: A unique UUID for each user. This is the primary key and what you should use to reference users in your other tables (e.g., as a foreign key).
*   **`email`**: The user's email address.
*   **`encrypted_password`**: The hashed version of the user's password. You will never see the plain-text password here.
*   **`email_confirmed_at`**: A timestamp indicating when the user confirmed their email address. If it's `NULL`, the user has not yet verified their email.
*   **`raw_user_meta_data`**: A JSONB column where you can store custom user data that is manageable by the user themselves (e.g., profile information like a username or avatar URL). In this setup, it's used to store the `full_name`.
*   **`raw_app_meta_data`**: A JSONB column for storing custom data that should only be manageable from a server-side context (e.g., roles, permissions, or subscription status).
