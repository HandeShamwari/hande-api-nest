"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversModule = void 0;
const common_1 = require("@nestjs/common");
const drivers_controller_1 = require("./controllers/drivers.controller");
const vehicles_controller_1 = require("./controllers/vehicles.controller");
const drivers_service_1 = require("./services/drivers.service");
const vehicles_service_1 = require("./services/vehicles.service");
const shared_module_1 = require("../shared/shared.module");
let DriversModule = class DriversModule {
};
exports.DriversModule = DriversModule;
exports.DriversModule = DriversModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [drivers_controller_1.DriversController, vehicles_controller_1.VehiclesController],
        providers: [drivers_service_1.DriversService, vehicles_service_1.VehiclesService],
        exports: [drivers_service_1.DriversService, vehicles_service_1.VehiclesService],
    })
], DriversModule);
//# sourceMappingURL=drivers.module.js.map