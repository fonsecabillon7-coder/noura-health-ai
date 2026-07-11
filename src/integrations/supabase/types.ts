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
          user_id?: string
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
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity: string | null
          age: number | null
          allergies: string[] | null
          carbs_goal: number
          cook_time: string | null
          created_at: string
          diets: string[] | null
          equipment: string[] | null
          fat_goal: number
          fiber_goal: number
          goal: string | null
          height_cm: number | null
          kcal_goal: number
          language: string
          locale: string
          measurement_system: string
          motivation: string | null
          name: string | null
          onboarded: boolean
          protein_goal: number
          target_weight_kg: number | null
          timezone: string
          updated_at: string
          user_id: string
          water_goal_ml: number
          weight_kg: number | null
        }
        Insert: {
          activity?: string | null
          age?: number | null
          allergies?: string[] | null
          carbs_goal?: number
          cook_time?: string | null
          created_at?: string
          diets?: string[] | null
          equipment?: string[] | null
          fat_goal?: number
          fiber_goal?: number
          goal?: string | null
          height_cm?: number | null
          kcal_goal?: number
          language?: string
          locale?: string
          measurement_system?: string
          motivation?: string | null
          name?: string | null
          onboarded?: boolean
          protein_goal?: number
          target_weight_kg?: number | null
          timezone?: string
          updated_at?: string
          user_id: string
          water_goal_ml?: number
          weight_kg?: number | null
        }
        Update: {
          activity?: string | null
          age?: number | null
          allergies?: string[] | null
          carbs_goal?: number
          cook_time?: string | null
          created_at?: string
          diets?: string[] | null
          equipment?: string[] | null
          fat_goal?: number
          fiber_goal?: number
          goal?: string | null
          height_cm?: number | null
          kcal_goal?: number
          language?: string
          locale?: string
          measurement_system?: string
          motivation?: string | null
          name?: string | null
          onboarded?: boolean
          protein_goal?: number
          target_weight_kg?: number | null
          timezone?: string
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
          servings: number | null
          steps: Json
          title: string
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
          servings?: number | null
          steps?: Json
          title: string
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
          servings?: number | null
          steps?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          id: string
          logged_at: string
          ml: number
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          ml: number
          user_id: string
        }
        Update: {
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
      [_ in never]: never
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
