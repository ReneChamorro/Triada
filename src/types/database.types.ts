export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          lastname: string | null
          phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          lastname?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          lastname?: string | null
          phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          short_description: string | null
          thumbnail_url: string | null
          price: number
          currency: string
          is_published: boolean
          video_url: string | null
          duration_minutes: number | null
          instructor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          short_description?: string | null
          thumbnail_url?: string | null
          price: number
          currency?: string
          is_published?: boolean
          video_url?: string | null
          duration_minutes?: number | null
          instructor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          short_description?: string | null
          thumbnail_url?: string | null
          price?: number
          currency?: string
          is_published?: boolean
          video_url?: string | null
          duration_minutes?: number | null
          instructor_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          course_id: string
          amount: number
          currency: string
          payment_method: string
          payment_id: string | null
          status: string
          proof_url: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          amount: number
          currency?: string
          payment_method: string
          payment_id?: string | null
          status?: string
          proof_url?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          amount?: number
          currency?: string
          payment_method?: string
          payment_id?: string | null
          status?: string
          proof_url?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_courses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          purchase_id: string | null
          access_granted_at: string
          expires_at: string | null
          last_accessed_at: string | null
          progress_percentage: number
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          purchase_id?: string | null
          access_granted_at?: string
          expires_at?: string | null
          last_accessed_at?: string | null
          progress_percentage?: number
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          purchase_id?: string | null
          access_granted_at?: string
          expires_at?: string | null
          last_accessed_at?: string | null
          progress_percentage?: number
        }
      }
    }
  }
}
