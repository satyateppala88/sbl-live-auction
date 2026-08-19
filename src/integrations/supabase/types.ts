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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      auction_state: {
        Row: {
          bid_increment: number
          bidding_open: boolean
          current_player_id: string | null
          id: number
          round_type: string
          updated_at: string
        }
        Insert: {
          bid_increment?: number
          bidding_open?: boolean
          current_player_id?: string | null
          id?: number
          round_type?: string
          updated_at?: string
        }
        Update: {
          bid_increment?: number
          bidding_open?: boolean
          current_player_id?: string | null
          id?: number
          round_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_state_current_player_id_fkey"
            columns: ["current_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          created_at: string
          id: string
          player_id: string
          team_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          player_id: string
          team_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          base_price: number
          category: Database["public"]["Enums"]["player_category"]
          created_at: string
          id: string
          name: string
          original_base_price: number
          photo_url: string | null
          sold_price: number | null
          sold_to_team_id: string | null
          status: Database["public"]["Enums"]["player_status"]
          tier_id: string | null
        }
        Insert: {
          base_price?: number
          category?: Database["public"]["Enums"]["player_category"]
          created_at?: string
          id?: string
          name: string
          original_base_price?: number
          photo_url?: string | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          tier_id?: string | null
        }
        Update: {
          base_price?: number
          category?: Database["public"]["Enums"]["player_category"]
          created_at?: string
          id?: string
          name?: string
          original_base_price?: number
          photo_url?: string | null
          sold_price?: number | null
          sold_to_team_id?: string | null
          status?: Database["public"]["Enums"]["player_status"]
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_sold_to_team_id_fkey"
            columns: ["sold_to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      team_secrets: {
        Row: {
          pin: string
          team_id: string
        }
        Insert: {
          pin: string
          team_id: string
        }
        Update: {
          pin?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_secrets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_name: string
          captain_photo_url: string | null
          color: string
          created_at: string
          id: string
          logo_url: string | null
          max_roster_size: number
          name: string
          remaining_budget: number
          starting_budget: number
        }
        Insert: {
          captain_name?: string
          captain_photo_url?: string | null
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          max_roster_size?: number
          name: string
          remaining_budget?: number
          starting_budget?: number
        }
        Update: {
          captain_name?: string
          captain_photo_url?: string | null
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          max_roster_size?: number
          name?: string
          remaining_budget?: number
          starting_budget?: number
        }
        Relationships: []
      }
      tiers: {
        Row: {
          base_price: number
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      player_category: "male" | "female" | "kid"
      player_status:
        | "available"
        | "on_auction"
        | "sold"
        | "unsold"
        | "in_unsold_pool"
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
      player_category: ["male", "female", "kid"],
      player_status: [
        "available",
        "on_auction",
        "sold",
        "unsold",
        "in_unsold_pool",
      ],
    },
  },
} as const
