export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string
          discount_cents: number
          id: string
          is_gift: boolean
          order_id: string
          price_cents: number
          product_id: string
          sku: string
          title: string
        }
        Insert: {
          created_at?: string
          discount_cents?: number
          id?: string
          is_gift?: boolean
          order_id: string
          price_cents: number
          product_id: string
          sku: string
          title: string
        }
        Update: {
          created_at?: string
          discount_cents?: number
          id?: string
          is_gift?: boolean
          order_id?: string
          price_cents?: number
          product_id?: string
          sku?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          attribution_timestamp: string | null
          billing_city: string | null
          billing_country: string | null
          billing_state: string | null
          billing_street_address: string | null
          billing_zip_code: string | null
          created_at: string
          customer_email: string
          customer_first_name: string | null
          customer_last_name: string | null
          customer_phone: string | null
          discount_cents: number
          fbclid: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          line_items_summary: string | null
          marketing_consent_email: boolean
          marketing_consent_sms: boolean
          order_number: string
          oto_offer_accepted: boolean
          oto_offer_product_sku: string | null
          payment_fees_cents: number
          payment_provider: string | null
          paypal_order_id: string | null
          referrer: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_addons_count: number
          total_assessments_count: number
          total_cents: number
          total_consultations_count: number
          total_courses_count: number
          total_group_coaching_count: number
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          attribution_timestamp?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          billing_zip_code?: string | null
          created_at?: string
          customer_email: string
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          line_items_summary?: string | null
          marketing_consent_email?: boolean
          marketing_consent_sms?: boolean
          order_number: string
          oto_offer_accepted?: boolean
          oto_offer_product_sku?: string | null
          payment_fees_cents?: number
          payment_provider?: string | null
          paypal_order_id?: string | null
          referrer?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          total_addons_count?: number
          total_assessments_count?: number
          total_cents: number
          total_consultations_count?: number
          total_courses_count?: number
          total_group_coaching_count?: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          attribution_timestamp?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          billing_zip_code?: string | null
          created_at?: string
          customer_email?: string
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_phone?: string | null
          discount_cents?: number
          fbclid?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          line_items_summary?: string | null
          marketing_consent_email?: boolean
          marketing_consent_sms?: boolean
          order_number?: string
          oto_offer_accepted?: boolean
          oto_offer_product_sku?: string | null
          payment_fees_cents?: number
          payment_provider?: string | null
          paypal_order_id?: string | null
          referrer?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_addons_count?: number
          total_assessments_count?: number
          total_cents?: number
          total_consultations_count?: number
          total_courses_count?: number
          total_group_coaching_count?: number
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          price_cents: number
          sku: string
          sort_order: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          price_cents: number
          sku: string
          sort_order?: number | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          price_cents?: number
          sku?: string
          sort_order?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_guest_order_by_details: {
        Args: { _customer_email: string; _order_number: string }
        Returns: {
          created_at: string
          id: string
          order_number: string
          status: string
          total_cents: number
        }[]
      }
      get_order_analytics: {
        Args: { _end_date?: string; _start_date?: string }
        Returns: {
          attribution_timestamp: string
          created_at: string
          customer_email: string
          discount_cents: number
          fbclid: string
          gclid: string
          id: string
          landing_page: string
          medium_clean: string
          order_number: string
          referrer: string
          source_clean: string
          status: string
          subtotal_cents: number
          total_cents: number
          traffic_source_category: string
          utm_campaign: string
          utm_content: string
          utm_medium: string
          utm_source: string
          utm_term: string
        }[]
      }
      test_rls_as_anon: {
        Args: Record<PropertyKey, never>
        Returns: {
          can_access_orders: boolean
          row_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
