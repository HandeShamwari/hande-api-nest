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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const bids_service_1 = require("../services/bids.service");
const create_bid_dto_1 = require("../dto/create-bid.dto");
let BidsController = class BidsController {
    bidsService;
    constructor(bidsService) {
        this.bidsService = bidsService;
    }
    async createBid(tripId, userId, dto) {
        return this.bidsService.createBid(tripId, userId, dto);
    }
    async getTripBids(tripId, userId) {
        return this.bidsService.getTripBids(tripId, userId);
    }
    async acceptBid(bidId, userId) {
        return this.bidsService.acceptBid(bidId, userId);
    }
    async getDriverBids(userId, status) {
        return this.bidsService.getDriverBids(userId, status);
    }
};
exports.BidsController = BidsController;
__decorate([
    (0, common_1.Post)('trips/:tripId'),
    __param(0, (0, common_1.Param)('tripId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_bid_dto_1.CreateBidDto]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "createBid", null);
__decorate([
    (0, common_1.Get)('trips/:tripId'),
    __param(0, (0, common_1.Param)('tripId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "getTripBids", null);
__decorate([
    (0, common_1.Post)(':bidId/accept'),
    __param(0, (0, common_1.Param)('bidId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "acceptBid", null);
__decorate([
    (0, common_1.Get)('my-bids'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BidsController.prototype, "getDriverBids", null);
exports.BidsController = BidsController = __decorate([
    (0, common_1.Controller)('bids'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [bids_service_1.BidsService])
], BidsController);
//# sourceMappingURL=bids.controller.js.map