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
      contribution_plan_items: {
        Row: {
          asset_id: string
          contribution_plan_id: string
          created_at: string
          currency: string
          id: string
          planned_amount_minor: number
          purchase_id: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          contribution_plan_id: string
          created_at?: string
          currency: string
          id: string
          planned_amount_minor: number
          purchase_id?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          contribution_plan_id?: string
          created_at?: string
          currency?: string
          id?: string
          planned_amount_minor?: number
          purchase_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_plan_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_plan_items_contribution_plan_id_fkey"
            columns: ["contribution_plan_id"]
            isOneToOne: false
            referencedRelation: "contribution_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_plan_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_plans: {
        Row: {
          created_at: string
          currency: string
          id: string
          input_amount_minor: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          id: string
          input_amount_minor: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          input_amount_minor?: number
          status?: string
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
          filing_version: number | null
          id: number
          issued_shares_scale: number | null
          issued_shares_unscaled: number | null
          kind: string
          market: string
          net_asset_value_minor: number | null
          net_assets_minor: number | null
          net_income_minor: number | null
          operating_cash_flow_minor: number | null
          period: string
          provenance: Json
          reference_date: string
          shareholder_count: number | null
          source: string
          source_archive: string
          source_document_id: string
          ticker: string
          total_assets_minor: number | null
          total_equity_minor: number | null
          total_liabilities_minor: number | null
          total_revenue_minor: number | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          currency: string
          exercise_order?: string | null
          filing_version?: number | null
          id?: number
          issued_shares_scale?: number | null
          issued_shares_unscaled?: number | null
          kind: string
          market: string
          net_asset_value_minor?: number | null
          net_assets_minor?: number | null
          net_income_minor?: number | null
          operating_cash_flow_minor?: number | null
          period: string
          provenance: Json
          reference_date: string
          shareholder_count?: number | null
          source: string
          source_archive: string
          source_document_id: string
          ticker: string
          total_assets_minor?: number | null
          total_equity_minor?: number | null
          total_liabilities_minor?: number | null
          total_revenue_minor?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          exercise_order?: string | null
          filing_version?: number | null
          id?: number
          issued_shares_scale?: number | null
          issued_shares_unscaled?: number | null
          kind?: string
          market?: string
          net_asset_value_minor?: number | null
          net_assets_minor?: number | null
          net_income_minor?: number | null
          operating_cash_flow_minor?: number | null
          period?: string
          provenance?: Json
          reference_date?: string
          shareholder_count?: number | null
          source?: string
          source_archive?: string
          source_document_id?: string
          ticker?: string
          total_assets_minor?: number | null
          total_equity_minor?: number | null
          total_liabilities_minor?: number | null
          total_revenue_minor?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      market_asset_prices: {
        Row: {
          created_at: string
          currency: string
          id: number
          market: string
          price_minor: number
          priced_at: string
          source: string
          ticker: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: number
          market: string
          price_minor: number
          priced_at: string
          source: string
          ticker: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: number
          market?: string
          price_minor?: number
          priced_at?: string
          source?: string
          ticker?: string
        }
        Relationships: []
      }
      market_exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: number
          priced_at: string
          quote_currency: string
          rate_scale: number
          rate_scaled: number
          source: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          id?: number
          priced_at: string
          quote_currency: string
          rate_scale?: number
          rate_scaled: number
          source: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: number
          priced_at?: string
          quote_currency?: string
          rate_scale?: number
          rate_scaled?: number
          source?: string
        }
        Relationships: []
      }
      official_asset_events: {
        Row: {
          accession_number: string | null
          asset_category: string
          asset_market: string
          asset_official_name: string
          asset_regulatory_identity_key: string
          asset_ticker: string
          association_evidence: Json
          attribution: string | null
          canonical_url: string | null
          class_contract_id: string | null
          classification_justification: string | null
          cnpj: string | null
          cvm_code: string | null
          deduplication_key: string
          document_identity_kind: string
          document_identity_value: string
          domain_schema_version: string
          event_id: string
          event_type: string
          fingerprint: string | null
          ingested_at: string
          isin: string | null
          jurisdiction: string
          language: string
          mapping_version: string
          occurred_at_date: string | null
          occurred_at_instant_utc: string | null
          occurred_at_precision: string | null
          occurred_at_raw: string | null
          occurred_at_source_offset: string | null
          original_url: string | null
          parser_version: string
          protocol_number: string | null
          provenance_raw_fields: Json
          provenance_source_system: string
          provenance_source_type: string
          published_at_date: string | null
          published_at_instant_utc: string | null
          published_at_precision: string
          published_at_raw: string
          published_at_source_offset: string | null
          raw_document_category: string | null
          raw_document_type: string
          registrant_cik: string | null
          regulatory_document_id: string | null
          related_documents: Json
          series_id: string | null
          source: string
          source_document_id: string | null
          source_payload_hash: string
          source_type: string
          status: string
          storage_schema_version: string
          summary: string | null
          supersedes_event_id: string | null
          terms_audited_at: string
          title: string
          updated_at: string
        }
        Insert: {
          accession_number?: string | null
          asset_category: string
          asset_market: string
          asset_official_name: string
          asset_regulatory_identity_key: string
          asset_ticker: string
          association_evidence: Json
          attribution?: string | null
          canonical_url?: string | null
          class_contract_id?: string | null
          classification_justification?: string | null
          cnpj?: string | null
          cvm_code?: string | null
          deduplication_key: string
          document_identity_kind: string
          document_identity_value: string
          domain_schema_version: string
          event_id: string
          event_type: string
          fingerprint?: string | null
          ingested_at: string
          isin?: string | null
          jurisdiction: string
          language: string
          mapping_version: string
          occurred_at_date?: string | null
          occurred_at_instant_utc?: string | null
          occurred_at_precision?: string | null
          occurred_at_raw?: string | null
          occurred_at_source_offset?: string | null
          original_url?: string | null
          parser_version: string
          protocol_number?: string | null
          provenance_raw_fields: Json
          provenance_source_system: string
          provenance_source_type: string
          published_at_date?: string | null
          published_at_instant_utc?: string | null
          published_at_precision: string
          published_at_raw: string
          published_at_source_offset?: string | null
          raw_document_category?: string | null
          raw_document_type: string
          registrant_cik?: string | null
          regulatory_document_id?: string | null
          related_documents: Json
          series_id?: string | null
          source: string
          source_document_id?: string | null
          source_payload_hash: string
          source_type: string
          status: string
          storage_schema_version: string
          summary?: string | null
          supersedes_event_id?: string | null
          terms_audited_at: string
          title: string
          updated_at: string
        }
        Update: {
          accession_number?: string | null
          asset_category?: string
          asset_market?: string
          asset_official_name?: string
          asset_regulatory_identity_key?: string
          asset_ticker?: string
          association_evidence?: Json
          attribution?: string | null
          canonical_url?: string | null
          class_contract_id?: string | null
          classification_justification?: string | null
          cnpj?: string | null
          cvm_code?: string | null
          deduplication_key?: string
          document_identity_kind?: string
          document_identity_value?: string
          domain_schema_version?: string
          event_id?: string
          event_type?: string
          fingerprint?: string | null
          ingested_at?: string
          isin?: string | null
          jurisdiction?: string
          language?: string
          mapping_version?: string
          occurred_at_date?: string | null
          occurred_at_instant_utc?: string | null
          occurred_at_precision?: string | null
          occurred_at_raw?: string | null
          occurred_at_source_offset?: string | null
          original_url?: string | null
          parser_version?: string
          protocol_number?: string | null
          provenance_raw_fields?: Json
          provenance_source_system?: string
          provenance_source_type?: string
          published_at_date?: string | null
          published_at_instant_utc?: string | null
          published_at_precision?: string
          published_at_raw?: string
          published_at_source_offset?: string | null
          raw_document_category?: string | null
          raw_document_type?: string
          registrant_cik?: string | null
          regulatory_document_id?: string | null
          related_documents?: Json
          series_id?: string | null
          source?: string
          source_document_id?: string | null
          source_payload_hash?: string
          source_type?: string
          status?: string
          storage_schema_version?: string
          summary?: string | null
          supersedes_event_id?: string | null
          terms_audited_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      official_event_backfill_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          error_summary: Json | null
          fetched_event_count: number
          job_id: string
          job_payload: Json
          lease_acquired_at: string | null
          lease_expires_at: string | null
          lease_owner: string | null
          ordinal: number
          persisted_attempt_count: number
          plan_id: string
          provider: string
          rejected_item_count: number
          result_summary: Json | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count: number
          completed_at?: string | null
          error_summary?: Json | null
          fetched_event_count: number
          job_id: string
          job_payload: Json
          lease_acquired_at?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          ordinal: number
          persisted_attempt_count: number
          plan_id: string
          provider: string
          rejected_item_count: number
          result_summary?: Json | null
          started_at?: string | null
          status: string
          updated_at: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          error_summary?: Json | null
          fetched_event_count?: number
          job_id?: string
          job_payload?: Json
          lease_acquired_at?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          ordinal?: number
          persisted_attempt_count?: number
          plan_id?: string
          provider?: string
          rejected_item_count?: number
          result_summary?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_event_backfill_jobs_plan_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "official_event_backfill_runs"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      official_event_backfill_runs: {
        Row: {
          backfill_version: string
          completed_at: string | null
          conflict_jobs: number
          created_at: string
          failed_jobs: number
          failure_mode: string
          max_attempts_per_job: number
          pending_jobs: number
          plan_hash: string
          plan_id: string
          plan_payload: Json
          retry_failed: boolean
          running_jobs: number
          status: string
          succeeded_jobs: number
          total_jobs: number
          updated_at: string
        }
        Insert: {
          backfill_version: string
          completed_at?: string | null
          conflict_jobs: number
          created_at: string
          failed_jobs: number
          failure_mode: string
          max_attempts_per_job: number
          pending_jobs: number
          plan_hash: string
          plan_id: string
          plan_payload: Json
          retry_failed: boolean
          running_jobs: number
          status: string
          succeeded_jobs: number
          total_jobs: number
          updated_at: string
        }
        Update: {
          backfill_version?: string
          completed_at?: string | null
          conflict_jobs?: number
          created_at?: string
          failed_jobs?: number
          failure_mode?: string
          max_attempts_per_job?: number
          pending_jobs?: number
          plan_hash?: string
          plan_id?: string
          plan_payload?: Json
          retry_failed?: boolean
          running_jobs?: number
          status?: string
          succeeded_jobs?: number
          total_jobs?: number
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
      claim_official_event_backfill_jobs_v1: {
        Args: {
          input_lease_duration_seconds: number
          input_limit: number
          input_now: string
          input_plan_id: string
          input_worker_id: string
        }
        Returns: Json
      }
      complete_official_event_backfill_job_v1: {
        Args: {
          input_job_id: string
          input_now: string
          input_plan_id: string
          input_summary: Json
          input_worker_id: string
        }
        Returns: Json
      }
      create_or_resume_official_event_backfill_v1: {
        Args: { input_now: string; input_plan: Json }
        Returns: Json
      }
      fail_official_event_backfill_job_v1: {
        Args: {
          input_disposition: string
          input_error: Json
          input_job_id: string
          input_now: string
          input_plan_id: string
          input_summary: Json
          input_worker_id: string
        }
        Returns: Json
      }
      finalize_official_event_backfill_v1: {
        Args: { input_now: string; input_plan_id: string }
        Returns: Json
      }
      get_official_asset_event_by_id_v1: {
        Args: { input_event_id: string }
        Returns: Json
      }
      get_official_event_backfill_snapshot_v1: {
        Args: { input_plan_id: string }
        Returns: Json
      }
      list_official_asset_events_v1: {
        Args: { input_query: Json }
        Returns: Json
      }
      pause_official_event_backfill_v1: {
        Args: { input_now: string; input_plan_id: string }
        Returns: Json
      }
      refresh_official_event_backfill_run_v1: {
        Args: { input_now: string; input_plan_id: string }
        Returns: undefined
      }
      release_official_event_backfill_jobs_v1: {
        Args: {
          input_job_ids: Json
          input_now: string
          input_pause_plan: boolean
          input_plan_id: string
          input_worker_id: string
        }
        Returns: Json
      }
      replace_allocation_targets: {
        Args: { targets: Json }
        Returns: undefined
      }
      upsert_fundamental_snapshots_v1: {
        Args: { records: Json }
        Returns: Json
      }
      upsert_market_asset_prices_v1: { Args: { records: Json }; Returns: Json }
      upsert_market_exchange_rates_v1: {
        Args: { records: Json }
        Returns: Json
      }
      upsert_official_asset_events_v1: {
        Args: { input_batch: Json }
        Returns: Json
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
