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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allocation_targets: {
        Row: {
          asset_id: string | null
          category: string
          created_at: string
          id: string
          target_basis_points: number
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          category: string
          created_at?: string
          id: string
          target_basis_points: number
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          category?: string
          created_at?: string
          id?: string
          target_basis_points?: number
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_targets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_prices: {
        Row: {
          asset_id: string
          created_at: string
          currency: string
          id: string
          price_minor: number
          priced_at: string
          source: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          currency: string
          id: string
          price_minor: number
          priced_at: string
          source?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          currency?: string
          id?: string
          price_minor?: number
          priced_at?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_prices_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          created_at: string
          currency: string
          id: string
          market: string
          name: string
          status: string
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          currency: string
          id: string
          market: string
          name: string
          status?: string
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          id?: string
          market?: string
          name?: string
          status?: string
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          priced_at: string
          quote_currency: string
          rate_scale: number
          rate_scaled: number
          source: string
          user_id: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          id: string
          priced_at: string
          quote_currency: string
          rate_scale?: number
          rate_scaled: number
          source?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          priced_at?: string
          quote_currency?: string
          rate_scale?: number
          rate_scaled?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      fundamental_snapshots: {
        Row: {
          category: string
          created_at: string
          currency: string
          exercise_order: string | null
          filing_version: number
          id: number
          issued_shares_scale: number | null
          issued_shares_unscaled: number | null
          kind: string
          market: string
          net_income_minor: number | null
          net_asset_value_minor: number | null
          operating_cash_flow_minor: number | null
          period: string
          provenance: Json
          reference_date: string
          source: string
          source_archive: string
          source_document_id: string
          shareholder_count: number | null
          ticker: string
          total_assets_minor: number | null
          total_equity_minor: number | null
          total_revenue_minor: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency: string
          exercise_order?: string | null
          filing_version: number
          id?: number
          issued_shares_scale?: number | null
          issued_shares_unscaled?: number | null
          kind: string
          market: string
          net_income_minor?: number | null
          net_asset_value_minor?: number | null
          operating_cash_flow_minor?: number | null
          period: string
          provenance: Json
          reference_date: string
          source: string
          source_archive: string
          source_document_id: string
          shareholder_count?: number | null
          ticker: string
          total_assets_minor?: number | null
          total_equity_minor?: number | null
          total_revenue_minor?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          exercise_order?: string | null
          filing_version?: number
          id?: number
          issued_shares_scale?: number | null
          issued_shares_unscaled?: number | null
          kind?: string
          market?: string
          net_income_minor?: number | null
          net_asset_value_minor?: number | null
          operating_cash_flow_minor?: number | null
          period?: string
          provenance?: Json
          reference_date?: string
          source?: string
          source_archive?: string
          source_document_id?: string
          shareholder_count?: number | null
          ticker?: string
          total_assets_minor?: number | null
          total_equity_minor?: number | null
          total_revenue_minor?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          asset_id: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          purchased_at: string
          quantity: number
          status: string
          total_amount_minor: number
          unit_price_minor: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          currency: string
          id: string
          notes?: string | null
          purchased_at: string
          quantity: number
          status?: string
          total_amount_minor: number
          unit_price_minor: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          purchased_at?: string
          quantity?: number
          status?: string
          total_amount_minor?: number
          unit_price_minor?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      replace_allocation_targets: {
        Args: { targets: Json }
        Returns: undefined
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
