import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      configService.get<string>('SUPABASE_URL') || '',
      configService.get<string>('SUPABASE_KEY') || '',
      {
        auth: {
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
