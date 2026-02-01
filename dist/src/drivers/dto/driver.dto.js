"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverStatsResponseDto = exports.UpdateDriverLocationDto = exports.UpdateDriverProfileDto = exports.SubscribeDriverDto = void 0;
const class_validator_1 = require("class-validator");
class SubscribeDriverDto {
    amount;
}
exports.SubscribeDriverDto = SubscribeDriverDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SubscribeDriverDto.prototype, "amount", void 0);
class UpdateDriverProfileDto {
    licenseNumber;
    licenseExpiry;
    profilePicture;
    idDocument;
}
exports.UpdateDriverProfileDto = UpdateDriverProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "licenseExpiry", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "profilePicture", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDriverProfileDto.prototype, "idDocument", void 0);
class UpdateDriverLocationDto {
    latitude;
    longitude;
    heading;
    speed;
}
exports.UpdateDriverLocationDto = UpdateDriverLocationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDriverLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateDriverLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateDriverLocationDto.prototype, "heading", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateDriverLocationDto.prototype, "speed", void 0);
class DriverStatsResponseDto {
    totalTrips;
    completedTrips;
    cancelledTrips;
    totalEarnings;
    averageRating;
    subscriptionStatus;
    subscriptionExpiresAt;
    currentStreak;
}
exports.DriverStatsResponseDto = DriverStatsResponseDto;
//# sourceMappingURL=driver.dto.js.map