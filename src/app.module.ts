import { Module } from "@nestjs/common";
import { UploadModule } from "./upload/upload.module";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JWTAuthGuard } from "./auth/jwt-auth.guard";
import { SupabaseModule } from "./supabase/supabase.module";
import { ConfigModule } from "@nestjs/config";
import { InvoiceModule } from "./invoice/invoice.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    UploadModule,
    AuthModule,
    SupabaseModule,
    InvoiceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JWTAuthGuard,
    },
  ],
})
export class AppModule {}
