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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bill_designations: {
        Row: {
          bill_id: string
          cast_id: string
          created_at: string
          designated_at: string | null
          extension_count: number | null
          id: string
          is_designated: boolean | null
        }
        Insert: {
          bill_id: string
          cast_id: string
          created_at?: string
          designated_at?: string | null
          extension_count?: number | null
          id?: string
          is_designated?: boolean | null
        }
        Update: {
          bill_id?: string
          cast_id?: string
          created_at?: string
          designated_at?: string | null
          extension_count?: number | null
          id?: string
          is_designated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_designations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_designations_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          base_minutes: number | null
          close_time: string | null
          closed_by: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          read_token: string | null
          seating_type: string | null
          start_time: string
          status: Database["public"]["Enums"]["bill_status"]
          store_id: number
          table_id: string
        }
        Insert: {
          base_minutes?: number | null
          close_time?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          read_token?: string | null
          seating_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["bill_status"]
          store_id: number
          table_id: string
        }
        Update: {
          base_minutes?: number | null
          close_time?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          read_token?: string | null
          seating_type?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["bill_status"]
          store_id?: number
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "floor_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_daily_earnings: {
        Row: {
          base_wage: number | null
          bonus_amount: number | null
          cast_id: string
          champagne_points: number | null
          created_at: string
          drink_points: number | null
          earning_date: string
          gross_amount: number | null
          id: string
          net_payout: number | null
          store_id: number
          tax_deduction: number | null
          total_backs: number | null
          transport_fee: number | null
          welfare_fee: number | null
          work_minutes: number | null
        }
        Insert: {
          base_wage?: number | null
          bonus_amount?: number | null
          cast_id: string
          champagne_points?: number | null
          created_at?: string
          drink_points?: number | null
          earning_date: string
          gross_amount?: number | null
          id?: string
          net_payout?: number | null
          store_id: number
          tax_deduction?: number | null
          total_backs?: number | null
          transport_fee?: number | null
          welfare_fee?: number | null
          work_minutes?: number | null
        }
        Update: {
          base_wage?: number | null
          bonus_amount?: number | null
          cast_id?: string
          champagne_points?: number | null
          created_at?: string
          drink_points?: number | null
          earning_date?: string
          gross_amount?: number | null
          id?: string
          net_payout?: number | null
          store_id?: number
          tax_deduction?: number | null
          total_backs?: number | null
          transport_fee?: number | null
          welfare_fee?: number | null
          work_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cast_daily_earnings_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_daily_earnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_members: {
        Row: {
          created_at: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          pin_hash: string
          referred_by: string | null
          transport_fee: number | null
          username: string
        }
        Insert: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          pin_hash: string
          referred_by?: string | null
          transport_fee?: number | null
          username: string
        }
        Update: {
          created_at?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          pin_hash?: string
          referred_by?: string | null
          transport_fee?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_members_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_referrals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          referral_bonus: number | null
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          referral_bonus?: number | null
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          referral_bonus?: number | null
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_sessions: {
        Row: {
          cast_id: string
          created_at: string
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          cast_id: string
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          cast_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_sessions_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_shifts: {
        Row: {
          cast_id: string
          clock_in: string
          clock_in_approved_at: string | null
          clock_in_approved_by: string | null
          clock_in_status: string | null
          clock_out: string | null
          clock_out_approved_at: string | null
          clock_out_approved_by: string | null
          clock_out_status: string | null
          created_at: string
          id: string
          is_late_pickup: boolean | null
          late_pickup_start: string | null
          notes: string | null
          store_id: number
        }
        Insert: {
          cast_id: string
          clock_in?: string
          clock_in_approved_at?: string | null
          clock_in_approved_by?: string | null
          clock_in_status?: string | null
          clock_out?: string | null
          clock_out_approved_at?: string | null
          clock_out_approved_by?: string | null
          clock_out_status?: string | null
          created_at?: string
          id?: string
          is_late_pickup?: boolean | null
          late_pickup_start?: string | null
          notes?: string | null
          store_id: number
        }
        Update: {
          cast_id?: string
          clock_in?: string
          clock_in_approved_at?: string | null
          clock_in_approved_by?: string | null
          clock_in_status?: string | null
          clock_out?: string | null
          clock_out_approved_at?: string | null
          clock_out_approved_by?: string | null
          clock_out_status?: string | null
          created_at?: string
          id?: string
          is_late_pickup?: boolean | null
          late_pickup_start?: string | null
          notes?: string | null
          store_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cast_shifts_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_shifts_clock_in_approved_by_fkey"
            columns: ["clock_in_approved_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_shifts_clock_out_approved_by_fkey"
            columns: ["clock_out_approved_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_shifts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cast_table_assignments: {
        Row: {
          assigned_at: string
          bill_id: string
          cast_id: string
          id: string
          is_active: boolean | null
          removed_at: string | null
        }
        Insert: {
          assigned_at?: string
          bill_id: string
          cast_id: string
          id?: string
          is_active?: boolean | null
          removed_at?: string | null
        }
        Update: {
          assigned_at?: string
          bill_id?: string
          cast_id?: string
          id?: string
          is_active?: boolean | null
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cast_table_assignments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_table_assignments_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          bonus_per_point: number | null
          bonus_tier: number | null
          created_at: string
          id: string
          is_weekend_holiday: boolean | null
          report_date: string
          store_id: number
          total_bills: number | null
          total_customers: number | null
          total_sales: number | null
        }
        Insert: {
          bonus_per_point?: number | null
          bonus_tier?: number | null
          created_at?: string
          id?: string
          is_weekend_holiday?: boolean | null
          report_date: string
          store_id: number
          total_bills?: number | null
          total_customers?: number | null
          total_sales?: number | null
        }
        Update: {
          bonus_per_point?: number | null
          bonus_tier?: number | null
          created_at?: string
          id?: string
          is_weekend_holiday?: boolean | null
          report_date?: string
          store_id?: number
          total_bills?: number | null
          total_customers?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_tables: {
        Row: {
          created_at: string
          height: number | null
          id: string
          label: string
          position_x: number | null
          position_y: number | null
          seats: number | null
          store_id: number
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          label: string
          position_x?: number | null
          position_y?: number | null
          seats?: number | null
          store_id: number
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          label?: string
          position_x?: number | null
          position_y?: number | null
          seats?: number | null
          store_id?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "floor_tables_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          back_amount: number | null
          bill_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cast_id: string | null
          created_at: string
          id: string
          is_cancelled: boolean | null
          points_amount: number | null
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          back_amount?: number | null
          bill_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cast_id?: string | null
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          points_amount?: number | null
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          back_amount?: number | null
          bill_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cast_id?: string | null
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          points_amount?: number | null
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cast_id_fkey"
            columns: ["cast_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_adjustments: {
        Row: {
          adjusted_amount: number
          adjustment_type: string
          bill_id: string | null
          created_at: string
          id: string
          order_id: string | null
          original_amount: number
          reason: string | null
          staff_id: string | null
        }
        Insert: {
          adjusted_amount: number
          adjustment_type: string
          bill_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          original_amount: number
          reason?: string | null
          staff_id?: string | null
        }
        Update: {
          adjusted_amount?: number
          adjustment_type?: string
          bill_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          original_amount?: number
          reason?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_adjustments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_adjustments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_adjustments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          back: number | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          drink_units: number | null
          id: string
          is_active: boolean | null
          name_jp: string
          points: number | null
          price: number
          sort_order: number | null
          tax_applicable: boolean | null
        }
        Insert: {
          back?: number | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          drink_units?: number | null
          id?: string
          is_active?: boolean | null
          name_jp: string
          points?: number | null
          price: number
          sort_order?: number | null
          tax_applicable?: boolean | null
        }
        Update: {
          back?: number | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          drink_units?: number | null
          id?: string
          is_active?: boolean | null
          name_jp?: string
          points?: number | null
          price?: number
          sort_order?: number | null
          tax_applicable?: boolean | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          pin_hash: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          pin_hash: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          pin_hash?: string
          role?: string
        }
        Relationships: []
      }
      staff_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          staff_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: string
          key: string
          label: string
          updated_at: string | null
          value: number
        }
        Insert: {
          id?: string
          key: string
          label: string
          updated_at?: string | null
          value: number
        }
        Update: {
          id?: string
          key?: string
          label?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          created_at: string
          id: number
          name: string
          timezone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: number
          name: string
          timezone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: number
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_staff_session: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "cast" | "staff"
      bill_status: "open" | "closed"
      payment_method_type: "cash" | "card" | "qr" | "contactless" | "cancelled" | "split"
      product_category:
        | "set"
        | "extension"
        | "nomination"
        | "companion"
        | "drinks"
        | "bottles"
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
    Enums: {
      app_role: ["admin", "cast", "staff"],
      bill_status: ["open", "closed"],
      payment_method_type: ["cash", "card", "qr", "contactless", "cancelled"],
      product_category: [
        "set",
        "extension",
        "nomination",
        "companion",
        "drinks",
        "bottles",
      ],
    },
  },
} as const
