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
      analytics_events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_on: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          frequency: string
          icon: string
          id: string
          name: string
          reminder_time: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          frequency?: string
          icon?: string
          id?: string
          name: string
          reminder_time?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          frequency?: string
          icon?: string
          id?: string
          name?: string
          reminder_time?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hotmart_events: {
        Row: {
          created_at: string
          email: string | null
          error: string | null
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          carbs: number
          created_at: string
          eaten_at: string
          fat: number
          fiber: number
          id: string
          image_url: string | null
          kcal: number
          name: string
          protein: number
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          eaten_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_url?: string | null
          kcal?: number
          name: string
          protein?: number
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs?: number
          created_at?: string
          eaten_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_url?: string | null
          kcal?: number
          name?: string
          protein?: number
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_settings: {
        Row: {
          active: boolean
          checkout_url: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          price_usd: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          price_usd?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          price_usd?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acquisition_source: string | null
          activity_level: string | null
          age: number | null
          allergies: Json
          avoided_foods: Json
          body_goal: string | null
          carbs_goal: number
          challenge: string | null
          cook_time: string | null
          country: string | null
          created_at: string
          diets: Json
          email: string | null
          equipment: Json
          fat_goal: number
          favorite_foods: Json
          fiber_goal: number
          goal: string | null
          height_cm: number | null
          hydration_habit: string | null
          id: string
          is_admin: boolean | null
          kcal_goal: number
          language: string
          last_active_at: string | null
          measurement_system: string
          motivation: string | null
          name: string | null
          nutrition_style: string | null
          onboarding_completed: boolean
          plan: string
          protein_goal: number
          target_weight_kg: number | null
          timezone: string | null
          updated_at: string
          user_id: string
          water_goal_ml: number
          weight_kg: number | null
        }
        Insert: {
          acquisition_source?: string | null
          activity_level?: string | null
          age?: number | null
          allergies?: Json
          avoided_foods?: Json
          body_goal?: string | null
          carbs_goal?: number
          challenge?: string | null
          cook_time?: string | null
          country?: string | null
          created_at?: string
          diets?: Json
          email?: string | null
          equipment?: Json
          fat_goal?: number
          favorite_foods?: Json
          fiber_goal?: number
          goal?: string | null
          height_cm?: number | null
          hydration_habit?: string | null
          id?: string
          is_admin?: boolean | null
          kcal_goal?: number
          language?: string
          last_active_at?: string | null
          measurement_system?: string
          motivation?: string | null
          name?: string | null
          nutrition_style?: string | null
          onboarding_completed?: boolean
          plan?: string
          protein_goal?: number
          target_weight_kg?: number | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          water_goal_ml?: number
          weight_kg?: number | null
        }
        Update: {
          acquisition_source?: string | null
          activity_level?: string | null
          age?: number | null
          allergies?: Json
          avoided_foods?: Json
          body_goal?: string | null
          carbs_goal?: number
          challenge?: string | null
          cook_time?: string | null
          country?: string | null
          created_at?: string
          diets?: Json
          email?: string | null
          equipment?: Json
          fat_goal?: number
          favorite_foods?: Json
          fiber_goal?: number
          goal?: string | null
          height_cm?: number | null
          hydration_habit?: string | null
          id?: string
          is_admin?: boolean | null
          kcal_goal?: number
          language?: string
          last_active_at?: string | null
          measurement_system?: string
          motivation?: string | null
          name?: string | null
          nutrition_style?: string | null
          onboarding_completed?: boolean
          plan?: string
          protein_goal?: number
          target_weight_kg?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          water_goal_ml?: number
          weight_kg?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: Json
          language: string
          macros: Json
          prep_minutes: number | null
          servings: number
          steps: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          language?: string
          macros?: Json
          prep_minutes?: number | null
          servings?: number
          steps?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          language?: string
          macros?: Json
          prep_minutes?: number | null
          servings?: number
          steps?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          carbs: number
          confidence: number | null
          created_at: string
          fat: number
          fiber: number
          id: string
          image_url: string | null
          ingredients: Json
          kcal: number
          logged: boolean
          name: string
          portion: string | null
          protein: number
          scanned_at: string
          user_id: string
        }
        Insert: {
          carbs?: number
          confidence?: number | null
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          kcal?: number
          logged?: boolean
          name: string
          portion?: string | null
          protein?: number
          scanned_at?: string
          user_id: string
        }
        Update: {
          carbs?: number
          confidence?: number | null
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          image_url?: string | null
          ingredients?: Json
          kcal?: number
          logged?: boolean
          name?: string
          portion?: string | null
          protein?: number
          scanned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string | null
          checked: boolean
          created_at: string
          id: string
          name: string
          quantity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          name: string
          quantity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          quantity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancelled_date: string | null
          created_at: string
          hotmart_subscriber_code: string | null
          hotmart_transaction: string | null
          hotmart_user_id: string | null
          id: string
          next_payment_date: string | null
          plan_type: string
          price_usd: number
          product_id: string | null
          status: string
          subscription_start_date: string | null
          trial_active: boolean
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancelled_date?: string | null
          created_at?: string
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          hotmart_user_id?: string | null
          id?: string
          next_payment_date?: string | null
          plan_type?: string
          price_usd?: number
          product_id?: string | null
          status?: string
          subscription_start_date?: string | null
          trial_active?: boolean
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancelled_date?: string | null
          created_at?: string
          hotmart_subscriber_code?: string | null
          hotmart_transaction?: string | null
          hotmart_user_id?: string | null
          id?: string
          next_payment_date?: string | null
          plan_type?: string
          price_usd?: number
          product_id?: string | null
          status?: string
          subscription_start_date?: string | null
          trial_active?: boolean
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          ml: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          ml: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          ml?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_premium: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
