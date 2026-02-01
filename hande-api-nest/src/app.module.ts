import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { DriversModule } from './drivers/drivers.module';
import { RidersModule } from './riders/riders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    AuthModule,
    DriversModule,
    RidersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
